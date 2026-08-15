-- ============================================================
-- DANPA MADERAS - Extras en asistencias
-- Agrega horas extra a la planilla del día (idempotente).
-- ============================================================
ALTER TABLE public.asistencias ADD COLUMN IF NOT EXISTS horas_extra double precision NOT NULL DEFAULT 0;
