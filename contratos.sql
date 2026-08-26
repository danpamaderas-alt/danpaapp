-- ============================================================
-- MÓDULO CONTRATOS — ejecutar en SQL Editor del proyecto tmiaef
-- (eprservintegrales) antes de usar el módulo en la app
-- ============================================================

create table if not exists public.contratos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  corredor_id uuid not null,
  tipo text not null default 'cliente' check (tipo in ('cliente','subcontratista')),
  nro_contrato text,
  titulo text not null,
  contraparte text,
  descripcion text,
  lugar text,
  fecha date not null default current_date,
  fecha_fin date,
  monto numeric(14,2) not null default 0 check (monto >= 0),
  forma_pago text,
  estado text not null default 'activo' check (estado in ('borrador','activo','finalizado','cancelado')),
  notas text
);

alter table public.contratos enable row level security;

drop policy if exists "contratos_select_propios" on public.contratos;
create policy "contratos_select_propios" on public.contratos
  for select to authenticated
  using (auth.uid() = corredor_id);

drop policy if exists "contratos_insert_propios" on public.contratos;
create policy "contratos_insert_propios" on public.contratos
  for insert to authenticated
  with check (auth.uid() = corredor_id);

drop policy if exists "contratos_update_propios" on public.contratos;
create policy "contratos_update_propios" on public.contratos
  for update to authenticated
  using (auth.uid() = corredor_id)
  with check (auth.uid() = corredor_id);

drop policy if exists "contratos_delete_propios" on public.contratos;
create policy "contratos_delete_propios" on public.contratos
  for delete to authenticated
  using (auth.uid() = corredor_id);

-- Verificación:
-- select count(*) from public.contratos;  -- esperado: 0
