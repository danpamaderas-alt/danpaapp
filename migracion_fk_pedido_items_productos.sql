-- ============================================================
-- DANPA MADERAS - Fix FK pedido_items -> productos
--
-- La tabla pedido_items tenía la columna producto_id pero sin
-- constraint FOREIGN KEY hacia productos(id), por lo que
-- PostgREST no encontraba la relación y las consultas con
-- pedido_items(*, productos(...)) fallaban con PGRST200
-- ("Could not find a relationship between 'pedido_items' and
-- 'productos'").
-- ============================================================

ALTER TABLE public.pedido_items
  ADD CONSTRAINT pedido_items_producto_id_fkey
  FOREIGN KEY (producto_id) REFERENCES public.productos(id)
  ON DELETE RESTRICT;

NOTIFY pgrst, 'reload schema';
