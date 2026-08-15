-- ============================================================
-- DANPA MADERAS - Vendedor en pedidos
-- 1) Columna vendedor_id en pedidos (idempotente).
-- 2) RPC listar_vendedores() para que cualquier usuario
--    autenticado pueda elegir el vendedor (perfil ventas/corredor),
--    ya que la tabla usuarios está protegida por RLS.
--
-- Ejecutar en el SQL Editor del proyecto vduqsxnuflbspmbufpdi.
-- ============================================================
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS vendedor_id uuid REFERENCES public.usuarios(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.listar_vendedores()
RETURNS SETOF public.usuarios
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.usuarios WHERE activo = true AND perfil IN ('ventas', 'corredor') ORDER BY nombre;
$$;

REVOKE ALL ON FUNCTION public.listar_vendedores() FROM public;
GRANT EXECUTE ON FUNCTION public.listar_vendedores() TO authenticated;
