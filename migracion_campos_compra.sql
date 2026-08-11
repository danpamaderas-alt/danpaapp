-- ============================================================
-- DANPA MADERAS - Campos extra para movimientos (finanzas)
-- Agrega metadata por compra: quién pagó, cuenta/método de pago
-- y factura (emitiida + número). Idempotente.
--
-- Ejecutar en el SQL Editor del proyecto vduqsxnuflbspmbufpdi.
-- ============================================================
ALTER TABLE public.movimientos ADD COLUMN IF NOT EXISTS pagador text;
ALTER TABLE public.movimientos ADD COLUMN IF NOT EXISTS cuenta text;
ALTER TABLE public.movimientos ADD COLUMN IF NOT EXISTS tiene_factura boolean NOT NULL DEFAULT false;
ALTER TABLE public.movimientos ADD COLUMN IF NOT EXISTS nro_factura text;