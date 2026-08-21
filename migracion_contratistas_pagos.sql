-- =============================================================
-- MIGRACIÓN: Pagos parciales de trabajos de subcontratados
-- 1) Nuevo estado 'parcial' en contratista_trabajos
-- 2) Tabla contratista_pagos (un registro por cada pago, parcial o total)
-- =============================================================

ALTER TABLE public.contratista_trabajos DROP CONSTRAINT IF EXISTS contratista_trabajos_estado_check;
ALTER TABLE public.contratista_trabajos
  ADD CONSTRAINT contratista_trabajos_estado_check
  CHECK (estado IN ('pendiente','parcial','pagado'));

CREATE TABLE IF NOT EXISTS public.contratista_pagos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  contratista_id uuid NOT NULL REFERENCES public.contratistas(id) ON DELETE CASCADE,
  trabajo_id uuid NOT NULL REFERENCES public.contratista_trabajos(id) ON DELETE CASCADE,
  monto double precision NOT NULL CHECK (monto > 0),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  metodo text,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contratista_pagos_corredor
  ON public.contratista_pagos(corredor_id);
CREATE INDEX IF NOT EXISTS idx_contratista_pagos_trabajo
  ON public.contratista_pagos(trabajo_id, fecha);

ALTER TABLE public.contratista_pagos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS own_select_contratista_pagos ON public.contratista_pagos;
CREATE POLICY own_select_contratista_pagos ON public.contratista_pagos
  FOR SELECT TO authenticated
  USING (corredor_id = auth.uid());

DROP POLICY IF EXISTS own_insert_contratista_pagos ON public.contratista_pagos;
CREATE POLICY own_insert_contratista_pagos ON public.contratista_pagos
  FOR INSERT TO authenticated
  WITH CHECK (corredor_id = auth.uid());

DROP POLICY IF EXISTS own_delete_contratista_pagos ON public.contratista_pagos;
CREATE POLICY own_delete_contratista_pagos ON public.contratista_pagos
  FOR DELETE TO authenticated
  USING (corredor_id = auth.uid());

GRANT ALL ON TABLE public.contratista_pagos TO authenticated, service_role;
