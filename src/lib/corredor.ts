import { supabase } from './supabase';
import type { Database } from '../types';

export type Usuario = Database['public']['Tables']['usuarios']['Row'];

export async function fetchCorredorActual(userId: string): Promise<Usuario | null> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return (data as Usuario) || null;
}
