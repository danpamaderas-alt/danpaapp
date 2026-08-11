import { supabase } from './supabase';
import { getErrorMessage } from './format';
import type { Database } from '../types';

export type AgendaItem = Database['public']['Tables']['agenda']['Row'];

export type AgendaInput = {
  corredor_id: string;
  tipo: string;
  titulo: string;
  organismo?: string;
  monto?: number;
  fecha?: string;
  estado?: string;
  notas?: string;
};

export const TIPOS_AGENDA = ['contratacion', 'pliego'];

export const ESTADOS_AGENDA = ['pendiente', 'presentado', 'adjudicado', 'perdido', 'vencido'];

export const etiquetaEstado = (e: string) => e.charAt(0).toUpperCase() + e.slice(1);

export async function fetchAgenda(
  corredorId: string,
  filtros: { tipo?: string; estado?: string; desde?: string; hasta?: string } = {}
): Promise<AgendaItem[]> {
  let query = supabase
    .from('agenda')
    .select('*')
    .eq('corredor_id', corredorId)
    .order('fecha', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(500);

  if (filtros.tipo) query = query.eq('tipo', filtros.tipo);
  if (filtros.estado) query = query.eq('estado', filtros.estado);
  if (filtros.desde) query = query.gte('fecha', filtros.desde);
  if (filtros.hasta) query = query.lte('fecha', filtros.hasta);

  const { data, error } = await query;
  if (error) throw error;
  return (data as AgendaItem[]) || [];
}

export async function crearAgenda(input: AgendaInput): Promise<AgendaItem> {
  const { data, error } = await supabase
    .from('agenda')
    .insert({
      corredor_id: input.corredor_id,
      tipo: input.tipo,
      titulo: input.titulo,
      organismo: input.organismo || null,
      monto: input.monto || 0,
      fecha: input.fecha || null,
      estado: input.estado || 'pendiente',
      notas: input.notas || null,
    })
    .select()
    .single();

  if (error) throw new Error(getErrorMessage(error));
  return data as AgendaItem;
}

export async function actualizarAgenda(id: string, patch: Partial<AgendaInput>): Promise<void> {
  const { error } = await supabase.from('agenda').update(patch).eq('id', id);
  if (error) throw new Error(getErrorMessage(error));
}

export async function eliminarAgenda(id: string): Promise<void> {
  const { error } = await supabase.from('agenda').delete().eq('id', id);
  if (error) throw new Error(getErrorMessage(error));
}