import { supabase } from './supabase';
import { getErrorMessage } from './format';
import type { Database } from '../types';

export type Notificacion = Database['public']['Tables']['notificaciones']['Row'];
export type TipoNotificacion = 'stock_bajo' | 'agenda_proxima' | 'pago_pendiente' | 'mantenimiento';
export type NivelNotificacion = 'info' | 'warning' | 'error' | 'success';

export interface NuevaNotificacion {
  corredor_id: string;
  tipo: TipoNotificacion;
  nivel: NivelNotificacion;
  titulo: string;
  mensaje: string;
  enlace?: string;
  dato_referencia?: string;
  leido: boolean;
  creado_en?: string;
}

export async function marcarLeido(id: string, corredorId: string): Promise<void> {
  const { error } = await supabase
    .from('notificaciones')
    .update({ leido: true })
    .eq('id', id)
    .eq('corredor_id', corredorId);

  if (error) throw new Error(getErrorMessage(error));
}

export async function marcarTodasLeido(corredorId: string): Promise<void> {
  const { error } = await supabase
    .from('notificaciones')
    .update({ leido: true })
    .eq('corredor_id', corredorId)
    .eq('leido', false);

  if (error) throw new Error(getErrorMessage(error));
}

export async function fetchNotificaciones(corredorId: string): Promise<Notificacion[]> {
  const { data, error } = await supabase
    .from('notificaciones')
    .select('*')
    .eq('corredor_id', corredorId)
    .order('creado_en', { ascending: false })
    .limit(50);

  if (error) throw new Error(getErrorMessage(error));
  return (data as Notificacion[]) || [];
}

export async function crearNotificacion(input: NuevaNotificacion): Promise<Notificacion> {
  const { data, error } = await supabase
    .from('notificaciones')
    .insert({
      corredor_id: input.corredor_id,
      tipo: input.tipo,
      nivel: input.nivel,
      titulo: input.titulo,
      mensaje: input.mensaje,
      enlace: input.enlace || null,
      dato_referencia: input.dato_referencia || null,
      leido: input.leido ?? false,
      creado_en: input.creado_en || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(getErrorMessage(error));
  return data as Notificacion;
}

export async function eliminarNotificacion(id: string, corredorId: string): Promise<void> {
  const { error } = await supabase
    .from('notificaciones')
    .delete()
    .eq('id', id)
    .eq('corredor_id', corredorId);

  if (error) throw new Error(getErrorMessage(error));
}

export async function limpiarNotificacionesLeidas(corredorId: string): Promise<void> {
  const { error } = await supabase
    .from('notificaciones')
    .delete()
    .eq('corredor_id', corredorId)
    .eq('leido', true);

  if (error) throw new Error(getErrorMessage(error));
}

export const iconoNotificacion = (tipo: TipoNotificacion): string => {
  switch (tipo) {
    case 'stock_bajo': return '🚨';
    case 'agenda_proxima': return '📅';
    case 'pago_pendiente': return '💳';
    case 'mantenimiento': return '🔧';
    default: return 'ℹ️';
  }
};

export const colorNotificacion = (nivel: NivelNotificacion): string => {
  switch (nivel) {
    case 'error': return 'bg-[var(--danger-soft)] text-[var(--danger-deep)] border-[var(--danger)]';
    case 'warning': return 'bg-[var(--amber-soft)] text-[var(--amber-text2)] border-[var(--amber-text2)]';
    case 'success': return 'bg-[var(--primary-soft)] text-[var(--primary-deep)] border-[var(--primary)]';
    case 'info':
    default: return 'bg-[var(--blue-soft)] text-[var(--text)] border-[var(--primary)]';
  }
};