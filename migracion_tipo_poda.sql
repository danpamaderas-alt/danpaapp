-- DANPA MADERAS - Tipo de poda en podas (de altura / al ras / extracción)
-- Idempotente. Ejecutar en el SQL Editor del proyecto vduqsxnuflbspmbufpdi.
ALTER TABLE public.podas ADD COLUMN IF NOT EXISTS tipo_poda text;