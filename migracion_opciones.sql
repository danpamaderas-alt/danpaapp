-- ============================================================
-- DANPA MADERAS - Listas de opciones persistentes para finanzas
-- Guarda pagadores y cuentas/métodos de pago usados, para que
-- aparezcan en los desplegables aunque no haya movimientos cargados.
-- Idempotente. Ejecutar en el SQL Editor del proyecto vduqsxnuflbspmbufpdi.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.movimientos_opciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid NOT NULL REFERENCES public.usuarios (id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('pagador', 'cuenta')),
  valor text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (corredor_id, tipo, valor)
);

CREATE INDEX IF NOT EXISTS idx_movimientos_opciones_corredor ON public.movimientos_opciones (corredor_id);