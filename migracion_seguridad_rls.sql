-- ============================================================
-- DANPA MADERAS - Seguridad: RLS + políticas por corredor + RPCs admin
--
-- Proyecto: vduqsxnuflbspmbufpdi
-- 1) Activa RLS en las 12 tablas.
-- 2) Políticas: cada usuario autenticado solo ve/edita sus filas
--    (corredor_id = auth.uid()). pedido_items vía pedidos.
--    productos = catálogo compartido (delete solo admin).
--    usuarios = propia fila + admin.
-- 3) danpamaderas pasa a perfil 'admin'.
-- 4) Crea los RPCs de admin que usa la app (listar, crear, activar,
--    cambiar contraseña) como SECURITY DEFINER con chequeo is_admin().
--
-- Ejecutable sin daño (idempotente salvo los create policy si
-- se re-ejecuta: las políticas ya existentes fallarían, se puede
-- borrar con drop policy). Aplicado una sola vez vía migración.
-- ============================================================

-- 1) danpamaderas como admin
UPDATE public.usuarios
SET perfil = 'admin'
WHERE email = 'danpamaderas@gmail.com';

-- 2) Activar RLS en todas las tablas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_opciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitas ENABLE ROW LEVEL SECURITY;

-- 3) Políticas por corredor (tablas con corredor_id)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['agenda','cliente_notas','clientes','movimientos','movimientos_opciones','notificaciones','pedidos','podas','visitas'] LOOP
    EXECUTE format('CREATE POLICY "own_select_%s" ON public.%I FOR SELECT TO authenticated USING (corredor_id = auth.uid())', t, t);
    EXECUTE format('CREATE POLICY "own_insert_%s" ON public.%I FOR INSERT TO authenticated WITH CHECK (corredor_id = auth.uid())', t, t);
    EXECUTE format('CREATE POLICY "own_update_%s" ON public.%I FOR UPDATE TO authenticated USING (corredor_id = auth.uid()) WITH CHECK (corredor_id = auth.uid())', t, t);
    EXECUTE format('CREATE POLICY "own_delete_%s" ON public.%I FOR DELETE TO authenticated USING (corredor_id = auth.uid())', t, t);
  END LOOP;
END $$;

-- 4) pedido_items: scope vía pedidos
CREATE POLICY "own_select_pedido_items" ON public.pedido_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = pedido_items.pedido_id AND p.corredor_id = auth.uid())
);
CREATE POLICY "own_insert_pedido_items" ON public.pedido_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = pedido_items.pedido_id AND p.corredor_id = auth.uid())
);
CREATE POLICY "own_update_pedido_items" ON public.pedido_items FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = pedido_items.pedido_id AND p.corredor_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = pedido_items.pedido_id AND p.corredor_id = auth.uid())
);
CREATE POLICY "own_delete_pedido_items" ON public.pedido_items FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = pedido_items.pedido_id AND p.corredor_id = auth.uid())
);

-- 5) productos: catálogo compartido (solo autenticados; delete solo admin)
CREATE POLICY "cat_select_productos" ON public.productos FOR SELECT TO authenticated USING (true);
CREATE POLICY "cat_insert_productos" ON public.productos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "cat_update_productos" ON public.productos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "cat_delete_productos" ON public.productos FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.perfil = 'admin')
);

-- 6) usuarios: propia fila + admin
CREATE POLICY "usuarios_select" ON public.usuarios FOR SELECT TO authenticated USING (
  id = auth.uid() OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.perfil = 'admin')
);
CREATE POLICY "usuarios_insert" ON public.usuarios FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.perfil = 'admin')
);
CREATE POLICY "usuarios_update" ON public.usuarios FOR UPDATE TO authenticated USING (
  id = auth.uid() OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.perfil = 'admin')
) WITH CHECK (
  id = auth.uid() OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.perfil = 'admin')
);
CREATE POLICY "usuarios_delete" ON public.usuarios FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.perfil = 'admin')
);

-- 7) RPCs admin (SECURITY DEFINER con chequeo)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND perfil = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.admin_listar_usuarios()
RETURNS SETOF public.usuarios
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  RETURN QUERY SELECT * FROM public.usuarios ORDER BY created_at DESC;
END $$;

CREATE OR REPLACE FUNCTION public.admin_crear_usuario(p_nombre text, p_email text, p_password text, p_perfil text DEFAULT 'corredor')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  v_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', lower(p_email),
          crypt(p_password, gen_salt('bf')),
          now(),
          '{"provider":"email","providers":["email"]}',
          jsonb_build_object('nombre', p_nombre, 'perfil', p_perfil),
          now(), now());
  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_id, lower(p_email), 'email',
          jsonb_build_object('sub', v_id::text, 'email', lower(p_email)),
          now(), now(), now());
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_activo(p_user_id uuid, p_activo boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  UPDATE public.usuarios SET activo = p_activo WHERE id = p_user_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_password(p_user_id uuid, p_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  UPDATE auth.users SET encrypted_password = crypt(p_password, gen_salt('bf')) WHERE id = p_user_id;
END $$;

-- 8) Solo usuarios autenticados pueden ejecutar los RPCs
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public;
REVOKE EXECUTE ON FUNCTION public.admin_listar_usuarios() FROM public;
REVOKE EXECUTE ON FUNCTION public.admin_crear_usuario(text, text, text, text) FROM public;
REVOKE EXECUTE ON FUNCTION public.admin_set_activo(uuid, boolean) FROM public;
REVOKE EXECUTE ON FUNCTION public.admin_set_password(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_listar_usuarios() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_crear_usuario(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_activo(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_password(uuid, text) TO authenticated;
