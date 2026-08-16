-- ============================================================
-- DANPA MADERAS - Seguridad Fase 1 (fixes críticos de auditoría)
--
-- Proyecto: vduqsxnuflbspmbufpdi
-- 1) handle_new_user(): NO confía en raw_user_meta_data->>'perfil'
--    (user-editable, escalada a admin). Siempre crea 'corredor';
--    el perfil real lo asigna admin_crear_usuario() (SECURITY DEFINER).
-- 2) admin_crear_usuario(): whitelist de perfil + crea la fila en
--    usuarios con el perfil correcto (el trigger ya no lee metadata).
-- 3) is_admin(): además exige activo (un admin bloqueado pierde poder).
-- 4) REVOKE ALL on notificaciones FROM anon (GRANT latente peligroso).
-- 5) productos: UPDATE solo admin/ventas activos (INSERT queda abierto
--    porque el formulario de pedido crea productos en línea).
--
-- Idempotente. Ejecutar en el SQL Editor.
-- ============================================================

-- 1) Trigger: siempre 'corredor', ignora el perfil que venga en metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 2) admin_crear_usuario: whitelist + fila en usuarios con el perfil real.
CREATE OR REPLACE FUNCTION public.admin_crear_usuario(
  p_nombre text,
  p_email text,
  p_password text,
  p_perfil text DEFAULT 'corredor'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  v_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', lower(p_email),
          crypt(p_password, gen_salt('bf')),
          now(),
          '{"provider":"email","providers":["email"]}',
          jsonb_build_object('nombre', p_nombre),
          now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_id, lower(p_email), 'email',
          jsonb_build_object('sub', v_id::text, 'email', lower(p_email)),
          now(), now(), now());

  -- El trigger on_auth_user_created ya insertó 'corredor'; aquí se
  -- corrige al perfil que eligió el admin (SECURITY DEFINER => bypass RLS).
  INSERT INTO public.usuarios (id, email, nombre, perfil, activo)
  VALUES (v_id, lower(p_email), p_nombre, p_perfil, true)
  ON CONFLICT (id) DO UPDATE
    SET email = excluded.email, nombre = excluded.nombre, perfil = excluded.perfil;

  RETURN v_id;
END $$;

-- 3) is_admin: exige usuario activo.
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

-- 4) Notificaciones: sacar a anon (RLS activa + políticas own_* ya existen).
REVOKE ALL ON TABLE public.notificaciones FROM anon;

-- 5) Productos: UPDATE solo admin/ventas activos.
DROP POLICY IF EXISTS cat_update_productos ON public.productos;
CREATE POLICY "cat_update_productos" ON public.productos FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.activo AND u.perfil IN ('admin', 'ventas')))
WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.activo AND u.perfil IN ('admin', 'ventas')));

-- 6) RPC para descontar stock al crear pedidos: cualquier autenticado
--    puede llamarlo (es el flujo de venta), pero el UPDATE directo de
--    productos queda restringido a admin/ventas por la política de 5).
--    p_cantidad numeric para coincidir con pedido_items.cantidad (numeric).
CREATE OR REPLACE FUNCTION public.descontar_stock(p_producto_id uuid, p_cantidad numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
REVOKE EXECUTE ON FUNCTION public.descontar_stock FROM anon, service_role, public;
GRANT EXECUTE ON FUNCTION public.descontar_stock TO authenticated;

-- Perfil 'ventas' y 'admin' ya tienen EXECUTE de is_admin (heredado),
-- pero se asegura el grant para las políticas que lo usan.
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
