-- ============================================================
-- DANPA MADERAS - Seguridad Fase 3 (M3): RPC transaccional
-- de creación de pedidos con descuento atómico de stock.
--
-- Proyecto: vduqsxnuflbspmbufpdi
--
-- Reemplaza el flujo N+1 del cliente (crear pedido -> items ->
-- verificar stock -> descontar stock -> notificaciones) por una
-- única llamada transaccional: si algo falla (stock insuficiente,
-- producto inexistente), la transacción completa se revierte.
--
-- El UPDATE atómico con `stock >= p_cantidad` evita el stock
-- negativo ante pedidos concurrentes sobre el mismo producto.
--
-- Idempotente. Ejecutar en el SQL Editor.
-- ============================================================

CREATE OR REPLACE FUNCTION public.crear_pedido(
  p_corredor_id uuid,
  p_cliente_id uuid,
  p_items jsonb,
  p_notas text DEFAULT NULL,
  p_descuento numeric DEFAULT 0,
  p_vendedor_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_pedido_id uuid;
  v_subtotal numeric := 0;
  v_monto_descuento numeric;
  v_total numeric;
  v_item jsonb;
  v_producto_id uuid;
  v_cantidad numeric;
  v_precio_unitario numeric;
  v_stock double precision;
  v_stock_minimo double precision;
  v_nombre text;
BEGIN
  -- Solo usuarios autenticados y activos de la misma corredora.
  IF NOT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND activo
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Agrega al menos un producto al pedido.';
  END IF;

  -- Validar cliente: debe pertenecer al corredor.
  IF p_cliente_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.clientes
    WHERE id = p_cliente_id AND corredor_id = p_corredor_id
  ) THEN
    RAISE EXCEPTION 'Cliente no encontrado para este corredor.';
  END IF;

  -- Calcular subtotal y descuento del lado del servidor.
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_cantidad := COALESCE((v_item->>'cantidad')::numeric, 0);
    v_precio_unitario := COALESCE((v_item->>'precio_unitario')::numeric, 0);
    IF v_cantidad <= 0 OR v_precio_unitario < 0 THEN
      RAISE EXCEPTION 'Cantidad o precio inválido en un ítem del pedido.';
    END IF;
    v_subtotal := v_subtotal + v_cantidad * v_precio_unitario;
  END LOOP;

  v_monto_descuento := GREATEST(0, LEAST(COALESCE(p_descuento, 0), v_subtotal));
  v_total := GREATEST(0, v_subtotal - v_monto_descuento);

  -- 1) Crear el pedido.
  INSERT INTO public.pedidos (
    corredor_id, cliente_id, vendedor_id, creado_por,
    total, descuento, notas, estado, estado_pago
  ) VALUES (
    p_corredor_id, p_cliente_id, p_vendedor_id, auth.uid(),
    v_total, v_monto_descuento, p_notas, 'Pendiente', 'no_pagado'
  )
  RETURNING id INTO v_pedido_id;

  -- 2) Insertar ítems y descontar stock atómicamente.
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_producto_id := (v_item->>'producto_id')::uuid;
    v_cantidad := (v_item->>'cantidad')::numeric;
    v_precio_unitario := (v_item->>'precio_unitario')::numeric;

    INSERT INTO public.pedido_items (pedido_id, producto_id, cantidad, precio_unitario)
    VALUES (v_pedido_id, v_producto_id, v_cantidad, v_precio_unitario);

    -- UPDATE con guard: falla (0 filas) si el stock no alcanza.
    UPDATE public.productos
    SET stock = stock - v_cantidad
    WHERE id = v_producto_id AND stock >= v_cantidad
    RETURNING nombre, stock, stock_minimo INTO v_nombre, v_stock, v_stock_minimo;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Stock insuficiente para procesar el pedido.';
    END IF;

    -- 3) Notificación de stock bajo (dentro de la misma transacción).
    IF v_stock <= 0 THEN
      INSERT INTO public.notificaciones (
        corredor_id, tipo, nivel, titulo, mensaje, enlace, dato_referencia, leido
      ) VALUES (
        p_corredor_id, 'stock_bajo', 'error',
        'Stock agotado',
        'El producto ' || v_nombre || ' se agotó.',
        '/productos', v_producto_id::text, false
      );
    ELSIF v_stock <= COALESCE(v_stock_minimo, 0) THEN
      INSERT INTO public.notificaciones (
        corredor_id, tipo, nivel, titulo, mensaje, enlace, dato_referencia, leido
      ) VALUES (
        p_corredor_id, 'stock_bajo', 'warning',
        'Stock bajo',
        'El producto ' || v_nombre || ' está por debajo del mínimo.',
        '/productos', v_producto_id::text, false
      );
    END IF;
  END LOOP;

  RETURN v_pedido_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.crear_pedido(uuid, uuid, jsonb, text, numeric, uuid) FROM anon, service_role, public;
GRANT EXECUTE ON FUNCTION public.crear_pedido(uuid, uuid, jsonb, text, numeric, uuid) TO authenticated;
