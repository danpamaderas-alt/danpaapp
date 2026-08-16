import { supabase } from './supabase';
import { getErrorMessage } from './format';
import type { Database } from '../types';

export type ClienteNota = Database['public']['Tables']['cliente_notas']['Row'];

export async function fetchNotas(clienteId: string): Promise<ClienteNota[]> {
  const { data, error } = await supabase
    .from('cliente_notas')
    .select('id, nota, created_at')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(getErrorMessage(error));
  return (data as ClienteNota[]) || [];
}

export async function crearNota(clienteId: string, corredorId: string, nota: string): Promise<ClienteNota> {
  const { data, error } = await supabase
    .from('cliente_notas')
    .insert({
      cliente_id: clienteId,
      corredor_id: corredorId,
      nota,
    })
    .select()
    .single();

  if (error) throw new Error(getErrorMessage(error));
  return data as ClienteNota;
}

export async function eliminarNota(id: string): Promise<void> {
  const { error } = await supabase.from('cliente_notas').delete().eq('id', id);
  if (error) throw new Error(getErrorMessage(error));
}
