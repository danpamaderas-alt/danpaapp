-- ============================================================
-- DANPA MADERAS - Descuento en pedidos
-- Agrega la columna descuento a pedidos (idempotente).
--
-- Ejecutar en el SQL Editor del proyecto vduqsxnuflbspmbufpdi.
-- ============================================================
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS descuento numeric NOT NULL DEFAULT 0;
