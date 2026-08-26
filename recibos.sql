create table if not exists public.recibos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  corredor_id uuid not null,
  nro_recibo text,
  fecha date not null default current_date,
  cliente_nombre text not null,
  cliente_domicilio text,
  cliente_cuit text,
  concepto text not null,
  monto numeric(14,2) not null default 0 check (monto >= 0),
  forma_pago text,
  estado text not null default 'emitido' check (estado in ('borrador','emitido','anulado')),
  notas text
);

alter table public.recibos enable row level security;

drop policy if exists "recibos_select_propios" on public.recibos;
create policy "recibos_select_propios" on public.recibos
  for select to authenticated
  using (auth.uid() = corredor_id);

drop policy if exists "recibos_insert_propios" on public.recibos;
create policy "recibos_insert_propios" on public.recibos
  for insert to authenticated
  with check (auth.uid() = corredor_id);

drop policy if exists "recibos_update_propios" on public.recibos;
create policy "recibos_update_propios" on public.recibos
  for update to authenticated
  using (auth.uid() = corredor_id)
  with check (auth.uid() = corredor_id);

drop policy if exists "recibos_delete_propios" on public.recibos;
create policy "recibos_delete_propios" on public.recibos
  for delete to authenticated
  using (auth.uid() = corredor_id);
