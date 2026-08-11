import { supabase } from './supabase';
import { getErrorMessage } from './format';
import type { Database } from '../types';

export type Poda = Database['public']['Tables']['podas']['Row'];

export type PodaInput = {
  corredor_id: string;
  cantidad_arboles: number;
  detalle: string;
  tipo_arbol?: string;
  tipo_poda?: string;
  lugar?: string;
  fecha: string;
  notas?: string;
};

export const TIPOS_ARBOL = [
  'Álamo',
  'Casuarina',
  'Eucalipto',
  'Fresno',
  'Jacarandá',
  'Morera',
  'Plátano',
  'Sauce',
  'Tilo',
  'Tipa',
  'Otros',
];

export const TIPOS_PODA = [
  { valor: 'de_altura', etiqueta: 'De altura' },
  { valor: 'al_ras', etiqueta: 'Al ras' },
  { valor: 'extraccion', etiqueta: 'Extracción' },
];

export const etiquetaTipoPoda = (v: string) =>
  TIPOS_PODA.find((t) => t.valor === v)?.etiqueta || v;

export async function fetchPodas(
  corredorId: string,
  filtros: { desde?: string; hasta?: string; tipoPoda?: string } = {}
): Promise<Poda[]> {
  let query = supabase
    .from('podas')
    .select('*')
    .eq('corredor_id', corredorId)
    .order('fecha', { ascending: false })
    .limit(500);

  if (filtros.desde) query = query.gte('fecha', filtros.desde);
  if (filtros.hasta) query = query.lte('fecha', filtros.hasta);
  if (filtros.tipoPoda) query = query.eq('tipo_poda', filtros.tipoPoda);

  const { data, error } = await query;
  if (error) throw error;
  return (data as Poda[]) || [];
}

export async function crearPoda(input: PodaInput): Promise<Poda> {
  const { data, error } = await supabase
    .from('podas')
    .insert({
      corredor_id: input.corredor_id,
      cantidad_arboles: input.cantidad_arboles,
      detalle: input.detalle,
      tipo_arbol: input.tipo_arbol || null,
      tipo_poda: input.tipo_poda || null,
      lugar: input.lugar || null,
      fecha: input.fecha,
      notas: input.notas || null,
    })
    .select()
    .single();

  if (error) throw new Error(getErrorMessage(error));
  return data as Poda;
}

export async function actualizarPoda(id: string, patch: Partial<PodaInput>): Promise<void> {
  const { error } = await supabase.from('podas').update(patch).eq('id', id);
  if (error) throw new Error(getErrorMessage(error));
}

export async function eliminarPoda(id: string): Promise<void> {
  const { error } = await supabase.from('podas').delete().eq('id', id);
  if (error) throw new Error(getErrorMessage(error));
}