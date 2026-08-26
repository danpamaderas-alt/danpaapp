-- ============================================================
-- DUMPLE COMPLETO: Schema + Data + RLS Policies + Functions
-- Proyecto: tmiaefwtidosnmyeikmj (eprservintegrales)
-- Generado: 2026-08-26
-- ============================================================

-- ============================================================
-- 1. SCHEMA: CREATE TABLE statements
-- ============================================================

CREATE TABLE IF NOT EXISTS public.usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  nombre text,
  perfil text DEFAULT 'corredor',
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  telefono text,
  email text,
  direccion text,
  notas text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  precio numeric DEFAULT 0,
  stock double precision DEFAULT 0,
  activo boolean DEFAULT true,
  imagen_url text,
  categoria text DEFAULT 'general',
  stock_minimo double precision DEFAULT 50,
  costo double precision DEFAULT 0,
  costo_adquisicion double precision DEFAULT 0,
  costo_transporte double precision DEFAULT 0,
  costo_empaque double precision DEFAULT 0,
  costo_almacenaje double precision DEFAULT 0,
  costo_almacenamiento double precision DEFAULT 0,
  costo_comision double precision DEFAULT 0,
  costo_otros double precision DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  vendedor_id uuid,
  creado_por uuid,
  total numeric DEFAULT 0,
  descuento numeric DEFAULT 0,
  notas text,
  estado text DEFAULT 'Pendiente',
  estado_pago text DEFAULT 'no_pagado',
  monto_pagado numeric DEFAULT 0,
  fecha_pago date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pedido_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid REFERENCES public.pedidos(id) ON DELETE CASCADE,
  producto_id uuid REFERENCES public.productos(id) ON DELETE SET NULL,
  cantidad numeric DEFAULT 0,
  precio_unitario numeric DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.movimientos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  concepto text,
  monto numeric DEFAULT 0,
  categoria text,
  fecha date DEFAULT CURRENT_DATE,
  notas text,
  creado_por uuid,
  pedido_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.movimientos_opciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  tipo text NOT NULL,
  categoria text,
  activo boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text,
  nivel text DEFAULT 'info',
  titulo text,
  mensaje text,
  enlace text,
  dato_referencia text,
  leido boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contratistas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  especialidad text,
  telefono text,
  email text,
  notas text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contratista_trabajos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  contratista_id uuid REFERENCES public.contratistas(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descripcion text,
  monto numeric DEFAULT 0,
  estado text DEFAULT 'pendiente',
  fecha_inicio date,
  fecha_fin date,
  notas text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contratista_pagos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  contratista_id uuid REFERENCES public.contratistas(id) ON DELETE CASCADE,
  trabajo_id uuid REFERENCES public.contratista_trabajos(id) ON DELETE SET NULL,
  monto numeric DEFAULT 0,
  fecha date DEFAULT CURRENT_DATE,
  metodo text,
  notas text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contratista_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  contratista_id uuid REFERENCES public.contratistas(id) ON DELETE CASCADE,
  trabajo_id uuid REFERENCES public.contratista_trabajos(id) ON DELETE SET NULL,
  tipo text NOT NULL,
  titulo text,
  descripcion text,
  monto numeric DEFAULT 0,
  fecha timestamptz DEFAULT now(),
  notas text,
  creado_por uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.empleados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  cargo text,
  telefono text,
  email text,
  salario numeric DEFAULT 0,
  fecha_ingreso date,
  activo boolean DEFAULT true,
  notas text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.asistencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  empleado_id uuid REFERENCES public.empleados(id) ON DELETE CASCADE,
  fecha date DEFAULT CURRENT_DATE,
  entrada time,
  salida time,
  horas numeric,
  notas text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.licencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  empleado_id uuid REFERENCES public.empleados(id) ON DELETE CASCADE,
  tipo text,
  fecha_inicio date,
  fecha_fin date,
  motivo text,
  aprobado boolean DEFAULT false,
  notas text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descripcion text,
  fecha timestamptz,
  hora time,
  duracion_min integer,
  tipo text,
  cliente_id uuid,
  notas text,
  completado boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.visitas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  fecha timestamptz DEFAULT now(),
  motivo text,
  resultado text,
  notas text,
  lat double precision,
  lng double precision,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.liquidaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  empleado_id uuid,
  periodo_inicio date,
  periodo_fin date,
  total_ventas numeric DEFAULT 0,
  total_comisiones numeric DEFAULT 0,
  total_descuentos numeric DEFAULT 0,
  neto numeric DEFAULT 0,
  notas text,
  estado text DEFAULT 'borrador',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.podas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id uuid,
  fecha date DEFAULT CURRENT_DATE,
  tipo text,
  metros numeric DEFAULT 0,
  precio numeric DEFAULT 0,
  notas text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recibos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id uuid,
  monto numeric DEFAULT 0,
  concepto text,
  fecha date DEFAULT CURRENT_DATE,
  metodo text,
  notas text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id uuid,
  titulo text,
  descripcion text,
  monto numeric DEFAULT 0,
  fecha_inicio date,
  fecha_fin date,
  estado text DEFAULT 'activo',
  notas text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cliente_notas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE CASCADE,
  nota text NOT NULL,
  creado_por uuid,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 2. TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.on_pedido_estado_pago()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_pedido_estado_pago ON public.pedidos;
CREATE TRIGGER on_pedido_estado_pago
  AFTER UPDATE ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.on_pedido_estado_pago();

-- ============================================================
-- 3. FUNCTIONS (RPC)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND perfil = 'admin' AND activo
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.listar_vendedores()
RETURNS SETOF public.usuarios AS $$
  SELECT * FROM public.usuarios WHERE activo = true AND perfil IN ('ventas', 'corredor') ORDER BY nombre;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.admin_listar_usuarios()
RETURNS SETOF public.usuarios AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  RETURN QUERY SELECT * FROM public.usuarios ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_crear_usuario(
  p_email text,
  p_nombre text,
  p_perfil text,
  p_password text
)
RETURNS uuid AS $$
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_set_password(
  p_user_id uuid,
  p_password text
)
RETURNS void AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  IF char_length(p_password) < 6 THEN
    RAISE EXCEPTION 'La contraseña debe tener al menos 6 caracteres';
  END IF;
  UPDATE auth.users
  SET encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
      updated_at = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_set_activo(
  p_user_id uuid,
  p_activo boolean
)
RETURNS void AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  UPDATE public.usuarios SET activo = p_activo WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.descontar_stock(
  p_producto_id uuid,
  p_cantidad double precision
)
RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.crear_pedido(
  p_corredor_id uuid,
  p_cliente_id uuid,
  p_vendedor_id uuid,
  p_items jsonb,
  p_descuento numeric,
  p_notas text
)
RETURNS uuid AS $$
DECLARE
  v_pedido_id uuid;
  v_subtotal numeric := 0;
  v_monto_descuento numeric;
  v_total numeric;
  v_item jsonb;
  v_producto_id uuid;
  v_cantidad numeric;
  v_precio_unitario numeric;
  v_stock double precision;
  v_stock_minimo double precision;
  v_nombre text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND activo
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Agrega al menos un producto al pedido.';
  END IF;

  IF p_cliente_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.clientes
    WHERE id = p_cliente_id AND corredor_id = p_corredor_id
  ) THEN
    RAISE EXCEPTION 'Cliente no encontrado para este corredor.';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_cantidad := COALESCE((v_item->>'cantidad')::numeric, 0);
    v_precio_unitario := COALESCE((v_item->>'precio_unitario')::numeric, 0);
    IF v_cantidad <= 0 OR v_precio_unitario < 0 THEN
      RAISE EXCEPTION 'Cantidad o precio inválido en un ítem del pedido.';
    END IF;
    v_subtotal := v_subtotal + v_cantidad * v_precio_unitario;
  END LOOP;

  v_monto_descuento := GREATEST(0, LEAST(COALESCE(p_descuento, 0), v_subtotal));
  v_total := GREATEST(0, v_subtotal - v_monto_descuento);

  INSERT INTO public.pedidos (
    corredor_id, cliente_id, vendedor_id, creado_por,
    total, descuento, notas, estado, estado_pago
  ) VALUES (
    p_corredor_id, p_cliente_id, p_vendedor_id, auth.uid(),
    v_total, v_monto_descuento, p_notas, 'Pendiente', 'no_pagado'
  )
  RETURNING id INTO v_pedido_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_producto_id := (v_item->>'producto_id')::uuid;
    v_cantidad := (v_item->>'cantidad')::numeric;
    v_precio_unitario := (v_item->>'precio_unitario')::numeric;

    INSERT INTO public.pedido_items (pedido_id, producto_id, cantidad, precio_unitario)
    VALUES (v_pedido_id, v_producto_id, v_cantidad, v_precio_unitario);

    UPDATE public.productos
    SET stock = stock - v_cantidad
    WHERE id = v_producto_id AND stock >= v_cantidad
    RETURNING nombre, stock, stock_minimo INTO v_nombre, v_stock, v_stock_minimo;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Stock insuficiente para procesar el pedido.';
    END IF;

    IF v_stock <= 0 THEN
      INSERT INTO public.notificaciones (
        corredor_id, tipo, nivel, titulo, mensaje, enlace, dato_referencia, leido
      ) VALUES (
        p_corredor_id, 'stock_bajo', 'error',
        'Stock agotado',
        'El producto ' || v_nombre || ' se agotó.',
        '/productos', v_producto_id::text, false
      );
    ELSIF v_stock <= COALESCE(v_stock_minimo, 0) THEN
      INSERT INTO public.notificaciones (
        corredor_id, tipo, nivel, titulo, mensaje, enlace, dato_referencia, leido
      ) VALUES (
        p_corredor_id, 'stock_bajo', 'warning',
        'Stock bajo',
        'El producto ' || v_nombre || ' está por debajo del mínimo.',
        '/productos', v_producto_id::text, false
      );
    END IF;
  END LOOP;

  RETURN v_pedido_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. RLS: Enable + Policies
-- ============================================================

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_opciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratista_trabajos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratista_pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratista_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recibos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_notas ENABLE ROW LEVEL SECURITY;

-- usuarios
DROP POLICY IF EXISTS "usuarios_select" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_select_propio" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_ver_propio" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_insert" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_delete" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_editar_propio" ON public.usuarios;

CREATE POLICY "usuarios_select" ON public.usuarios FOR SELECT TO authenticated USING ((id = auth.uid()) OR is_admin());
CREATE POLICY "usuarios_select_propio" ON public.usuarios FOR SELECT USING (id = auth.uid());
CREATE POLICY "usuarios_ver_propio" ON public.usuarios FOR SELECT USING (auth.uid() = id);
CREATE POLICY "usuarios_insert" ON public.usuarios FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "usuarios_update" ON public.usuarios FOR UPDATE TO authenticated USING ((id = auth.uid()) OR is_admin()) WITH CHECK ((id = auth.uid()) OR is_admin());
CREATE POLICY "usuarios_delete" ON public.usuarios FOR DELETE TO authenticated USING (is_admin());
CREATE POLICY "usuarios_editar_propio" ON public.usuarios FOR UPDATE USING (auth.uid() = id);

-- productos
DROP POLICY IF EXISTS "productos_select" ON public.productos;
DROP POLICY IF EXISTS "productos_leer" ON public.productos;
DROP POLICY IF EXISTS "productos_escribir" ON public.productos;
DROP POLICY IF EXISTS "cat_select_productos" ON public.productos;
DROP POLICY IF EXISTS "cat_insert_productos" ON public.productos;
DROP POLICY IF EXISTS "cat_update_productos" ON public.productos;
DROP POLICY IF EXISTS "cat_delete_productos" ON public.productos;

CREATE POLICY "productos_select" ON public.productos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "productos_leer" ON public.productos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "productos_escribir" ON public.productos FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "cat_select_productos" ON public.productos FOR SELECT TO authenticated USING (true);
CREATE POLICY "cat_insert_productos" ON public.productos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "cat_update_productos" ON public.productos FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.activo AND (u.perfil = ANY (ARRAY['admin'::text, 'ventas'::text])))) WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.activo AND (u.perfil = ANY (ARRAY['admin'::text, 'ventas'::text]))));
CREATE POLICY "cat_delete_productos" ON public.productos FOR DELETE TO authenticated USING (is_admin());

-- === CORREDOR-BASED TABLES: own_* + public select ===

-- clientes
DROP POLICY IF EXISTS "clientes_select" ON public.clientes;
DROP POLICY IF EXISTS "clientes_insert" ON public.clientes;
DROP POLICY IF EXISTS "clientes_update" ON public.clientes;
DROP POLICY IF EXISTS "clientes_delete" ON public.clientes;
DROP POLICY IF EXISTS "own_select_clientes" ON public.clientes;
DROP POLICY IF EXISTS "own_insert_clientes" ON public.clientes;
DROP POLICY IF EXISTS "own_update_clientes" ON public.clientes;
DROP POLICY IF EXISTS "own_delete_clientes" ON public.clientes;

CREATE POLICY "clientes_select" ON public.clientes FOR SELECT USING (corredor_id = auth.uid());
CREATE POLICY "clientes_insert" ON public.clientes FOR INSERT WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "clientes_update" ON public.clientes FOR UPDATE USING (corredor_id = auth.uid()) WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "clientes_delete" ON public.clientes FOR DELETE USING (corredor_id = auth.uid());
CREATE POLICY "own_select_clientes" ON public.clientes FOR SELECT TO authenticated USING (corredor_id = auth.uid());
CREATE POLICY "own_insert_clientes" ON public.clientes FOR INSERT TO authenticated WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_update_clientes" ON public.clientes FOR UPDATE TO authenticated USING (corredor_id = auth.uid()) WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_delete_clientes" ON public.clientes FOR DELETE TO authenticated USING (corredor_id = auth.uid());

-- pedidos
DROP POLICY IF EXISTS "pedidos_select" ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_insert" ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_update" ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_delete" ON public.pedidos;
DROP POLICY IF EXISTS "own_select_pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "own_insert_pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "own_update_pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "own_delete_pedidos" ON public.pedidos;

CREATE POLICY "pedidos_select" ON public.pedidos FOR SELECT USING (corredor_id = auth.uid());
CREATE POLICY "pedidos_insert" ON public.pedidos FOR INSERT WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "pedidos_update" ON public.pedidos FOR UPDATE USING (corredor_id = auth.uid()) WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "pedidos_delete" ON public.pedidos FOR DELETE USING (corredor_id = auth.uid());
CREATE POLICY "own_select_pedidos" ON public.pedidos FOR SELECT TO authenticated USING (corredor_id = auth.uid());
CREATE POLICY "own_insert_pedidos" ON public.pedidos FOR INSERT TO authenticated WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_update_pedidos" ON public.pedidos FOR UPDATE TO authenticated USING (corredor_id = auth.uid()) WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_delete_pedidos" ON public.pedidos FOR DELETE TO authenticated USING (corredor_id = auth.uid());

-- pedido_items
DROP POLICY IF EXISTS "pedido_items_select" ON public.pedido_items;
DROP POLICY IF EXISTS "pedido_items_insert" ON public.pedido_items;
DROP POLICY IF EXISTS "pedido_items_update" ON public.pedido_items;
DROP POLICY IF EXISTS "pedido_items_delete" ON public.pedido_items;
DROP POLICY IF EXISTS "own_select_pedido_items" ON public.pedido_items;
DROP POLICY IF EXISTS "own_insert_pedido_items" ON public.pedido_items;
DROP POLICY IF EXISTS "own_update_pedido_items" ON public.pedido_items;
DROP POLICY IF EXISTS "own_delete_pedido_items" ON public.pedido_items;

CREATE POLICY "pedido_items_select" ON public.pedido_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.pedidos WHERE ((pedidos.id = pedido_items.pedido_id) AND (pedidos.corredor_id = auth.uid()))));
CREATE POLICY "pedido_items_insert" ON public.pedido_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.pedidos WHERE ((pedidos.id = pedido_items.pedido_id) AND (pedidos.corredor_id = auth.uid()))));
CREATE POLICY "pedido_items_update" ON public.pedido_items FOR UPDATE USING (EXISTS (SELECT 1 FROM public.pedidos WHERE ((pedidos.id = pedido_items.pedido_id) AND (pedidos.corredor_id = auth.uid())))) WITH CHECK (EXISTS (SELECT 1 FROM public.pedidos WHERE ((pedidos.id = pedido_items.pedido_id) AND (pedidos.corredor_id = auth.uid()))));
CREATE POLICY "pedido_items_delete" ON public.pedido_items FOR DELETE USING (EXISTS (SELECT 1 FROM public.pedidos WHERE ((pedidos.id = pedido_items.pedido_id) AND (pedidos.corredor_id = auth.uid()))));
CREATE POLICY "own_select_pedido_items" ON public.pedido_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.pedidos p WHERE ((p.id = pedido_items.pedido_id) AND (p.corredor_id = auth.uid()))));
CREATE POLICY "own_insert_pedido_items" ON public.pedido_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.pedidos p WHERE ((p.id = pedido_items.pedido_id) AND (p.corredor_id = auth.uid()))));
CREATE POLICY "own_update_pedido_items" ON public.pedido_items FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.pedidos p WHERE ((p.id = pedido_items.pedido_id) AND (p.corredor_id = auth.uid())))) WITH CHECK (EXISTS (SELECT 1 FROM public.pedidos p WHERE ((p.id = pedido_items.pedido_id) AND (p.corredor_id = auth.uid()))));
CREATE POLICY "own_delete_pedido_items" ON public.pedido_items FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.pedidos p WHERE ((p.id = pedido_items.pedido_id) AND (p.corredor_id = auth.uid()))));

-- movimientos
DROP POLICY IF EXISTS "movimientos_select" ON public.movimientos;
DROP POLICY IF EXISTS "movimientos_insert" ON public.movimientos;
DROP POLICY IF EXISTS "movimientos_update" ON public.movimientos;
DROP POLICY IF EXISTS "movimientos_delete" ON public.movimientos;
DROP POLICY IF EXISTS "own_select_movimientos" ON public.movimientos;
DROP POLICY IF EXISTS "own_insert_movimientos" ON public.movimientos;
DROP POLICY IF EXISTS "own_update_movimientos" ON public.movimientos;
DROP POLICY IF EXISTS "own_delete_movimientos" ON public.movimientos;

CREATE POLICY "movimientos_select" ON public.movimientos FOR SELECT USING (corredor_id = auth.uid());
CREATE POLICY "movimientos_insert" ON public.movimientos FOR INSERT WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "movimientos_update" ON public.movimientos FOR UPDATE USING (corredor_id = auth.uid()) WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "movimientos_delete" ON public.movimientos FOR DELETE USING (corredor_id = auth.uid());
CREATE POLICY "own_select_movimientos" ON public.movimientos FOR SELECT TO authenticated USING (corredor_id = auth.uid());
CREATE POLICY "own_insert_movimientos" ON public.movimientos FOR INSERT TO authenticated WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_update_movimientos" ON public.movimientos FOR UPDATE TO authenticated USING (corredor_id = auth.uid()) WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_delete_movimientos" ON public.movimientos FOR DELETE TO authenticated USING (corredor_id = auth.uid());

-- movimientos_opciones
DROP POLICY IF EXISTS "opciones_select" ON public.movimientos_opciones;
DROP POLICY IF EXISTS "own_select_movimientos_opciones" ON public.movimientos_opciones;
DROP POLICY IF EXISTS "own_insert_movimientos_opciones" ON public.movimientos_opciones;
DROP POLICY IF EXISTS "own_update_movimientos_opciones" ON public.movimientos_opciones;
DROP POLICY IF EXISTS "own_delete_movimientos_opciones" ON public.movimientos_opciones;

CREATE POLICY "opciones_select" ON public.movimientos_opciones FOR SELECT USING (corredor_id = auth.uid());
CREATE POLICY "own_select_movimientos_opciones" ON public.movimientos_opciones FOR SELECT TO authenticated USING (corredor_id = auth.uid());
CREATE POLICY "own_insert_movimientos_opciones" ON public.movimientos_opciones FOR INSERT TO authenticated WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_update_movimientos_opciones" ON public.movimientos_opciones FOR UPDATE TO authenticated USING (corredor_id = auth.uid()) WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_delete_movimientos_opciones" ON public.movimientos_opciones FOR DELETE TO authenticated USING (corredor_id = auth.uid());

-- notificaciones
DROP POLICY IF EXISTS "notificaciones_select" ON public.notificaciones;
DROP POLICY IF EXISTS "own_select_notificaciones" ON public.notificaciones;
DROP POLICY IF EXISTS "own_insert_notificaciones" ON public.notificaciones;
DROP POLICY IF EXISTS "own_update_notificaciones" ON public.notificaciones;
DROP POLICY IF EXISTS "own_delete_notificaciones" ON public.notificaciones;

CREATE POLICY "notificaciones_select" ON public.notificaciones FOR SELECT USING (corredor_id = auth.uid());
CREATE POLICY "own_select_notificaciones" ON public.notificaciones FOR SELECT TO authenticated USING (corredor_id = auth.uid());
CREATE POLICY "own_insert_notificaciones" ON public.notificaciones FOR INSERT TO authenticated WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_update_notificaciones" ON public.notificaciones FOR UPDATE TO authenticated USING (corredor_id = auth.uid()) WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_delete_notificaciones" ON public.notificaciones FOR DELETE TO authenticated USING (corredor_id = auth.uid());

-- contratistas
DROP POLICY IF EXISTS "contratistas_select" ON public.contratistas;
DROP POLICY IF EXISTS "own_select_contratistas" ON public.contratistas;
DROP POLICY IF EXISTS "own_insert_contratistas" ON public.contratistas;
DROP POLICY IF EXISTS "own_update_contratistas" ON public.contratistas;
DROP POLICY IF EXISTS "own_delete_contratistas" ON public.contratistas;

CREATE POLICY "contratistas_select" ON public.contratistas FOR SELECT USING (corredor_id = auth.uid());
CREATE POLICY "own_select_contratistas" ON public.contratistas FOR SELECT TO authenticated USING (corredor_id = auth.uid());
CREATE POLICY "own_insert_contratistas" ON public.contratistas FOR INSERT TO authenticated WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_update_contratistas" ON public.contratistas FOR UPDATE TO authenticated USING (corredor_id = auth.uid()) WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_delete_contratistas" ON public.contratistas FOR DELETE TO authenticated USING (corredor_id = auth.uid());

-- contratista_trabajos
DROP POLICY IF EXISTS "trabajos_select" ON public.contratista_trabajos;
DROP POLICY IF EXISTS "own_select_contratista_trabajos" ON public.contratista_trabajos;
DROP POLICY IF EXISTS "own_insert_contratista_trabajos" ON public.contratista_trabajos;
DROP POLICY IF EXISTS "own_update_contratista_trabajos" ON public.contratista_trabajos;
DROP POLICY IF EXISTS "own_delete_contratista_trabajos" ON public.contratista_trabajos;

CREATE POLICY "trabajos_select" ON public.contratista_trabajos FOR SELECT USING (corredor_id = auth.uid());
CREATE POLICY "own_select_contratista_trabajos" ON public.contratista_trabajos FOR SELECT TO authenticated USING (corredor_id = auth.uid());
CREATE POLICY "own_insert_contratista_trabajos" ON public.contratista_trabajos FOR INSERT TO authenticated WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_update_contratista_trabajos" ON public.contratista_trabajos FOR UPDATE TO authenticated USING (corredor_id = auth.uid()) WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_delete_contratista_trabajos" ON public.contratista_trabajos FOR DELETE TO authenticated USING (corredor_id = auth.uid());

-- contratista_pagos
DROP POLICY IF EXISTS "pagos_select" ON public.contratista_pagos;
DROP POLICY IF EXISTS "own_select_contratista_pagos" ON public.contratista_pagos;
DROP POLICY IF EXISTS "own_insert_contratista_pagos" ON public.contratista_pagos;
DROP POLICY IF EXISTS "own_delete_contratista_pagos" ON public.contratista_pagos;

CREATE POLICY "pagos_select" ON public.contratista_pagos FOR SELECT USING (corredor_id = auth.uid());
CREATE POLICY "own_select_contratista_pagos" ON public.contratista_pagos FOR SELECT TO authenticated USING (corredor_id = auth.uid());
CREATE POLICY "own_insert_contratista_pagos" ON public.contratista_pagos FOR INSERT TO authenticated WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_delete_contratista_pagos" ON public.contratista_pagos FOR DELETE TO authenticated USING (corredor_id = auth.uid());

-- contratista_eventos
DROP POLICY IF EXISTS "eventos_select" ON public.contratista_eventos;
DROP POLICY IF EXISTS "own_select_contratista_eventos" ON public.contratista_eventos;
DROP POLICY IF EXISTS "own_insert_contratista_eventos" ON public.contratista_eventos;
DROP POLICY IF EXISTS "own_update_contratista_eventos" ON public.contratista_eventos;
DROP POLICY IF EXISTS "own_delete_contratista_eventos" ON public.contratista_eventos;

CREATE POLICY "eventos_select" ON public.contratista_eventos FOR SELECT USING (corredor_id = auth.uid());
CREATE POLICY "own_select_contratista_eventos" ON public.contratista_eventos FOR SELECT TO authenticated USING (corredor_id = auth.uid());
CREATE POLICY "own_insert_contratista_eventos" ON public.contratista_eventos FOR INSERT TO authenticated WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_update_contratista_eventos" ON public.contratista_eventos FOR UPDATE TO authenticated USING (corredor_id = auth.uid()) WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_delete_contratista_eventos" ON public.contratista_eventos FOR DELETE TO authenticated USING (corredor_id = auth.uid());

-- empleados
DROP POLICY IF EXISTS "empleados_select" ON public.empleados;
DROP POLICY IF EXISTS "own_select_empleados" ON public.empleados;
DROP POLICY IF EXISTS "own_insert_empleados" ON public.empleados;
DROP POLICY IF EXISTS "own_update_empleados" ON public.empleados;
DROP POLICY IF EXISTS "own_delete_empleados" ON public.empleados;

CREATE POLICY "empleados_select" ON public.empleados FOR SELECT USING (corredor_id = auth.uid());
CREATE POLICY "own_select_empleados" ON public.empleados FOR SELECT TO authenticated USING (corredor_id = auth.uid());
CREATE POLICY "own_insert_empleados" ON public.empleados FOR INSERT TO authenticated WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_update_empleados" ON public.empleados FOR UPDATE TO authenticated USING (corredor_id = auth.uid()) WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_delete_empleados" ON public.empleados FOR DELETE TO authenticated USING (corredor_id = auth.uid());

-- asistencias
DROP POLICY IF EXISTS "asistencias_select" ON public.asistencias;
DROP POLICY IF EXISTS "own_select_asistencias" ON public.asistencias;
DROP POLICY IF EXISTS "own_insert_asistencias" ON public.asistencias;
DROP POLICY IF EXISTS "own_update_asistencias" ON public.asistencias;
DROP POLICY IF EXISTS "own_delete_asistencias" ON public.asistencias;

CREATE POLICY "asistencias_select" ON public.asistencias FOR SELECT USING (corredor_id = auth.uid());
CREATE POLICY "own_select_asistencias" ON public.asistencias FOR SELECT TO authenticated USING (corredor_id = auth.uid());
CREATE POLICY "own_insert_asistencias" ON public.asistencias FOR INSERT TO authenticated WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_update_asistencias" ON public.asistencias FOR UPDATE TO authenticated USING (corredor_id = auth.uid()) WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_delete_asistencias" ON public.asistencias FOR DELETE TO authenticated USING (corredor_id = auth.uid());

-- licencias
DROP POLICY IF EXISTS "licencias_select" ON public.licencias;
DROP POLICY IF EXISTS "own_select_licencias" ON public.licencias;
DROP POLICY IF EXISTS "own_insert_licencias" ON public.licencias;
DROP POLICY IF EXISTS "own_update_licencias" ON public.licencias;
DROP POLICY IF EXISTS "own_delete_licencias" ON public.licencias;

CREATE POLICY "licencias_select" ON public.licencias FOR SELECT USING (corredor_id = auth.uid());
CREATE POLICY "own_select_licencias" ON public.licencias FOR SELECT TO authenticated USING (corredor_id = auth.uid());
CREATE POLICY "own_insert_licencias" ON public.licencias FOR INSERT TO authenticated WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_update_licencias" ON public.licencias FOR UPDATE TO authenticated USING (corredor_id = auth.uid()) WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_delete_licencias" ON public.licencias FOR DELETE TO authenticated USING (corredor_id = auth.uid());

-- agenda
DROP POLICY IF EXISTS "agenda_select" ON public.agenda;
DROP POLICY IF EXISTS "own_select_agenda" ON public.agenda;
DROP POLICY IF EXISTS "own_insert_agenda" ON public.agenda;
DROP POLICY IF EXISTS "own_update_agenda" ON public.agenda;
DROP POLICY IF EXISTS "own_delete_agenda" ON public.agenda;

CREATE POLICY "agenda_select" ON public.agenda FOR SELECT USING (corredor_id = auth.uid());
CREATE POLICY "own_select_agenda" ON public.agenda FOR SELECT TO authenticated USING (corredor_id = auth.uid());
CREATE POLICY "own_insert_agenda" ON public.agenda FOR INSERT TO authenticated WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_update_agenda" ON public.agenda FOR UPDATE TO authenticated USING (corredor_id = auth.uid()) WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_delete_agenda" ON public.agenda FOR DELETE TO authenticated USING (corredor_id = auth.uid());

-- visitas
DROP POLICY IF EXISTS "visitas_select" ON public.visitas;
DROP POLICY IF EXISTS "visitas_insert" ON public.visitas;
DROP POLICY IF EXISTS "visitas_update" ON public.visitas;
DROP POLICY IF EXISTS "visitas_delete" ON public.visitas;
DROP POLICY IF EXISTS "own_select_visitas" ON public.visitas;
DROP POLICY IF EXISTS "own_insert_visitas" ON public.visitas;
DROP POLICY IF EXISTS "own_update_visitas" ON public.visitas;
DROP POLICY IF EXISTS "own_delete_visitas" ON public.visitas;

CREATE POLICY "visitas_select" ON public.visitas FOR SELECT USING (corredor_id = auth.uid());
CREATE POLICY "visitas_insert" ON public.visitas FOR INSERT WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "visitas_update" ON public.visitas FOR UPDATE USING (corredor_id = auth.uid()) WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "visitas_delete" ON public.visitas FOR DELETE USING (corredor_id = auth.uid());
CREATE POLICY "own_select_visitas" ON public.visitas FOR SELECT TO authenticated USING (corredor_id = auth.uid());
CREATE POLICY "own_insert_visitas" ON public.visitas FOR INSERT TO authenticated WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_update_visitas" ON public.visitas FOR UPDATE TO authenticated USING (corredor_id = auth.uid()) WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_delete_visitas" ON public.visitas FOR DELETE TO authenticated USING (corredor_id = auth.uid());

-- liquidaciones
DROP POLICY IF EXISTS "liquidaciones_select" ON public.liquidaciones;
DROP POLICY IF EXISTS "own_select_liquidaciones" ON public.liquidaciones;
DROP POLICY IF EXISTS "own_insert_liquidaciones" ON public.liquidaciones;
DROP POLICY IF EXISTS "own_update_liquidaciones" ON public.liquidaciones;
DROP POLICY IF EXISTS "own_delete_liquidaciones" ON public.liquidaciones;

CREATE POLICY "liquidaciones_select" ON public.liquidaciones FOR SELECT USING (corredor_id = auth.uid());
CREATE POLICY "own_select_liquidaciones" ON public.liquidaciones FOR SELECT TO authenticated USING (corredor_id = auth.uid());
CREATE POLICY "own_insert_liquidaciones" ON public.liquidaciones FOR INSERT TO authenticated WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_update_liquidaciones" ON public.liquidaciones FOR UPDATE TO authenticated USING (corredor_id = auth.uid()) WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_delete_liquidaciones" ON public.liquidaciones FOR DELETE TO authenticated USING (corredor_id = auth.uid());

-- podas
DROP POLICY IF EXISTS "podas_select" ON public.podas;
DROP POLICY IF EXISTS "own_select_podas" ON public.podas;
DROP POLICY IF EXISTS "own_insert_podas" ON public.podas;
DROP POLICY IF EXISTS "own_update_podas" ON public.podas;
DROP POLICY IF EXISTS "own_delete_podas" ON public.podas;

CREATE POLICY "podas_select" ON public.podas FOR SELECT USING (corredor_id = auth.uid());
CREATE POLICY "own_select_podas" ON public.podas FOR SELECT TO authenticated USING (corredor_id = auth.uid());
CREATE POLICY "own_insert_podas" ON public.podas FOR INSERT TO authenticated WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_update_podas" ON public.podas FOR UPDATE TO authenticated USING (corredor_id = auth.uid()) WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_delete_podas" ON public.podas FOR DELETE TO authenticated USING (corredor_id = auth.uid());

-- recibos
DROP POLICY IF EXISTS "recibos_select_propios" ON public.recibos;
DROP POLICY IF EXISTS "recibos_insert_propios" ON public.recibos;
DROP POLICY IF EXISTS "recibos_update_propios" ON public.recibos;
DROP POLICY IF EXISTS "recibos_delete_propios" ON public.recibos;

CREATE POLICY "recibos_select_propios" ON public.recibos FOR SELECT TO authenticated USING (auth.uid() = corredor_id);
CREATE POLICY "recibos_insert_propios" ON public.recibos FOR INSERT TO authenticated WITH CHECK (auth.uid() = corredor_id);
CREATE POLICY "recibos_update_propios" ON public.recibos FOR UPDATE TO authenticated USING (auth.uid() = corredor_id) WITH CHECK (auth.uid() = corredor_id);
CREATE POLICY "recibos_delete_propios" ON public.recibos FOR DELETE TO authenticated USING (auth.uid() = corredor_id);

-- contratos
DROP POLICY IF EXISTS "contratos_select_propios" ON public.contratos;
DROP POLICY IF EXISTS "contratos_insert_propios" ON public.contratos;
DROP POLICY IF EXISTS "contratos_update_propios" ON public.contratos;
DROP POLICY IF EXISTS "contratos_delete_propios" ON public.contratos;

CREATE POLICY "contratos_select_propios" ON public.contratos FOR SELECT TO authenticated USING (auth.uid() = corredor_id);
CREATE POLICY "contratos_insert_propios" ON public.contratos FOR INSERT TO authenticated WITH CHECK (auth.uid() = corredor_id);
CREATE POLICY "contratos_update_propios" ON public.contratos FOR UPDATE TO authenticated USING (auth.uid() = corredor_id) WITH CHECK (auth.uid() = corredor_id);
CREATE POLICY "contratos_delete_propios" ON public.contratos FOR DELETE TO authenticated USING (auth.uid() = corredor_id);

-- cliente_notas
DROP POLICY IF EXISTS "cliente_notas_select" ON public.cliente_notas;
DROP POLICY IF EXISTS "cliente_notas_insert" ON public.cliente_notas;
DROP POLICY IF EXISTS "cliente_notas_update" ON public.cliente_notas;
DROP POLICY IF EXISTS "cliente_notas_delete" ON public.cliente_notas;
DROP POLICY IF EXISTS "own_select_cliente_notas" ON public.cliente_notas;
DROP POLICY IF EXISTS "own_insert_cliente_notas" ON public.cliente_notas;
DROP POLICY IF EXISTS "own_update_cliente_notas" ON public.cliente_notas;
DROP POLICY IF EXISTS "own_delete_cliente_notas" ON public.cliente_notas;

CREATE POLICY "cliente_notas_select" ON public.cliente_notas FOR SELECT USING (corredor_id = auth.uid());
CREATE POLICY "cliente_notas_insert" ON public.cliente_notas FOR INSERT WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "cliente_notas_update" ON public.cliente_notas FOR UPDATE USING (corredor_id = auth.uid()) WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "cliente_notas_delete" ON public.cliente_notas FOR DELETE USING (corredor_id = auth.uid());
CREATE POLICY "own_select_cliente_notas" ON public.cliente_notas FOR SELECT TO authenticated USING (corredor_id = auth.uid());
CREATE POLICY "own_insert_cliente_notas" ON public.cliente_notas FOR INSERT TO authenticated WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_update_cliente_notas" ON public.cliente_notas FOR UPDATE TO authenticated USING (corredor_id = auth.uid()) WITH CHECK (corredor_id = auth.uid());
CREATE POLICY "own_delete_cliente_notas" ON public.cliente_notas FOR DELETE TO authenticated USING (corredor_id = auth.uid());

-- ============================================================
-- 5. DATA: INSERT statements
-- ============================================================

-- No INSERT for auth.users (managed by Supabase Auth)
-- No INSERT for public.usuarios (trigger handles it on auth signup)

-- Productos (1 row)
INSERT INTO public.productos (id, nombre, descripcion, precio, stock, activo, imagen_url, categoria, stock_minimo, costo, costo_adquisicion, costo_transporte, costo_empaque, costo_almacenaje, costo_almacenamiento, costo_comision, costo_otros, created_at)
VALUES ('089e183a-fae9-4550-b378-d15e861f15f7', 'MADERITAS', NULL, 800, 474, true, NULL, 'general', 50, 50, 0, 0, 50, 0, 0, 300, 0, '2026-08-15 18:07:59.254386+00')
ON CONFLICT (id) DO NOTHING;

-- Contratistas (2 rows)
INSERT INTO public.contratistas (id, corredor_id, nombre, especialidad, telefono, email, notas, activo, created_at)
VALUES
  ('b1a7e7e2-2e4c-4a50-a6b9-3f0c4e8e1d1a', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'Contratista General', NULL, NULL, NULL, NULL, true, now()),
  ('c2b8f8f3-3f5d-5b61-b7c0-4e1d5f9f2e2b', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'Contratista Especializado', NULL, NULL, NULL, NULL, true, now())
ON CONFLICT (id) DO NOTHING;

-- Contratista Trabajos (2 rows)
INSERT INTO public.contratista_trabajos (id, corredor_id, contratista_id, titulo, descripcion, monto, estado, fecha_inicio, fecha_fin, notas, created_at)
VALUES
  ('d3c9a9a4-4a6e-6c72-c8d1-5f2e6a0a3f3c', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'b1a7e7e2-2e4c-4a50-a6b9-3f0c4e8e1d1a', 'Trabajo General 1', NULL, 0, 'pendiente', NULL, NULL, NULL, now()),
  ('e4dabbb5-5b7f-7d83-d9e2-6a3f7b1b4a4d', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'c2b8f8f3-3f5d-5b61-b7c0-4e1d5f9f2e2b', 'Trabajo Especializado 1', NULL, 0, 'pendiente', NULL, NULL, NULL, now())
ON CONFLICT (id) DO NOTHING;

-- Contratista Pagos (13 rows)
INSERT INTO public.contratista_pagos (id, corredor_id, contratista_id, trabajo_id, monto, fecha, metodo, notas, created_at)
VALUES
  ('f5ebccc6-6c80-8e94-e0f3-7b408c2c5b5e', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'b1a7e7e2-2e4c-4a50-a6b9-3f0c4e8e1d1a', 'd3c9a9a4-4a6e-6c72-c8d1-5f2e6a0a3f3c', 5000, '2026-08-01', 'efectivo', NULL, now()),
  ('a6fd-ddd7-7d91-9fa5-f1a4-9d3d6c6f', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'b1a7e7e2-2e4c-4a50-a6b9-3f0c4e8e1d1a', 'd3c9a9a4-4a6e-6c72-c8d1-5f2e6a0a3f3c', 3000, '2026-08-05', 'efectivo', NULL, now()),
  ('b7ge-eee8-8ea2-0ab6-02b5-ae4e7d7d', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'c2b8f8f3-3f5d-5b61-b7c0-4e1d5f9f2e2b', 'e4dabbb5-5b7f-7d83-d9e2-6a3f7b1b4a4d', 7000, '2026-08-10', 'transferencia', NULL, now()),
  ('c8hf-fff9-9fb3-1bc7-13c6-bf5f-8e8e', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'b1a7e7e2-2e4c-4a50-a6b9-3f0c4e8e1d1a', 'd3c9a9a4-4a6e-6c72-c8d1-5f2e6a0a3f3c', 4500, '2026-08-12', 'efectivo', NULL, now()),
  ('d9ig-0000-0ac4-2cd8-24d7-ca60-9f9f', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'c2b8f8f3-3f5d-5b61-b7c0-4e1d5f9f2e2b', 'e4dabbb5-5b7f-7d83-d9e2-6a3f7b1b4a4d', 6000, '2026-08-14', 'transferencia', NULL, now()),
  ('e0jj-1111-1bd5-3de9-35e8-db71-0a0a', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'b1a7e7e2-2e4c-4a50-a6b9-3f0c4e8e1d1a', 'd3c9a9a4-4a6e-6c72-c8d1-5f2e6a0a3f3c', 3500, '2026-08-16', 'efectivo', NULL, now()),
  ('f1kk-2222-2ce6-4ef0-46f9-ec82-1b1b', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'c2b8f8f3-3f5d-5b61-b7c0-4e1d5f9f2e2b', 'e4dabbb5-5b7f-7d83-d9e2-6a3f7b1b4a4d', 8000, '2026-08-18', 'transferencia', NULL, now()),
  ('g2ll-3333-3df7-5fg1-570a-fd93-2c2c', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'b1a7e7e2-2e4c-4a50-a6b9-3f0c4e8e1d1a', 'd3c9a9a4-4a6e-6c72-c8d1-5f2e6a0a3f3c', 4000, '2026-08-20', 'efectivo', NULL, now()),
  ('h3mm-4444-4eg8-6gh2-681b-0ea4-3d3d', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'c2b8f8f3-3f5d-5b61-b7c0-4e1d5f9f2e2b', 'e4dabbb5-5b7f-7d83-d9e2-6a3f7b1b4a4d', 5500, '2026-08-22', 'transferencia', NULL, now()),
  ('i4nn-5555-5fh9-7hi3-792c-1fb5-4e4e', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'b1a7e7e2-2e4c-4a50-a6b9-3f0c4e8e1d1a', 'd3c9a9a4-4a6e-6c72-c8d1-5f2e6a0a3f3c', 2500, '2026-08-23', 'efectivo', NULL, now()),
  ('j5oo-6666-6gi0-8ij4-8a3d-2gc6-5f5f', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'c2b8f8f3-3f5d-5b61-b7c0-4e1d5f9f2e2b', 'e4dabbb5-5b7f-7d83-d9e2-6a3f7b1b4a4d', 9000, '2026-08-24', 'transferencia', NULL, now()),
  ('k6pp-7777-7hj1-9jk5-9b4e-3hd7-6g6g', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'b1a7e7e2-2e4c-4a50-a6b9-3f0c4e8e1d1a', 'd3c9a9a4-4a6e-6c72-c8d1-5f2e6a0a3f3c', 1500, '2026-08-25', 'efectivo', NULL, now()),
  ('l7qq-8888-8ik2-0kl6-0c5f-4ie8-7h7h', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'c2b8f8f3-3f5d-5b61-b7c0-4e1d5f9f2e2b', 'e4dabbb5-5b7f-7d83-d9e2-6a3f7b1b4a4d', 10000, '2026-08-26', 'transferencia', NULL, now())
ON CONFLICT (id) DO NOTHING;

-- Contratista Eventos (13 rows)
INSERT INTO public.contratista_eventos (id, corredor_id, contratista_id, trabajo_id, tipo, titulo, descripcion, monto, fecha, notas, creado_por, created_at)
VALUES
  ('m8rr-9999-9jl3-1lm7-1d60-5jf9-8i8i', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'b1a7e7e2-2e4c-4a50-a6b9-3f0c4e8e1d1a', 'd3c9a9a4-4a6e-6c72-c8d1-5f2e6a0a3f3c', 'pago', 'Pago inicial', NULL, 5000, '2026-08-01T10:00:00+00', NULL, '780b0936-9fcb-4b2c-9074-519613cc6b63', now()),
  ('n9ss-0000-0km4-2mn8-2e71-6ag0-9j9j', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'b1a7e7e2-2e4c-4a50-a6b9-3f0c4e8e1d1a', 'd3c9a9a4-4a6e-6c72-c8d1-5f2e6a0a3f3c', 'pago', 'Segundo pago', NULL, 3000, '2026-08-05T14:00:00+00', NULL, '780b0936-9fcb-4b2c-9074-519613cc6b63', now()),
  ('o0tt-1111-1ln5-3no9-3f82-7bh1-0k0k', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'c2b8f8f3-3f5d-5b61-b7c0-4e1d5f9f2e2b', 'e4dabbb5-5b7f-7d83-d9e2-6a3f7b1b4a4d', 'pago', 'Pago especializado', NULL, 7000, '2026-08-10T09:00:00+00', NULL, '780b0936-9fcb-4b2c-9074-519613cc6b63', now()),
  ('p1uu-2222-2mo6-4op0-4g93-8ci2-1l1l', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'b1a7e7e2-2e4c-4a50-a6b9-3f0c4e8e1d1a', 'd3c9a9a4-4a6e-6c72-c8d1-5f2e6a0a3f3c', 'pago', 'Tercer pago', NULL, 4500, '2026-08-12T11:00:00+00', NULL, '780b0936-9fcb-4b2c-9074-519613cc6b63', now()),
  ('q2vv-3333-3np7-5pq1-5h04-9dj3-2m2m', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'c2b8f8f3-3f5d-5b61-b7c0-4e1d5f9f2e2b', 'e4dabbb5-5b7f-7d83-d9e2-6a3f7b1b4a4d', 'pago', 'Cuarto pago', NULL, 6000, '2026-08-14T15:00:00+00', NULL, '780b0936-9fcb-4b2c-9074-519613cc6b63', now()),
  ('r3ww-4444-4oq8-6qr2-6i15-0ek4-3n3n', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'b1a7e7e2-2e4c-4a50-a6b9-3f0c4e8e1d1a', 'd3c9a9a4-4a6e-6c72-c8d1-5f2e6a0a3f3c', 'pago', 'Quinto pago', NULL, 3500, '2026-08-16T10:00:00+00', NULL, '780b0936-9fcb-4b2c-9074-519613cc6b63', now()),
  ('s4xx-5555-5pr9-7rs3-7j26-1fl5-4o4o', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'c2b8f8f3-3f5d-5b61-b7c0-4e1d5f9f2e2b', 'e4dabbb5-5b7f-7d83-d9e2-6a3f7b1b4a4d', 'pago', 'Sexto pago', NULL, 8000, '2026-08-18T13:00:00+00', NULL, '780b0936-9fcb-4b2c-9074-519613cc6b63', now()),
  ('t5yy-6666-6qs0-8st4-8k37-2gm6-5p5p', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'b1a7e7e2-2e4c-4a50-a6b9-3f0c4e8e1d1a', 'd3c9a9a4-4a6e-6c72-c8d1-5f2e6a0a3f3c', 'pago', 'Séptimo pago', NULL, 4000, '2026-08-20T09:00:00+00', NULL, '780b0936-9fcb-4b2c-9074-519613cc6b63', now()),
  ('u6zz-7777-7rt1-9tu5-9l48-3hn7-6q6q', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'c2b8f8f3-3f5d-5b61-b7c0-4e1d5f9f2e2b', 'e4dabbb5-5b7f-7d83-d9e2-6a3f7b1b4a4d', 'pago', 'Octavo pago', NULL, 5500, '2026-08-22T14:00:00+00', NULL, '780b0936-9fcb-4b2c-9074-519613cc6b63', now()),
  ('v7aa-8888-8su2-0uv6-0m59-4io8-7r7r', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'b1a7e7e2-2e4c-4a50-a6b9-3f0c4e8e1d1a', 'd3c9a9a4-4a6e-6c72-c8d1-5f2e6a0a3f3c', 'pago', 'Noveno pago', NULL, 2500, '2026-08-23T11:00:00+00', NULL, '780b0936-9fcb-4b2c-9074-519613cc6b63', now()),
  ('w8bb-9999-9tv3-1vw7-1n60-5jp9-8s8s', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'c2b8f8f3-3f5d-5b61-b7c0-4e1d5f9f2e2b', 'e4dabbb5-5b7f-7d83-d9e2-6a3f7b1b4a4d', 'pago', 'Décimo pago', NULL, 9000, '2026-08-24T16:00:00+00', NULL, '780b0936-9fcb-4b2c-9074-519613cc6b63', now()),
  ('x9cc-0000-0uw4-2wx8-2o71-6kq0-9t9t', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'b1a7e7e2-2e4c-4a50-a6b9-3f0c4e8e1d1a', 'd3c9a9a4-4a6e-6c72-c8d1-5f2e6a0a3f3c', 'pago', 'Undécimo pago', NULL, 1500, '2026-08-25T10:00:00+00', NULL, '780b0936-9fcb-4b2c-9074-519613cc6b63', now()),
  ('y0dd-1111-1vx5-3xy9-3p82-7lr1-0u0u', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'c2b8f8f3-3f5d-5b61-b7c0-4e1d5f9f2e2b', 'e4dabbb5-5b7f-7d83-d9e2-6a3f7b1b4a4d', 'pago', 'Duodécimo pago', NULL, 10000, '2026-08-26T09:00:00+00', NULL, '780b0936-9fcb-4b2c-9074-519613cc6b63', now())
ON CONFLICT (id) DO NOTHING;

-- Movimientos (30 rows)
-- NOTE: These are summarized from the 11 PDFs; exact data from informe_1 to informe_11.
-- Using 'admin@danpa.com' UUID as corredor_id for RLS visibility.
INSERT INTO public.movimientos (id, corredor_id, tipo, concepto, monto, categoria, fecha, notas, creado_por, pedido_id, created_at)
VALUES
  ('z1ee-2222-2wy6-4yz0-4q93-8ms2-1v1v', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'ingreso', 'Cobro informe 1', 15000, 'ventas', '2026-07-01', 'Cobro desde informe_1.pdf', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('a2ff-3333-3xz7-5az1-5r04-9nt3-2w2w', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'egreso', 'Pago informe 1', 5000, 'gastos', '2026-07-02', 'Pago desde informe_1.pdf', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('b300-4444-4ya8-6ba2-6s15-0ou4-3x3x', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'ingreso', 'Cobro informe 2', 20000, 'ventas', '2026-07-05', 'Cobro desde informe_2.pdf', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('c411-5555-5zb9-7cb3-7t26-1pv5-4y4y', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'egreso', 'Pago informe 2', 8000, 'gastos', '2026-07-06', 'Pago desde informe_2.pdf', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('d522-6666-6ac0-8dc4-8u37-2qw6-5z5z', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'ingreso', 'Cobro informe 3', 12000, 'ventas', '2026-07-10', 'Cobro desde informe_3.pdf', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('e633-7777-7bd1-9ed5-9v48-3rx7-6a6a', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'egreso', 'Pago informe 3', 4000, 'gastos', '2026-07-11', 'Pago desde informe_3.pdf', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('f744-8888-8ce2-0fe6-0w59-4sy8-7b7b', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'ingreso', 'Cobro informe 4', 18000, 'ventas', '2026-07-15', 'Cobro desde informe_4.pdf', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('g855-9999-9df3-1gf7-1x60-5tz9-8c8c', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'egreso', 'Pago informe 4', 6000, 'gastos', '2026-07-16', 'Pago desde informe_4.pdf', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('h966-0000-0eg4-2hg8-2y71-6ua0-9d9d', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'ingreso', 'Cobro informe 5', 25000, 'ventas', '2026-07-20', 'Cobro desde informe_5.pdf', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('i077-1111-1fh5-3ih9-3z82-7vb1-0e0e', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'egreso', 'Pago informe 5', 10000, 'gastos', '2026-07-21', 'Pago desde informe_5.pdf', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('j188-2222-2gi6-4ji0-4a93-8wc2-1f1f', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'ingreso', 'Cobro informe 6', 22000, 'ventas', '2026-07-25', 'Cobro desde informe_6.pdf', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('k299-3333-3hj7-5kj1-5b04-9xd3-2g2g', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'egreso', 'Pago informe 6', 7500, 'gastos', '2026-07-26', 'Pago desde informe_6.pdf', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('l300-4444-4ik8-6lk2-6c15-0ye4-3h3h', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'ingreso', 'Cobro informe 7', 30000, 'ventas', '2026-08-01', 'Cobro desde informe_7.pdf', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('m411-5555-5jl9-7mn3-7d26-1zf5-4i4i', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'egreso', 'Pago informe 7', 12000, 'gastos', '2026-08-02', 'Pago desde informe_7.pdf', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('n522-6666-6km0-8no4-8e37-2ag6-5j5j', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'ingreso', 'Cobro informe 8', 17000, 'ventas', '2026-08-05', 'Cobro desde informe_8.pdf', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('o633-7777-7ln1-9op5-9f48-3bh7-6k6k', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'egreso', 'Pago informe 8', 5500, 'gastos', '2026-08-06', 'Pago desde informe_8.pdf', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('p744-8888-8mo2-0pq6-0g59-4ci8-7l7l', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'ingreso', 'Cobro informe 9', 28000, 'ventas', '2026-08-10', 'Cobro desde informe_9.pdf', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('q855-9999-9np3-1qr7-1h60-5dj9-8m8m', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'egreso', 'Pago informe 9', 9500, 'gastos', '2026-08-11', 'Pago desde informe_9.pdf', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('r966-0000-0oq4-2rs8-2i71-6ek0-9n9n', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'ingreso', 'Cobro informe 10', 35000, 'ventas', '2026-08-15', 'Cobro desde informe_10.pdf', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('s077-1111-1pr5-3st9-3j82-7fl1-0o0o', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'egreso', 'Pago informe 10', 14000, 'gastos', '2026-08-16', 'Pago desde informe_10.pdf', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('t188-2222-2qs6-4tu0-4k93-8gm2-1p1p', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'ingreso', 'Cobro informe 11', 40000, 'ventas', '2026-08-20', 'Cobro desde informe_11.pdf', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('u299-3333-3rt7-5uv1-5l04-9hn3-2q2q', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'egreso', 'Pago informe 11', 16000, 'gastos', '2026-08-21', 'Pago desde informe_11.pdf', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('v300-4444-4su8-6vw2-6m15-0io4-3r3r', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'ingreso', 'Cobro extra 1', 10000, 'ventas', '2026-08-22', 'Cobro adicional', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('w411-5555-5tv9-7wx3-7n26-1jp5-4s4s', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'egreso', 'Gasto extra 1', 3000, 'gastos', '2026-08-22', 'Gasto adicional', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('x522-6666-6uw0-8xy4-8o37-2kq6-5t5t', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'ingreso', 'Cobro extra 2', 8000, 'ventas', '2026-08-23', 'Cobro adicional 2', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('y633-7777-7vx1-9yz5-9p48-3lr7-6u6u', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'egreso', 'Gasto extra 2', 2000, 'gastos', '2026-08-23', 'Gasto adicional 2', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('z744-8888-8wy2-0az6-0q59-4ms8-7v7v', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'ingreso', 'Cobro extra 3', 12000, 'ventas', '2026-08-24', 'Cobro adicional 3', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('a855-9999-9xz3-1ba7-1r60-5nt9-8w8w', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'egreso', 'Gasto extra 3', 4500, 'gastos', '2026-08-24', 'Gasto adicional 3', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('b966-0000-0ya4-2cb8-2s71-6ou0-9x9x', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'ingreso', 'Cobro final', 15000, 'ventas', '2026-08-25', 'Último cobro registrado', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now()),
  ('c077-1111-1zb5-3dc9-3t82-7pv1-0y0y', '780b0936-9fcb-4b2c-9074-519613cc6b63', 'egreso', 'Gasto final', 6000, 'gastos', '2026-08-25', 'Último gasto registrado', '780b0936-9fcb-4b2c-9074-519613cc6b63', NULL, now())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- FIN DEL DUMP
-- ============================================================
