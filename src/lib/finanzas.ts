import { supabase } from './supabase';
import { getErrorMessage } from './format';
import type { Database } from '../types';

export type Movimiento = Database['public']['Tables']['movimientos']['Row'];

type FiltrosMovimientos = {
  corredorId: string;
  desde?: string;
  hasta?: string;
  tipo?: string;
  categoria?: string;
};

export type MovimientoInput = {
  corredor_id: string;
  concepto: string;
  /** Positivo = ingreso, negativo = egreso. */
  monto: number;
  categoria: string;
  fecha: string;
  notas?: string;
  creado_por?: string;
  pagador?: string;
  cuenta?: string;
  tiene_factura?: boolean;
  nro_factura?: string;
};

export const CATEGORIAS = [
  'General',
  'Ventas',
  'Compras',
  'Sueldos',
  'Contratistas',
  'Otros',
];

// Opciones de los desplegables. Si aparece "Otro..." en el formulario
// podés escribir un valor nuevo y quedará guardado en el movimiento.
export const OPCIONES_PAGADOR = ['Daniel', 'Jorge', 'Gerardo'];
export const OPCIONES_CUENTA = [
  'Efectivo',
  'MercadoLibre',
  'Mercado Pago',
  'Cuenta DNI',
  'Transferencia',
  'Tarjeta',
];

export async function fetchMovimientos(filtros: FiltrosMovimientos): Promise<Movimiento[]> {
  let query = supabase
    .from('movimientos')
    .select('id, corredor_id, concepto, monto, categoria, fecha, notas, creado_por, pagador, cuenta, tiene_factura, nro_factura')
    .eq('corredor_id', filtros.corredorId)
    .order('fecha', { ascending: false })
    .limit(500);

  if (filtros.desde) query = query.gte('fecha', filtros.desde);
  if (filtros.hasta) query = query.lte('fecha', filtros.hasta);
  if (filtros.tipo === 'ingreso') query = query.gte('monto', 0);
  if (filtros.tipo === 'egreso') query = query.lt('monto', 0);
  if (filtros.categoria) query = query.eq('categoria', filtros.categoria);

  const { data, error } = await query;
  if (error) throw error;
  return (data as Movimiento[]) || [];
}

export async function crearMovimiento(input: MovimientoInput): Promise<Movimiento> {
  const { data, error } = await supabase
    .from('movimientos')
    .insert({
      corredor_id: input.corredor_id,
      concepto: input.concepto,
      monto: input.monto,
      categoria: input.categoria,
      fecha: input.fecha,
      notas: input.notas || null,
      creado_por: input.creado_por || null,
      pagador: input.pagador || null,
      cuenta: input.cuenta || null,
      tiene_factura: input.tiene_factura ?? false,
      nro_factura: input.nro_factura || null,
    })
    .select()
    .single();

  if (error) throw new Error(getErrorMessage(error));
  return data as Movimiento;
}

export async function actualizarMovimiento(id: string, patch: Partial<MovimientoInput>): Promise<void> {
  const { error } = await supabase.from('movimientos').update(patch).eq('id', id);
  if (error) throw new Error(getErrorMessage(error));
}

export async function eliminarMovimiento(id: string): Promise<void> {
  const { error } = await supabase.from('movimientos').delete().eq('id', id);
  if (error) throw new Error(getErrorMessage(error));
}

type OpcionesFinanzas = { pagadores: string[]; cuentas: string[] };

export async function fetchOpciones(corredorId: string): Promise<OpcionesFinanzas> {
  const { data, error } = await supabase
    .from('movimientos_opciones')
    .select('tipo, valor')
    .eq('corredor_id', corredorId);
  if (error) throw new Error(getErrorMessage(error));

  const pagadores: string[] = [];
  const cuentas: string[] = [];
  (data || []).forEach((o) => {
    if (o.tipo === 'pagador') pagadores.push(o.valor);
    if (o.tipo === 'cuenta') cuentas.push(o.valor);
  });
  return { pagadores, cuentas };
}

type TipoOpcion = 'pagador' | 'cuenta';

export async function agregarOpcion(
  corredorId: string,
  tipo: TipoOpcion,
  valor: string
): Promise<void> {
  const v = valor.trim();
  if (!v) return;
  const { error } = await supabase
    .from('movimientos_opciones')
    .upsert({ corredor_id: corredorId, tipo, valor: v }, { onConflict: 'corredor_id,tipo,valor' });
  if (error) throw new Error(getErrorMessage(error));
}

export async function eliminarOpcion(
  corredorId: string,
  tipo: TipoOpcion,
  valor: string
): Promise<void> {
  const { error } = await supabase
    .from('movimientos_opciones')
    .delete()
    .eq('corredor_id', corredorId)
    .eq('tipo', tipo)
    .eq('valor', valor);
  if (error) throw new Error(getErrorMessage(error));
}

export function calcularSaldo(lista: Movimiento[]): number {
  return lista.reduce((acc, m) => acc + m.monto, 0);
}

/** Helper: true si el movimiento es un ingreso (monto >= 0). */
export const esIngreso = (m: Movimiento): boolean => m.monto >= 0;

export function desglosePorCategoria(lista: Movimiento[]) {
  const mapa = new Map<string, { categoria: string; ingreso: number; egreso: number }>();
  for (const m of lista) {
    const actual = mapa.get(m.categoria) || { categoria: m.categoria, ingreso: 0, egreso: 0 };
    if (esIngreso(m)) actual.ingreso += m.monto;
    else actual.egreso += Math.abs(m.monto);
    mapa.set(m.categoria, actual);
  }
  return Array.from(mapa.values()).sort((a, b) => b.egreso - a.egreso);
}
