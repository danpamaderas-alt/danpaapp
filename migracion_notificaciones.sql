-- ============================================================
-- DANPA MADERAS - Tabla de notificaciones
-- Idempotente. Ejecutar en el SQL Editor del proyecto
-- vduqsxnuflbspmbufpdi.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid NOT NULL REFERENCES public.usuarios (id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('stock_bajo', 'agenda_proxima', 'pago_pendiente', 'mantenimiento')),
  nivel text NOT NULL CHECK (nivel IN ('info', 'warning', 'error', 'success')),
  titulo text NOT NULL,
  mensaje text NOT NULL,
  enlace text,
  dato_referencia text,
  leido boolean NOT NULL DEFAULT false,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_corredor ON public.notificaciones (corredor_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_creado ON public.notificaciones (creado_en DESC);

-- Fase 1: REVOKE de anon (RLS ya está habilitada por migracion_seguridad_rls.sql
-- con políticas own_* para authenticated). El GRANT ALL a anon era un riesgo
-- latente: con RLS deshabilitada, cualquiera podía leer/escribir notificaciones.
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.notificaciones FROM anon;
GRANT ALL ON TABLE public.notificaciones TO authenticated, service_role;
