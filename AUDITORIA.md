# 📋 Auditoría de Código - DanpaApp

## ✅ Verificación contra la base de datos REAL (proyecto vduqsxnuflbspmbufpdi)

Se conectó vía Supabase CLI con token y se inspeccionó el esquema en vivo.
**Resultado: la base de datos está completa. Las migraciones YA fueron aplicadas.**

### Columnas verificadas en vivo

| Tabla | Estado |
|-------|--------|
| pedidos | ✅ Incluye `descuento`, `vendedor_id`, `tipo_pago`, etc. |
| agenda | ✅ Incluye `hora`, `hora_fin`, `lugar`, `prioridad`, `color`, `recurrencia`, `tareas`, `dias_aviso` |
| movimientos | ✅ Incluye `pagador`, `cuenta`, `tiene_factura`, `nro_factura` |
| notificaciones | ✅ Incluye `agenda_id` |

### Funciones RPC verificadas

✅ admin_crear_usuario · admin_listar_usuarios · admin_set_activo · admin_set_password
✅ crear_pedido · descontar_stock · listar_vendedores
✅ handle_new_user · is_admin · on_pedido_estado_pago

### Triggers verificados

✅ `on_auth_user_created` (auth.users → crea perfil al registrarse)
✅ `trg_pedido_estado_pago` (pedidos → movimiento automático al pagar)

### RLS (Row Level Security)

✅ Activado en las **20 tablas** públicas.

---

## 🔧 Correcciones aplicadas al código

### 1. GraficoResumen.tsx (línea 35)
Error potencial con array vacío en `Math.max(1, ...spread)`:
```typescript
const max = meses.length > 0
  ? Math.max(1, ...meses.map((m) => Math.max(m.ingreso, m.egreso)))
  : 1;
```

---

## ⚠️ Hallazgo: documentación del repo desactualizada (no bloquea)

- `supabase_schema.sql` referencia el proyecto viejo `jxjmdlnuwfpgocxypcvb`
  (ya no existe). El proyecto real es **`vduqsxnuflbspmbufpdi`**.
- El esquema base del archivo no incluye las columnas agregadas por las
  migraciones posteriores, aunque en la BD real sí existen.

**Recomendación:** regenerar `src/types.ts` desde la BD real:
```bash
npx supabase gen types typescript --project-ref vduqsxnuflbspmbufpdi > src/types.ts
```

---

## ✅ Estado final

- **TypeScript:** compila sin errores (`tsc --noEmit`)
- **Build de producción:** exitoso
- **Base de datos:** completa y consistente con lo que espera el código
- **RLS + funciones + triggers:** todos presentes
