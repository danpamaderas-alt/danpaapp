-- =============================================================
-- MIGRACIÓN: Mejoras para subcontratados
-- 1) Número de contrato y número de remito en los trabajos
-- 2) Tabla de historial de eventos por contratista
-- =============================================================

-- 1) Nuevos campos en contratista_trabajos
ALTER TABLE public.contratista_trabajos
  ADD COLUMN IF NOT EXISTS nro_contrato text,
  ADD COLUMN IF NOT EXISTS nro_remito text;

-- 2) Historial de eventos (creación, edición, pagos, notas)
CREATE TABLE IF NOT EXISTS public.contratista_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  contratista_id uuid NOT NULL REFERENCES public.contratistas(id) ON DELETE CASCADE,
  trabajo_id uuid REFERENCES public.contratista_trabajos(id) ON DELETE SET NULL,
  tipo text NOT NULL DEFAULT 'nota' CHECK (tipo IN ('creacion','edicion','pago','eliminado','nota')),
  descripcion text NOT NULL,
  monto double precision,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contratista_eventos_corredor
  ON public.contratista_eventos(corredor_id);
CREATE INDEX IF NOT EXISTS idx_contratista_eventos_contratista
  ON public.contratista_eventos(contratista_id, created_at DESC);

ALTER TABLE public.contratista_eventos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS own_select_contratista_eventos ON public.contratista_eventos;
CREATE POLICY own_select_contratista_eventos ON public.contratista_eventos
  FOR SELECT TO authenticated
  USING (corredor_id = auth.uid());

DROP POLICY IF EXISTS own_insert_contratista_eventos ON public.contratista_eventos;
CREATE POLICY own_insert_contratista_eventos ON public.contratista_eventos
  FOR INSERT TO authenticated
  WITH CHECK (corredor_id = auth.uid());

DROP POLICY IF EXISTS own_update_contratista_eventos ON public.contratista_eventos;
CREATE POLICY own_update_contratista_eventos ON public.contratista_eventos
  FOR UPDATE TO authenticated
  USING (corredor_id = auth.uid())
  WITH CHECK (corredor_id = auth.uid());

DROP POLICY IF EXISTS own_delete_contratista_eventos ON public.contratista_eventos;
CREATE POLICY own_delete_contratista_eventos ON public.contratista_eventos
  FOR DELETE TO authenticated
  USING (corredor_id = auth.uid());

GRANT ALL ON TABLE public.contratista_eventos TO authenticated, service_role;
