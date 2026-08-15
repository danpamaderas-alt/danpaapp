-- ============================================================
-- DANPA MADERAS - Tipos de liquidación ampliados
-- Permite: fijo, por_hora, por_dia, por_produccion, por_semana, quincenal
-- ============================================================
ALTER TABLE public.empleados DROP CONSTRAINT IF EXISTS empleados_tipo_liquidacion_check;

ALTER TABLE public.empleados ADD CONSTRAINT empleados_tipo_liquidacion_check
  CHECK (tipo_liquidacion IN ('fijo', 'por_hora', 'por_dia', 'por_produccion', 'por_semana', 'quincenal'));
