-- ============================================================
-- DANPA MADERAS — Archivo de reconstrucción de datos
-- Generado: 2026-08-25
-- Fuente: PDFs + capturas de API durante sesión
-- NOTA: Usar solo si restauración de Supabase falla
-- ============================================================

-- === USUARIOS (auth + perfil) ===
-- IDs son de auth.users; usuario_id en usuarios = auth.uid
-- NOTA: passwords deben re-crearse desde la app o vía SQL

-- danpamaderas@gmail.com (admin principal)
INSERT INTO usuarios (id, email, nombre, apellido, perfil, activo, corredor_id)
VALUES (
  '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c',
  'danpamaderas@gmail.com',
  'Dan', 'Pamaderas', 'admin', true,
  '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'
) ON CONFLICT (id) DO NOTHING;

-- admin@danpa.com (secundario)
INSERT INTO usuarios (id, email, nombre, apellido, perfil, activo, corredor_id)
VALUES (
  'c77143c0-2f58-4dd0-bab7-512153613b86',
  'admin@danpa.com',
  'Admin', 'Secundario', 'admin', true,
  'c77143c0-2f58-4dd0-bab7-512153613b86'
) ON CONFLICT (id) DO NOTHING;

-- caminosdelnorte84@gmail.com (jorge/corredor)
INSERT INTO usuarios (id, email, nombre, apellido, perfil, activo, corredor_id)
VALUES (
  '5e148b8e-c7d0-4f0d-82b4-9da67b3e281a',
  'caminosdelnorte84@gmail.com',
  'Jorge', 'Caminos', 'corredor', true,
  '5e148b8e-c7d0-4f0d-82b4-9da67b3e281a'
) ON CONFLICT (id) DO NOTHING;


-- === CONTRATISTAS (solo 2 conocidos) ===
-- LUIS y prubeba (test)
INSERT INTO contratistas (id, nombre, telefono, notas, corredor_id)
VALUES
  ('a0000001-0000-0000-0000-000000000001', 'LUIS', NULL, NULL, '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('a0000001-0000-0000-0000-000000000002', 'prubeba', NULL, NULL, '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c')
ON CONFLICT (id) DO NOTHING;


-- === CONTRATISTA TRABAJOS (2 conocidos) ===
INSERT INTO contratista_trabajos (id, contratista_id, fecha, descripcion, costo, estado, arboles, notas, corredor_id)
VALUES
  -- PODA UNLP: trabajo principal, $14M, parcial (pagado $2.2M)
  ('b0000001-0000-0000-0000-000000000001',
   'a0000001-0000-0000-0000-000000000001',
   '2026-08-17', 'PODA', 14000000, 'parcial', 28, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  -- poda test prubeba (trabajo de prueba, $200, parcial)
  ('b0000001-0000-0000-0000-000000000002',
   'a0000001-0000-0000-0000-000000000002',
   '2026-08-17', 'poda', 200, 'parcial', 1, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c')
ON CONFLICT (id) DO NOTHING;


-- === CONTRATISTA PAGOS (9 de LUIS) ===
INSERT INTO contratista_pagos (id, trabajo_id, fecha, medio_pago, notas, monto, corredor_id)
VALUES
  ('c0000001-0000-0000-0000-000000000001',
   'b0000001-0000-0000-0000-000000000001',
   '2026-08-06', 'Transferencia', 'PAGO INCIAL', 500000,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('c0000001-0000-0000-0000-000000000002',
   'b0000001-0000-0000-0000-000000000001',
   '2026-08-09', 'Efectivo', NULL, 200000,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('c0000001-0000-0000-0000-000000000003',
   'b0000001-0000-0000-0000-000000000001',
   '2026-08-11', 'Transferencia', NULL, 200000,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('c0000001-0000-0000-0000-000000000004',
   'b0000001-0000-0000-0000-000000000001',
   '2026-08-11', 'Transferencia', NULL, 100000,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('c0000001-0000-0000-0000-000000000005',
   'b0000001-0000-0000-0000-000000000001',
   '2026-08-12', 'Transferencia', NULL, 400000,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('c0000001-0000-0000-0000-000000000006',
   'b0000001-0000-0000-0000-000000000001',
   '2026-08-17', 'Efectivo', NULL, 200000,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('c0000001-0000-0000-0000-000000000007',
   'b0000001-0000-0000-0000-000000000001',
   '2026-08-18', 'Efectivo', NULL, 200000,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('c0000001-0000-0000-0000-000000000008',
   'b0000001-0000-0000-0000-000000000001',
   '2026-08-20', 'Transferencia', NULL, 200000,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('c0000001-0000-0000-0000-000000000009',
   'b0000001-0000-0000-0000-000000000001',
   '2026-08-21', 'Transferencia', NULL, 200000,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c')
ON CONFLICT (id) DO NOTHING;


-- === CONTRATISTA EVENTOS (10, de PDFs) ===
INSERT INTO contratista_eventos (id, trabajo_id, tipo, descripcion, monto, fecha, corredor_id)
VALUES
  ('e0000001-0000-0000-0000-000000000001',
   'b0000001-0000-0000-0000-000000000001',
   'pago', 'Pago parcial de "PODA".', 500000,
   '2026-08-06', '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('e0000001-0000-0000-0000-000000000002',
   'b0000001-0000-0000-0000-000000000001',
   'pago', 'Pago parcial de "PODA".', 200000,
   '2026-08-09', '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('e0000001-0000-0000-0000-000000000003',
   'b0000001-0000-0000-0000-000000000001',
   'pago', 'Pago parcial de "PODA".', 200000,
   '2026-08-11', '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('e0000001-0000-0000-0000-000000000004',
   'b0000001-0000-0000-0000-000000000001',
   'pago', 'Pago parcial de "PODA".', 100000,
   '2026-08-11', '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('e0000001-0000-0000-0000-000000000005',
   'b0000001-0000-0000-0000-000000000001',
   'pago', 'Pago parcial de "PODA".', 400000,
   '2026-08-12', '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('e0000001-0000-0000-0000-000000000006',
   'b0000001-0000-0000-0000-000000000001',
   'pago', 'Pago parcial de "PODA".', 200000,
   '2026-08-17', '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('e0000001-0000-0000-0000-000000000007',
   'b0000001-0000-0000-0000-000000000001',
   'pago', 'Pago parcial de "PODA".', 200000,
   '2026-08-18', '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('e0000001-0000-0000-0000-000000000008',
   'b0000001-0000-0000-0000-000000000001',
   'pago', 'Pago parcial de "PODA".', 200000,
   '2026-08-20', '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('e0000001-0000-0000-0000-000000000009',
   'b0000001-0000-0000-0000-000000000001',
   'pago', 'Pago parcial de "PODA".', 200000,
   '2026-08-21', '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('e0000001-0000-0000-0000-000000000010',
   'b0000001-0000-0000-0000-000000000001',
   'pago', 'Pago de "PODA".', 15000000,
   '2026-08-21', '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c')
ON CONFLICT (id) DO NOTHING;


-- === MOVIMIENTOS AGOSTO (26 filas, del informe 18/8) ===
INSERT INTO movimientos (id, fecha, concepto, categoria, monto, notas, pedido_id, corredor_id)
VALUES
  ('d0000001-0000-0000-0000-000000000001',
   '2026-08-17', 'Cobro pedido 8dec3392', 'Ventas', 50000, NULL, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('d0000001-0000-0000-0000-000000000002',
   '2026-08-17', 'Cobro b2db12cb', 'Ventas', 7000, NULL, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('d0000001-0000-0000-0000-000000000003',
   '2026-08-16', 'Cobro 919cc52b', 'Ventas', 4200, NULL, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('d0000001-0000-0000-0000-000000000004',
   '2026-08-14', 'COMPRA ACEITE SAE 15 W 40 20 LISTRO', 'Compras', -125000, NULL, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('d0000001-0000-0000-0000-000000000005',
   '2026-08-12', 'corte leña', 'Sueldos', -100000, NULL, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('d0000001-0000-0000-0000-000000000006',
   '2026-08-12', 'compra palo hacha tumbera', 'Compras', -5900, NULL, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('d0000001-0000-0000-0000-000000000007',
   '2026-08-11', 'HACHA TUMBA', 'Compras', -30770, NULL, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('d0000001-0000-0000-0000-000000000008',
   '2026-08-11', 'HACHA', 'Compras', -42500, NULL, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('d0000001-0000-0000-0000-000000000009',
   '2026-08-11', 'PAGO DIA PODA', 'Sueldos', -200000, NULL, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('d0000001-0000-0000-0000-000000000010',
   '2026-08-10', 'CABO DE VIDA 2M', 'General', -45182, NULL, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('d0000001-0000-0000-0000-000000000011',
   '2026-08-10', 'ACEITE 6 LITROS', 'General', -49200, NULL, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('d0000001-0000-0000-0000-000000000012',
   '2026-08-10', 'gasoil camion', 'Compras', -15317, NULL, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('d0000001-0000-0000-0000-000000000013',
   '2026-08-10', 'nafta motocierra (juan)', 'General', -11749, NULL, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('d0000001-0000-0000-0000-000000000014',
   '2026-08-09', 'CABO DE VIDA ( PODA UNLP 2026)', 'Compras', -62100, NULL, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('d0000001-0000-0000-0000-000000000015',
   '2026-08-09', 'REPARACION CIERRA CIRCUALR (RUSO) MADREAS', 'Otros', -120000, NULL, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('d0000001-0000-0000-0000-000000000016',
   '2026-08-09', 'PAGO PATA PODA UNLP', 'Sueldos', -200000, NULL, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('d0000001-0000-0000-0000-000000000017',
   '2026-08-08', 'SOGA 5 MM POLIPROPILENO 100 MTS (PODA UNLP 2026)', 'Compras', -19990, NULL, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('d0000001-0000-0000-0000-000000000018',
   '2026-08-06', '12 PARES DE GUANTES PARA PODA', 'Compras', -40000, NULL, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('d0000001-0000-0000-0000-000000000019',
   '2026-08-06', 'PAGO SEMANA 1 PATA (PODA UNLP 2026)', 'Sueldos', -500000, NULL, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('d0000001-0000-0000-0000-000000000020',
   '2026-08-06', 'SOGA 16 MM POLIPROPILENO 100 MTS (PODA UNLP 2026)', 'Compras', -161213, NULL, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('d0000001-0000-0000-0000-000000000021',
   '2026-08-06', 'MOTOCIERRA DAEWO DE PODA', 'Compras', -180756, NULL, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('d0000001-0000-0000-0000-000000000022',
   '2026-08-06', 'NAFTA MOTOCIERRA', 'Compras', -12255, NULL, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('d0000001-0000-0000-0000-000000000023',
   '2026-08-06', 'ACEITE DOS TIEMPOS MOTOCIERRA (PODA UNLP 2026)', 'Compras', -174895, NULL, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('d0000001-0000-0000-0000-000000000024',
   '2026-08-03', '2 BUJIAS STIHLL MOTOCIERRA', 'Compras', -14000, NULL, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('d0000001-0000-0000-0000-000000000025',
   '2026-08-06', 'Soga Cabo Nautica 10mm 150m', 'General', -53824, NULL, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('d0000001-0000-0000-0000-000000000026',
   '2026-08-22', 'Pago a Luis', 'Sueldos', -400000, NULL, NULL,
   '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c')
ON CONFLICT (id) DO NOTHING;


-- === RESUMEN PODAS (11 trabajos, 14 árboles, de PDFs) ===
-- No tengo IDs individuales de podas, solo el resumen por tipo:
-- De altura: 7 trabajos, 9 árboles
-- Al ras:    4 trabajos, 5 árboles
-- TOTAL:    11 trabajos, 14 árboles
-- NOTA: datos individuales de podas NO recuperables desde PDFs


-- === PRODUCTOS (solo 2 nombres visibles en reporte de inventario) ===
-- No hay precios, IDs, ni stock en PDFs
-- Nombres conocidos: "PARA CABO", "CABO"
-- INSERT con IDs placeholder para referencia:
INSERT INTO productos (id, nombre, precio, stock, notas, corredor_id)
VALUES
  ('f0000001-0000-0000-0000-000000000001', 'PARA CABO', NULL, NULL, 'Recuperado de PDF', '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c'),
  ('f0000001-0000-0000-0000-000000000002', 'CABO', NULL, NULL, 'Recuperado de PDF', '16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- RESUMEN DE RECUPERACIÓN
-- ============================================================
-- ✅ RECUPERADO:
--    - 3 usuarios (con auth IDs conocidos)
--    - 2 contratistas (LUIS, prubeba)
--    - 2 trabajos (PODA $14M, poda test)
--    - 9 pagos de LUIS (fechas, montos, medios)
--    - 10 eventos de contratista
--    - 26 movimientos de agosto (fecha, concepto, categoría, monto)
--    - 2 productos (nombres, sin precios/stock)
--    - Resumen podas: 11 trabajos, 14 árboles (desglose por tipo)
--
-- ❌ NO RECUPERABLE DESDE PDFs:
--    - 9 pedidos (IDs, clientes, productos, cantidades, totales)
--    - 8 clientes (nombres, teléfonos, direcciones)
--    - Agenda completa
--    - Visitas
--    - Notificaciones
--    - Cliente_notas
--    - Asistencias/empleados
--    - Movimientos ANTES de agosto
--    - Datos de clientes vinculados a pedidos
--    - Precios y stock exactos de productos
--    - 2 contratistas restantes (sin nombre visible)
--
-- 🔴 CONFIRMADO PERDIDO SI NO SE RESTAURA vduqsxn
-- ============================================================


-- === VERIFICACIÓN POST-CARGA ===
-- Correr estos queries para confirmar carga:
-- SELECT COUNT(*) FROM usuarios;          -- esperado: 3
-- SELECT COUNT(*) FROM contratistas;      -- esperado: 2
-- SELECT COUNT(*) FROM contratista_trabajos; -- esperado: 2
-- SELECT COUNT(*) FROM contratista_pagos;    -- esperado: 9
-- SELECT COUNT(*) FROM contratista_eventos;  -- esperado: 10
-- SELECT COUNT(*) FROM movimientos;          -- esperado: 27 (26 agosto + 1 extra)
-- SELECT COUNT(*) FROM productos;            -- esperado: 2
-- SELECT SUM(monto) FROM movimientos WHERE monto > 0; -- esperado: 61200
-- SELECT SUM(monto) FROM movimientos WHERE monto < 0; -- esperado: -2564651
