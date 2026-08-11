-- ============================================================
-- DANPA MADERAS - Esquema completo
-- Tablas, índices y Row Level Security (RLS) con Supabase Auth.
--
-- Cómo usar:
--   1. Abrí el SQL Editor en el dashboard de Supabase
--      (https://supabase.com/dashboard/project/jxjmdlnuwfpgocxypcvb/sql)
--   2. Pegá TODO este archivo y ejecutalo.
--   3. En Authentication > Providers > Email, decidí si querés
--      confirmación de email (o desactivala para entrar directo).
--   4. El primer corredor se crea solo: registrate en la app.
-- ============================================================

-- ============================================================
-- TABLAS
-- ============================================================

-- usuarios: perfil del corredor; el id es el de auth.users (auth.uid())
CREATE TABLE IF NOT EXISTS public.usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  nombre text NOT NULL,
  perfil text NOT NULL DEFAULT 'corredor',
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- productos: catálogo compartido por toda la empresa
CREATE TABLE IF NOT EXISTS public.productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  precio double precision NOT NULL DEFAULT 0,
  stock double precision NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  imagen_url text,
  categoria text NOT NULL DEFAULT 'general',
  stock_minimo double precision NOT NULL DEFAULT 0,
  costo double precision NOT NULL DEFAULT 0,
  costo_adquisicion double precision NOT NULL DEFAULT 0,
  costo_transporte double precision NOT NULL DEFAULT 0,
  costo_empaque double precision NOT NULL DEFAULT 0,
  costo_almacenaje double precision NOT NULL DEFAULT 0,
  costo_almacenamiento double precision NOT NULL DEFAULT 0,
  costo_comision double precision NOT NULL DEFAULT 0,
  costo_otros double precision NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- clientes: exclusivos de cada corredor
CREATE TABLE IF NOT EXISTS public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid NOT NULL REFERENCES public.usuarios (id) ON DELETE CASCADE,
  nombre text NOT NULL,
  telefono text,
  direccion text,
  notas text,
  latitud double precision,
  longitud double precision,
  tipo_cliente text NOT NULL DEFAULT 'general',
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- pedidos: exclusivos de cada corredor
CREATE TABLE IF NOT EXISTS public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid NOT NULL REFERENCES public.usuarios (id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.clientes (id) ON DELETE SET NULL,
  total double precision NOT NULL DEFAULT 0,
  notas text,
  estado text NOT NULL DEFAULT 'Pendiente',
  estado_pago text NOT NULL DEFAULT 'no_pagado',
  monto_pagado double precision NOT NULL DEFAULT 0,
  tipo_pago text,
  fecha_pago timestamptz,
  referencia_pago text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- pedido_items: ítems de cada pedido
CREATE TABLE IF NOT EXISTS public.pedido_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos (id) ON DELETE CASCADE,
  producto_id uuid NOT NULL REFERENCES public.productos (id),
  cantidad double precision NOT NULL,
  precio_unitario double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- movimientos: finanzas de cada corredor
CREATE TABLE IF NOT EXISTS public.movimientos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid NOT NULL REFERENCES public.usuarios (id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  concepto text NOT NULL,
  monto double precision NOT NULL DEFAULT 0,
  categoria text NOT NULL DEFAULT 'general',
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  notas text,
  creado_por uuid REFERENCES public.usuarios (id),
  pedido_id uuid REFERENCES public.pedidos (id) ON DELETE SET NULL,
  pagador text,
  cuenta text,
  tiene_factura boolean NOT NULL DEFAULT false,
  nro_factura text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- visitas: agenda de visitas de cada corredor
CREATE TABLE IF NOT EXISTS public.visitas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid NOT NULL REFERENCES public.usuarios (id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.clientes (id) ON DELETE SET NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  estado text NOT NULL DEFAULT 'pendiente',
  latitud double precision,
  longitud double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- cliente_notas: notas asociadas a un cliente
CREATE TABLE IF NOT EXISTS public.cliente_notas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes (id) ON DELETE CASCADE,
  corredor_id uuid NOT NULL REFERENCES public.usuarios (id) ON DELETE CASCADE,
  nota text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- agenda: contrataciones y pliegos agendados por corredor
CREATE TABLE IF NOT EXISTS public.agenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid NOT NULL REFERENCES public.usuarios (id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('contratacion', 'pliego')),
  titulo text NOT NULL,
  organismo text,
  monto double precision NOT NULL DEFAULT 0,
  fecha date,
  estado text NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'presentado', 'adjudicado', 'perdido', 'vencido')),
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- podas: registro de podas de arboles por corredor
CREATE TABLE IF NOT EXISTS public.podas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid NOT NULL REFERENCES public.usuarios (id) ON DELETE CASCADE,
  cantidad_arboles integer NOT NULL DEFAULT 0,
  detalle text NOT NULL,
  tipo_arbol text,
  tipo_poda text,
  lugar text,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- movimientos_opciones: listas persistentes para finanzas
CREATE TABLE IF NOT EXISTS public.movimientos_opciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid NOT NULL REFERENCES public.usuarios (id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('pagador', 'cuenta')),
  valor text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (corredor_id, tipo, valor)
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_clientes_corredor ON public.clientes (corredor_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_corredor ON public.pedidos (corredor_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON public.pedidos (cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido ON public.pedido_items (pedido_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_corredor ON public.movimientos (corredor_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_pedido ON public.movimientos (pedido_id);
CREATE INDEX IF NOT EXISTS idx_visitas_corredor ON public.visitas (corredor_id);
CREATE INDEX IF NOT EXISTS idx_cliente_notas_cliente ON public.cliente_notas (cliente_id);

-- ============================================================
-- AUTOCREACIÓN DEL PERFIL AL REGISTRARSE
-- Crea la fila en usuarios cuando se registra un nuevo auth.user.
-- nombre/perfil se leen de user_metadata del registro.
-- ============================================================
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
    COALESCE(NEW.raw_user_meta_data->>'perfil', 'corredor'),
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_notas ENABLE ROW LEVEL SECURITY;

-- --- usuarios: cada uno solo su perfil ---
DROP POLICY IF EXISTS "usuarios_ver_propio" ON public.usuarios;
CREATE POLICY "usuarios_ver_propio" ON public.usuarios
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "usuarios_editar_propio" ON public.usuarios;
CREATE POLICY "usuarios_editar_propio" ON public.usuarios
  FOR UPDATE USING (auth.uid() = id);

-- --- productos: catálogo compartido, solo usuarios autenticados ---
DROP POLICY IF EXISTS "productos_leer" ON public.productos;
CREATE POLICY "productos_leer" ON public.productos
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "productos_escribir" ON public.productos;
CREATE POLICY "productos_escribir" ON public.productos
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- --- clientes: solo el corredor dueño ---
DROP POLICY IF EXISTS "clientes_select" ON public.clientes;
CREATE POLICY "clientes_select" ON public.clientes
  FOR SELECT USING (corredor_id = auth.uid());

DROP POLICY IF EXISTS "clientes_insert" ON public.clientes;
CREATE POLICY "clientes_insert" ON public.clientes
  FOR INSERT WITH CHECK (corredor_id = auth.uid());

DROP POLICY IF EXISTS "clientes_update" ON public.clientes;
CREATE POLICY "clientes_update" ON public.clientes
  FOR UPDATE USING (corredor_id = auth.uid());

DROP POLICY IF EXISTS "clientes_delete" ON public.clientes;
CREATE POLICY "clientes_delete" ON public.clientes
  FOR DELETE USING (corredor_id = auth.uid());

-- --- pedidos: solo el corredor dueño ---
DROP POLICY IF EXISTS "pedidos_select" ON public.pedidos;
CREATE POLICY "pedidos_select" ON public.pedidos
  FOR SELECT USING (corredor_id = auth.uid());

DROP POLICY IF EXISTS "pedidos_insert" ON public.pedidos;
CREATE POLICY "pedidos_insert" ON public.pedidos
  FOR INSERT WITH CHECK (corredor_id = auth.uid());

DROP POLICY IF EXISTS "pedidos_update" ON public.pedidos;
CREATE POLICY "pedidos_update" ON public.pedidos
  FOR UPDATE USING (corredor_id = auth.uid());

DROP POLICY IF EXISTS "pedidos_delete" ON public.pedidos;
CREATE POLICY "pedidos_delete" ON public.pedidos
  FOR DELETE USING (corredor_id = auth.uid());

-- --- pedido_items: via la propiedad del pedido ---
DROP POLICY IF EXISTS "pedido_items_select" ON public.pedido_items;
CREATE POLICY "pedido_items_select" ON public.pedido_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pedidos
      WHERE pedidos.id = pedido_items.pedido_id
        AND pedidos.corredor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "pedido_items_insert" ON public.pedido_items;
CREATE POLICY "pedido_items_insert" ON public.pedido_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pedidos
      WHERE pedidos.id = pedido_items.pedido_id
        AND pedidos.corredor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "pedido_items_update" ON public.pedido_items;
CREATE POLICY "pedido_items_update" ON public.pedido_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.pedidos
      WHERE pedidos.id = pedido_items.pedido_id
        AND pedidos.corredor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "pedido_items_delete" ON public.pedido_items;
CREATE POLICY "pedido_items_delete" ON public.pedido_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.pedidos
      WHERE pedidos.id = pedido_items.pedido_id
        AND pedidos.corredor_id = auth.uid()
    )
  );

-- --- movimientos: solo el corredor dueño ---
DROP POLICY IF EXISTS "movimientos_select" ON public.movimientos;
CREATE POLICY "movimientos_select" ON public.movimientos
  FOR SELECT USING (corredor_id = auth.uid());

DROP POLICY IF EXISTS "movimientos_insert" ON public.movimientos;
CREATE POLICY "movimientos_insert" ON public.movimientos
  FOR INSERT WITH CHECK (corredor_id = auth.uid());

DROP POLICY IF EXISTS "movimientos_update" ON public.movimientos;
CREATE POLICY "movimientos_update" ON public.movimientos
  FOR UPDATE USING (corredor_id = auth.uid());

DROP POLICY IF EXISTS "movimientos_delete" ON public.movimientos;
CREATE POLICY "movimientos_delete" ON public.movimientos
  FOR DELETE USING (corredor_id = auth.uid());

-- --- visitas: solo el corredor dueño ---
DROP POLICY IF EXISTS "visitas_select" ON public.visitas;
CREATE POLICY "visitas_select" ON public.visitas
  FOR SELECT USING (corredor_id = auth.uid());

DROP POLICY IF EXISTS "visitas_insert" ON public.visitas;
CREATE POLICY "visitas_insert" ON public.visitas
  FOR INSERT WITH CHECK (corredor_id = auth.uid());

DROP POLICY IF EXISTS "visitas_update" ON public.visitas;
CREATE POLICY "visitas_update" ON public.visitas
  FOR UPDATE USING (corredor_id = auth.uid());

DROP POLICY IF EXISTS "visitas_delete" ON public.visitas;
CREATE POLICY "visitas_delete" ON public.visitas
  FOR DELETE USING (corredor_id = auth.uid());

-- --- cliente_notas: solo el corredor dueño ---
DROP POLICY IF EXISTS "cliente_notas_select" ON public.cliente_notas;
CREATE POLICY "cliente_notas_select" ON public.cliente_notas
  FOR SELECT USING (corredor_id = auth.uid());

DROP POLICY IF EXISTS "cliente_notas_insert" ON public.cliente_notas;
CREATE POLICY "cliente_notas_insert" ON public.cliente_notas
  FOR INSERT WITH CHECK (corredor_id = auth.uid());

DROP POLICY IF EXISTS "cliente_notas_update" ON public.cliente_notas;
CREATE POLICY "cliente_notas_update" ON public.cliente_notas
  FOR UPDATE USING (corredor_id = auth.uid());

DROP POLICY IF EXISTS "cliente_notas_delete" ON public.cliente_notas;
CREATE POLICY "cliente_notas_delete" ON public.cliente_notas
  FOR DELETE USING (corredor_id = auth.uid());

-- ============================================================
-- MOVIMIENTO AUTOMÁTICO AL PAGAR UN PEDIDO
-- Cuando un pedido pasa a estado_pago = 'pagado' se registra un
-- ingreso (categoria 'ventas') en movimientos, enlazado por
-- pedido_id. Si se revierte a 'no_pagado', el movimiento se borra.
-- ============================================================
CREATE OR REPLACE FUNCTION public.on_pedido_estado_pago()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

DROP TRIGGER IF EXISTS trg_pedido_estado_pago ON public.pedidos;
CREATE TRIGGER trg_pedido_estado_pago
  AFTER UPDATE OF estado_pago ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.on_pedido_estado_pago();
