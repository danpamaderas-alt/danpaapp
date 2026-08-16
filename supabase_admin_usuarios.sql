-- ============================================================
-- DANPA MADERAS - Administración de usuarios (solo admin)
-- Funciones SECURITY DEFINER para crear usuarios, cambiar
-- perfil/acceso y contraseña desde la app.
--
-- Cómo usar:
--   1. SQL Editor en el dashboard de Supabase
--      (https://supabase.com/dashboard/project/jxjmdlnuwfpgocxypcvb/sql)
--   2. Pegá TODO este archivo y ejecutalo.
--   3. En la app, logueate con admin@danpa.com y entrá al menú
--      "Usuarios" (visible solo para perfil admin).
-- ============================================================

-- ¿El usuario actual es un admin activo?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND perfil = 'admin' AND activo
  );
$$;

-- Listar todos los usuarios (solo admin)
CREATE OR REPLACE FUNCTION public.admin_listar_usuarios()
RETURNS SETOF public.usuarios
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.usuarios
  WHERE public.is_admin()
  ORDER BY activo DESC, created_at DESC;
$$;

-- Crear un usuario con perfil (solo admin).
-- Crea la cuenta de auth; la fila en usuarios la crea el trigger
-- on_auth_user_created (siempre 'corredor', Fase 1) y acá se corrige
-- el perfil al que eligió el admin (SECURITY DEFINER => bypass RLS).
CREATE OR REPLACE FUNCTION public.admin_crear_usuario(
  p_nombre text,
  p_email text,
  p_password text,
  p_perfil text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_id uuid := gen_random_uuid();
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo el admin puede crear usuarios';
  END IF;

  IF p_perfil NOT IN ('admin', 'ventas', 'corredor') THEN
    RAISE EXCEPTION 'Perfil inválido';
  END IF;

  IF char_length(p_password) < 6 THEN
    RAISE EXCEPTION 'La contraseña debe tener al menos 6 caracteres';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower(p_email)) THEN
    RAISE EXCEPTION 'Ya existe un usuario con ese email';
  END IF;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, confirmation_token, recovery_token,
    email_change, email_change_token_new, email_change_token_current,
    reauthentication_token, phone_change_token,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_id,
    'authenticated',
    'authenticated',
    lower(p_email),
    crypt(p_password, gen_salt('bf', 10)),
    now(),
    '', '', '', '', '', '', '',
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'sub', v_id::text,
      'email', lower(p_email),
      'email_verified', true,
      'phone_verified', false,
      'nombre', p_nombre
    ),
    now(),
    now()
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_id,
    jsonb_build_object(
      'sub', v_id::text,
      'email', lower(p_email),
      'email_verified', false,
      'phone_verified', false
    ),
    'email',
    v_id,
    now(),
    now(),
    now()
  );

  INSERT INTO public.usuarios (id, email, nombre, perfil, activo)
  VALUES (v_id, lower(p_email), p_nombre, p_perfil, true)
  ON CONFLICT (id) DO UPDATE
    SET email = excluded.email, nombre = excluded.nombre, perfil = excluded.perfil;

  RETURN v_id;
END;
$$;

-- Activar / desactivar el acceso de un usuario (solo admin)
CREATE OR REPLACE FUNCTION public.admin_set_activo(p_user_id uuid, p_activo boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo el admin puede modificar usuarios';
  END IF;

  UPDATE public.usuarios SET activo = p_activo WHERE id = p_user_id;
END;
$$;

-- Cambiar la contraseña de un usuario (solo admin)
CREATE OR REPLACE FUNCTION public.admin_set_password(p_user_id uuid, p_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo el admin puede cambiar contraseñas';
  END IF;

  IF char_length(p_password) < 6 THEN
    RAISE EXCEPTION 'La contraseña debe tener al menos 6 caracteres';
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(p_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = p_user_id;
END;
$$;
