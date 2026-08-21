-- Cantidad de árboles podados por trabajo de contratista (opcional)
ALTER TABLE public.contratista_trabajos
  ADD COLUMN IF NOT EXISTS cantidad_arboles integer;
