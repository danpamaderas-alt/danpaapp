-- ============================================================
-- DANPA MADERAS - Fix políticas de "usuarios" (recursión RLS)
--
-- Las políticas originales usaban un subquery sobre la misma
-- tabla (EXISTS SELECT 1 FROM usuarios ...) lo que provocaba:
--   42P17 infinite recursion detected in policy for relation
-- Ahora usan public.is_admin() (SECURITY DEFINER, sin recursión).
-- También se simplifica la política de delete de productos.
-- ============================================================

DROP POLICY IF EXISTS usuarios_select ON public.usuarios;
DROP POLICY IF EXISTS usuarios_insert ON public.usuarios;
DROP POLICY IF EXISTS usuarios_update ON public.usuarios;
DROP POLICY IF EXISTS usuarios_delete ON public.usuarios;

CREATE POLICY "usuarios_select" ON public.usuarios FOR SELECT TO authenticated
USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "usuarios_insert" ON public.usuarios FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "usuarios_update" ON public.usuarios FOR UPDATE TO authenticated
USING (id = auth.uid() OR public.is_admin())
WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY "usuarios_delete" ON public.usuarios FOR DELETE TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS cat_delete_productos ON public.productos;

CREATE POLICY "cat_delete_productos" ON public.productos FOR DELETE TO authenticated
USING (public.is_admin());

-- La función is_admin() se evalúa dentro de las políticas con el
-- rol del usuario que ejecuta la consulta
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
