-- ============================================================
-- DANPA MADERAS - Modo GOD
-- Desactiva RLS para que la app funcione sin login (anon key
-- libre). Ejecutalo en el SQL Editor del proyecto
-- vduqsxnuflbspmbufpdi.
-- ============================================================
ALTER TABLE public.usuarios      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_items  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitas       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_notas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_opciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.podas           DISABLE ROW LEVEL SECURITY;