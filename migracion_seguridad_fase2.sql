-- ============================================================
-- DANPA MADERAS - Seguridad Fase 2 (M2): search_path hardening
--
-- Proyecto: vduqsxnuflbspmbufpdi
-- Endurece las funciones SECURITY DEFINER: search_path = pg_catalog
-- y referencias a extensiones calificadas (extensions.crypt, etc.).
-- Evita hijack de funciones/tablas si algún rol llegara a obtener
-- CREATE en un schema del search_path.
--
-- Idempotente. Ejecutar en el SQL Editor.
-- ============================================================

-- is_admin: sin dependencias de extensiones; referencias calificadas.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND perfil = 'admin' AND activo
  );
$$;

-- admin_listar_usuarios
CREATE OR REPLACE FUNCTION public.admin_listar_usuarios()
RETURNS SETOF public.usuarios
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  RETURN QUERY SELECT * FROM public.usuarios ORDER BY created_at DESC;
END $$;

-- admin_crear_usuario (extensiones calificadas)
CREATE OR REPLACE FUNCTION public.admin_crear_usuario(
  p_nombre text,
  p_email text,
  p_password text,
  p_perfil text DEFAULT 'corredor'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  IF p_perfil NOT IN ('admin', 'ventas', 'corredor') THEN
    RAISE EXCEPTION 'Perfil inválido';
  END IF;
  IF char_length(p_password) < 6 THEN
    RAISE EXCEPTION 'La contraseña debe tener al menos 6 caracteres';
  END IF;
  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower(p_email)) THEN
    RAISE EXCEPTION 'Ya existe un usuario con ese email';
  END IF;

  v_id := extensions.gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', lower(p_email),
          extensions.crypt(p_password, extensions.gen_salt('bf')),
          now(),
          '{"provider":"email","providers":["email"]}',
          jsonb_build_object('nombre', p_nombre),
          now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  VALUES (extensions.gen_random_uuid(), v_id, lower(p_email), 'email',
          jsonb_build_object('sub', v_id::text, 'email', lower(p_email)),
          now(), now(), now());

  INSERT INTO public.usuarios (id, email, nombre, perfil, activo)
  VALUES (v_id, lower(p_email), p_nombre, p_perfil, true)
  ON CONFLICT (id) DO UPDATE
    SET email = excluded.email, nombre = excluded.nombre, perfil = excluded.perfil;

  RETURN v_id;
END $$;

-- admin_set_activo
CREATE OR REPLACE FUNCTION public.admin_set_activo(p_user_id uuid, p_activo boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  UPDATE public.usuarios SET activo = p_activo WHERE id = p_user_id;
END $$;

-- admin_set_password (extensiones calificadas)
CREATE OR REPLACE FUNCTION public.admin_set_password(p_user_id uuid, p_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  IF char_length(p_password) < 6 THEN
    RAISE EXCEPTION 'La contraseña debe tener al menos 6 caracteres';
  END IF;
  UPDATE auth.users
  SET encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
      updated_at = now()
  WHERE id = p_user_id;
END $$;

-- descontar_stock
CREATE OR REPLACE FUNCTION public.descontar_stock(p_producto_id uuid, p_cantidad numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE v_stock double precision;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;
  IF p_cantidad <= 0 THEN
    RAISE EXCEPTION 'Cantidad inválida';
  END IF;
  UPDATE public.productos
  SET stock = stock - p_cantidad
  WHERE id = p_producto_id AND stock >= p_cantidad
  RETURNING stock INTO v_stock;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock insuficiente para procesar el pedido.';
  END IF;
END;
$$;

-- handle_new_user (trigger): referencias calificadas.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nombre, perfil, activo)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(COALESCE(NEW.email, ''), '@', 1)),
    'corredor',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- listar_vendedores
CREATE OR REPLACE FUNCTION public.listar_vendedores()
RETURNS SETOF public.usuarios
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT * FROM public.usuarios WHERE activo = true AND perfil IN ('ventas', 'corredor') ORDER BY nombre;
$$;

-- on_pedido_estado_pago (trigger): referencias calificadas.
CREATE OR REPLACE FUNCTION public.on_pedido_estado_pago()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF NEW.estado_pago = 'pagado' AND OLD.estado_pago IS DISTINCT FROM 'pagado' THEN
    IF NEW.monto_pagado > 0 AND NOT EXISTS (
      SELECT 1 FROM public.movimientos WHERE pedido_id = NEW.id
    ) THEN
      INSERT INTO public.movimientos (
        corredor_id, tipo, concepto, monto, categoria, fecha, notas, creado_por, pedido_id
      ) VALUES (
        NEW.corredor_id,
        'ingreso',
        'Cobro pedido ' || left(NEW.id::text, 8),
        NEW.monto_pagado,
        'ventas',
        COALESCE(NEW.fecha_pago::date, CURRENT_DATE),
        'Cobro automático del pedido',
        NEW.corredor_id,
        NEW.id
      );
    END IF;
  ELSIF OLD.estado_pago = 'pagado' AND NEW.estado_pago IS DISTINCT FROM 'pagado' THEN
    DELETE FROM public.movimientos WHERE pedido_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Permisos consistentes
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.listar_vendedores() FROM anon, service_role, public;
GRANT EXECUTE ON FUNCTION public.listar_vendedores() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.descontar_stock(uuid, numeric) FROM anon, service_role, public;
GRANT EXECUTE ON FUNCTION public.descontar_stock(uuid, numeric) TO authenticated;
