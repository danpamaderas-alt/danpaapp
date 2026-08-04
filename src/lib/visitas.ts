import { supabase } from './supabase';
import { getErrorMessage } from './format';
import type { Database } from '../types';

export type Visita = Database['public']['Tables']['visitas']['Row'];

export type VisitaInput = {
  corredor_id: string;
  cliente_id?: string | null;
  fecha: string;
  estado: string;
  latitud?: number | null;
  longitud?: number | null;
};

export const ESTADOS_VISITA = ['pendiente', 'realizada', 'cancelada'];

export const etiquetaEstado = (e: string) =>
  e.charAt(0).toUpperCase() + e.slice(1);

export async function fetchVisitas(
  corredorId: string,
  filtros: { desde?: string; hasta?: string; estado?: string; clienteId?: string } = {}
): Promise<Visita[]> {
  let query = supabase
    .from('visitas')
    .select('*')
    .eq('corredor_id', corredorId)
    .order('fecha', { ascending: false })
    .limit(500);

  if (filtros.desde) query = query.gte('fecha', filtros.desde);
  if (filtros.hasta) query = query.lte('fecha', filtros.hasta);
  if (filtros.estado) query = query.eq('estado', filtros.estado);
  if (filtros.clienteId) query = query.eq('cliente_id', filtros.clienteId);

  const { data, error } = await query;
  if (error) throw error;
  return (data as Visita[]) || [];
}

export async function crearVisita(input: VisitaInput): Promise<Visita> {
  const { data, error } = await supabase
    .from('visitas')
    .insert({
      corredor_id: input.corredor_id,
      cliente_id: input.cliente_id || null,
      fecha: input.fecha,
      estado: input.estado,
      latitud: input.latitud ?? null,
      longitud: input.longitud ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(getErrorMessage(error));
  return data as Visita;
}

export async function actualizarVisita(id: string, patch: Partial<VisitaInput>): Promise<void> {
  const { error } = await supabase.from('visitas').update(patch).eq('id', id);
  if (error) throw new Error(getErrorMessage(error));
}

export async function eliminarVisita(id: string): Promise<void> {
  const { error } = await supabase.from('visitas').delete().eq('id', id);
  if (error) throw new Error(getErrorMessage(error));
}
