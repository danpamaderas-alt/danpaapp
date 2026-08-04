# DANPA MADERAS

App de gestión para la venta de maderas: pedidos, stock, clientes, visitas y finanzas por corredor/revendedor.

## Stack

- React 19 + Vite 6 + TypeScript
- Tailwind CSS 4 (con modo oscuro)
- Supabase (PostgreSQL + autenticación REST)
- lucide-react (íconos)

## Requisitos

- Node.js 20+

## Configuración

1. Instalá las dependencias:

   ```bash
   npm install
   ```

2. Creá el archivo `.env` en la raíz con los datos de tu proyecto de Supabase (ver `.env.example`):

   ```
   VITE_SUPABASE_URL="https://TU-PROYECTO.supabase.co"
   VITE_SUPABASE_ANON_KEY="TU-ANON-KEY"
   ```

3. Levantá el servidor de desarrollo:

   ```bash
   npm run dev
   ```

## Configuración de Supabase (primera vez)

La base ya viene descrita en `supabase_schema.sql`. Para armarla:

1. En el dashboard de Supabase abrí **SQL Editor** y ejecutá todo el contenido de `supabase_schema.sql`.
2. En **Authentication → Providers → Email**: activá el proveedor de email. Si no querés que pidan confirmación por email, desactivá "Confirm email".
3. Registrate desde la app (pestaña "Crear cuenta"): el primer usuario crea su perfil de corredor automáticamente.
4. Cada corredor entra con su propio email/contraseña y solo ve sus clientes, pedidos, visitas y finanzas. El catálogo de productos es compartido.

## Scripts

| Comando         | Descripción                            |
| --------------- | -------------------------------------- |
| `npm run dev`   | Servidor de desarrollo (puerto 3000)   |
| `npm run build` | Compilación de producción a `dist/`    |
| `npm run lint`  | Typecheck con `tsc --noEmit`           |
| `npm run preview` | Previsualiza el build de producción  |

## Estructura

- `src/lib/` — cliente de Supabase y funciones de datos (pedidos, clientes, visitas, finanzas, corredores, notas).
- `src/components/` — vistas de la app (Dashboard, Productos, Nuevo Pedido, Mis Pedidos, Clientes, Visitas, Finanzas).
- `src/types.ts` — tipos generados a mano para el esquema de Supabase.
