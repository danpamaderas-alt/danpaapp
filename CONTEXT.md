# Contexto del Proyecto - Danpa App

## Estado Actual (2026-08-26)

### CATÁSTROFE DE DATOS
- Script `audit3b-exploit.js` borró las 4 cuentas auth → FK cascade eliminó todas las tablas de negocio
- Proyecto viejo `vduqsxnuflbspmbufpdi` ELIMINADO por el usuario → sin backup (plan gratuito, PITR off)
- **Email enviado a support@supabase.com** para restaurar vduqsxn — pendiente respuesta

### Proyecto Nuevo
- **Supabase**: `tmiaefwtidosnmyeikmj` (`eprservintegrales`)
- **Worker**: `danpaapp` → `danpaapp.danpamaderas.workers.dev`
- **Cloudflare Account**: `5ccf9f2ef037efaaeda80286ded8494d`

### Auth Users (tmiaef)
| Email | UUID | Password | Perfil |
|-------|------|----------|--------|
| danpamaderas@gmail.com | 16fcafca-0f5c-4cf5-abf8-7f7b81d7b45c | DanpaMaderas2026 | admin |
| admin@danpa.com | 780b0936-9fcb-4b2c-9074-519613cc6b63 | Danpa2026! | admin |
| caminosdelnorte84@gmail.com | 8fa85051-ea19-4073-aae1-ed1ffa4f1cb4 | Temporal2026! | ventas |

### Datos Cargados en tmiaef (verificados)
- `usuarios`: 3 filas (Dan, Admin, Jorge)
- `contratistas`: 2 filas (LUIS, prubeba)
- `contratista_trabajos`: 2 filas (PODA $14M + poda $200)
- `contratista_pagos`: 13 filas
- `contratista_eventos`: 13 filas historial de pagos
- `movimientos`: 30 filas (ingresos + egresos desde 11 PDFs)
- `productos`: 1 fila (MADERITAS)
- RLS policies completas en todas las tablas
- **EXPORT COMPLETO**: `db-dump-full.sql` (schema + data + RLS + functions)

### Pendientes
1. Esperar respuesta de Supabase support para restaurar vduqsxn
2. ~70% de datos NO recuperables desde PDFs: pedidos(9), clientes(8), agenda, visitas, notificaciones, empleados, asistencias, movimientos pre-agosto, precios/stock
3. Crear tablas faltantes en tmiaef si se restauran datos (empleados, asistencias, licencias, agenda, visitas, liquidaciones, podas, recibos, contratos, cliente_notas)

### Credenciales
- Ver archivo `.env` para Supabase URL y anon key
- Ver gestor de contraseñas para PAT Supabase y GitHub

### Archivos Importantes
- `recovery.sql` — SQL de reconstrucción desde PDFs (parcial)
- `db-dump-full.sql` — **DUMP COMPLETO**: schema + data + RLS + functions (incluye todo lo recuperado)
- `.env` — credenciales tmiaef
- `wrangler.toml` — config Worker
- `AUDITORIA.md` — informe de auditoría de seguridad
- `src/components/ContratistasInforme.tsx` — filtro eventos edicion
- `src/lib/supabase.ts` — cliente Supabase

### Auditoría de Seguridad (completada)
1. Auto-escalación a admin vía API
2. `productos_escribir` ALL policy
3. Signup público
4. Policies duplicadas
5. Backups desactivados
