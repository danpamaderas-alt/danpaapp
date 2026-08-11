-- ============================================================
-- DANPA MADERAS - Migración integral (idempotente)
--
-- 1) ALINEA las tablas existentes al esquema actual de la app:
--    - renombra conductor_id -> corredor_id (esquema viejo)
--    - agrega las columnas que la app usa (estado_pago, notas,
--      created_at, etc.) si no existen
--    - crea tablas faltantes (productos, pedido_items, visitas,
--      cliente_notas)
-- 2) MOVIMIENTO AUTOMÁTICO AL PAGAR UN PEDIDO:
--    - al marcar 'pagado' inserta un ingreso (ventas) en movimientos
--    - al revertirlo lo borra
--
-- Se puede re-ejecutar sin daño. Corré esto y, en segundo lugar,
-- supabase_schema.sql (RLS, índices, trigger de perfil al registrarse).
-- ============================================================

-- ------------------------------------------------------------
-- 0) CREAR TABLAS FALTANTES (si no existen)
--    Deben crearse los padres antes que los hijos (FK).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  nombre text NOT NULL,
  perfil text NOT NULL DEFAULT 'corredor',
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS public.pedido_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos (id) ON DELETE CASCADE,
  producto_id uuid NOT NULL REFERENCES public.productos (id),
  cantidad double precision NOT NULL,
  precio_unitario double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

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
  created_at timestamptz NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS public.cliente_notas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes (id) ON DELETE CASCADE,
  corredor_id uuid NOT NULL REFERENCES public.usuarios (id) ON DELETE CASCADE,
  nota text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 1) NORMALIZAR TITULARIDAD: conductor_id -> corredor_id
--    Por tabla, para que un fallo en una no deshaga las demás.
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clientes' AND column_name = 'conductor_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clientes' AND column_name = 'corredor_id'
  ) THEN
    ALTER TABLE public.clientes RENAME COLUMN conductor_id TO corredor_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pedidos' AND column_name = 'conductor_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pedidos' AND column_name = 'corredor_id'
  ) THEN
    ALTER TABLE public.pedidos RENAME COLUMN conductor_id TO corredor_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'movimientos' AND column_name = 'conductor_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'movimientos' AND column_name = 'corredor_id'
  ) THEN
    ALTER TABLE public.movimientos RENAME COLUMN conductor_id TO corredor_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'visitas' AND column_name = 'conductor_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'visitas' AND column_name = 'corredor_id'
  ) THEN
    ALTER TABLE public.visitas RENAME COLUMN conductor_id TO corredor_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cliente_notas' AND column_name = 'conductor_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cliente_notas' AND column_name = 'corredor_id'
  ) THEN
    ALTER TABLE public.cliente_notas RENAME COLUMN conductor_id TO corredor_id;
  END IF;
END $$;

-- ------------------------------------------------------------
-- 2) GARANTIZAR COLUMNAS QUE LA APP USA (add if not exists)
-- ------------------------------------------------------------
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS nombre text;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS telefono text;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS direccion text;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS notas text;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS latitud double precision;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS longitud double precision;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS tipo_cliente text NOT NULL DEFAULT 'general';
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS total double precision NOT NULL DEFAULT 0;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS notas text;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS estado text NOT NULL DEFAULT 'Pendiente';
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS estado_pago text NOT NULL DEFAULT 'no_pagado';
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS monto_pagado double precision NOT NULL DEFAULT 0;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS tipo_pago text;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS fecha_pago timestamptz;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS referencia_pago text;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.pedido_items ADD COLUMN IF NOT EXISTS cantidad double precision;
ALTER TABLE public.pedido_items ADD COLUMN IF NOT EXISTS precio_unitario double precision;
ALTER TABLE public.pedido_items ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.movimientos ADD COLUMN IF NOT EXISTS tipo text;
ALTER TABLE public.movimientos ADD COLUMN IF NOT EXISTS concepto text;
ALTER TABLE public.movimientos ADD COLUMN IF NOT EXISTS monto double precision NOT NULL DEFAULT 0;
ALTER TABLE public.movimientos ADD COLUMN IF NOT EXISTS categoria text NOT NULL DEFAULT 'general';
ALTER TABLE public.movimientos ADD COLUMN IF NOT EXISTS fecha date NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.movimientos ADD COLUMN IF NOT EXISTS notas text;
  ALTER TABLE public.movimientos ADD COLUMN IF NOT EXISTS creado_por uuid;
  ALTER TABLE public.movimientos ADD COLUMN IF NOT EXISTS pedido_id uuid REFERENCES public.pedidos (id) ON DELETE SET NULL;
  ALTER TABLE public.movimientos ADD COLUMN IF NOT EXISTS pagador text;
  ALTER TABLE public.movimientos ADD COLUMN IF NOT EXISTS cuenta text;
  ALTER TABLE public.movimientos ADD COLUMN IF NOT EXISTS tiene_factura boolean NOT NULL DEFAULT false;
  ALTER TABLE public.movimientos ADD COLUMN IF NOT EXISTS nro_factura text;
  ALTER TABLE public.movimientos ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.visitas ADD COLUMN IF NOT EXISTS fecha date NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.visitas ADD COLUMN IF NOT EXISTS estado text NOT NULL DEFAULT 'pendiente';
ALTER TABLE public.visitas ADD COLUMN IF NOT EXISTS latitud double precision;
ALTER TABLE public.visitas ADD COLUMN IF NOT EXISTS longitud double precision;
ALTER TABLE public.visitas ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.cliente_notas ADD COLUMN IF NOT EXISTS nota text;
ALTER TABLE public.cliente_notas ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- ------------------------------------------------------------
-- 3) ÍNDICES
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_clientes_corredor ON public.clientes (corredor_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_corredor ON public.pedidos (corredor_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON public.pedidos (cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido ON public.pedido_items (pedido_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_corredor ON public.movimientos (corredor_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_pedido ON public.movimientos (pedido_id);
CREATE INDEX IF NOT EXISTS idx_visitas_corredor ON public.visitas (corredor_id);
CREATE INDEX IF NOT EXISTS idx_cliente_notas_cliente ON public.cliente_notas (cliente_id);

-- ------------------------------------------------------------
-- 4) FUNCIÓN + TRIGGER DE PAGO AUTOMÁTICO
-- ------------------------------------------------------------
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

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pedidos' AND column_name = 'estado_pago'
  ) THEN
    DROP TRIGGER IF EXISTS trg_pedido_estado_pago ON public.pedidos;
    CREATE TRIGGER trg_pedido_estado_pago
      AFTER UPDATE OF estado_pago ON public.pedidos
      FOR EACH ROW EXECUTE FUNCTION public.on_pedido_estado_pago();
  END IF;
END $$;

-- ============================================================
-- BACKFILL OPCIONAL: ingresos por pedidos ya pagados antes del
-- trigger. Sin duplicados (pedido_id). Descomentá y re-ejecutá.
-- ============================================================
-- INSERT INTO public.movimientos (
--   corredor_id, tipo, concepto, monto, categoria, fecha, notas, creado_por, pedido_id
-- )
-- SELECT
--   p.corredor_id,
--   'ingreso',
--   'Cobro pedido ' || left(p.id::text, 8),
--   p.monto_pagado,
--   'ventas',
--   COALESCE(p.fecha_pago::date, CURRENT_DATE),
--   'Cobro automático del pedido',
--   p.corredor_id,
--   p.id
-- FROM public.pedidos p
-- WHERE p.estado_pago = 'pagado'
--   AND p.monto_pagado > 0
--   AND NOT EXISTS (
--     SELECT 1 FROM public.movimientos m WHERE m.pedido_id = p.id
--   );