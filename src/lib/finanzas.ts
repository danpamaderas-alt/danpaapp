import { supabase } from './supabase';
import { getErrorMessage } from './format';
import type { Database } from '../types';

export type Movimiento = Database['public']['Tables']['movimientos']['Row'];

export type FiltrosMovimientos = {
  corredorId: string;
  desde?: string;
  hasta?: string;
  tipo?: string;
  categoria?: string;
};

export type MovimientoInput = {
  corredor_id: string;
  tipo: 'ingreso' | 'egreso';
  concepto: string;
  monto: number;
  categoria: string;
  fecha: string;
  notas?: string;
};

export const CATEGORIAS = [
  'general',
  'ventas',
  'compras',
  'materia_prima',
  'logistica',
  'produccion',
  'comisiones',
  'sueldos',
  'impuestos',
  'otros',
];

export async function fetchMovimientos(filtros: FiltrosMovimientos): Promise<Movimiento[]> {
  let query = supabase
    .from('movimientos')
    .select('*')
    .eq('corredor_id', filtros.corredorId)
    .order('fecha', { ascending: false })
    .limit(500);

  if (filtros.desde) query = query.gte('fecha', filtros.desde);
  if (filtros.hasta) query = query.lte('fecha', filtros.hasta);
  if (filtros.tipo) query = query.eq('tipo', filtros.tipo);
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
      tipo: input.tipo,
      concepto: input.concepto,
      monto: input.monto,
      categoria: input.categoria,
      fecha: input.fecha,
      notas: input.notas || null,
      creado_por: null,
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

export function calcularSaldo(lista: Movimiento[]): number {
  return lista.reduce(
    (acc, m) => (m.tipo === 'ingreso' ? acc + m.monto : acc - m.monto),
    0
  );
}

export function desglosePorCategoria(lista: Movimiento[]) {
  const mapa = new Map<string, { categoria: string; ingreso: number; egreso: number }>();
  for (const m of lista) {
    const actual = mapa.get(m.categoria) || { categoria: m.categoria, ingreso: 0, egreso: 0 };
    if (m.tipo === 'ingreso') actual.ingreso += m.monto;
    else actual.egreso += m.monto;
    mapa.set(m.categoria, actual);
  }
  return Array.from(mapa.values()).sort((a, b) => b.egreso - a.egreso);
}
