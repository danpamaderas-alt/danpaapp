-- ============================================================
-- DANPA MADERAS - Fix: normalizar corredor_id (por tabla)
--
-- Renombra conductor_id -> corredor_id SOLO en las tablas que
-- aún lo tengan y no tengan ya corredor_id. Cada renombre va en
-- su propio bloque DO para que un fallo no afecte a los demás.
-- Idempotente. Ejecutar en el SQL Editor del proyecto
-- vduqsxnuflbspmbufpdi.
-- ============================================================

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
    WHERE table_schema = 'public' AND table_name = 'cliente_notas' AND column_name = 'conductor_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cliente_notas' AND column_name = 'corredor_id'
  ) THEN
    ALTER TABLE public.cliente_notas RENAME COLUMN conductor_id TO corredor_id;
  END IF;
END $$;

-- Reforzar: si el trigger de pago no quedó creado, crearlo ahora.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pedidos' AND column_name = 'estado_pago'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_pedido_estado_pago' AND tgrelid = 'public.pedidos'::regclass
  ) THEN
    CREATE TRIGGER trg_pedido_estado_pago
      AFTER UPDATE OF estado_pago ON public.pedidos
      FOR EACH ROW EXECUTE FUNCTION public.on_pedido_estado_pago();
  END IF;
END $$;