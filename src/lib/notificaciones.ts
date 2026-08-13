import { supabase } from './supabase';
import { getErrorMessage, parseDateOnly } from './format';
import { etiquetaTipo, type AgendaItem } from './agenda';
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
  agenda_id?: string;
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
      agenda_id: input.agenda_id || null,
      leido: input.leido ?? false,
      creado_en: input.creado_en || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(getErrorMessage(error));
  return data as Notificacion;
}

const inicioDia = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const diasHasta = (fecha: Date, desde: Date) => {
  return Math.round((inicioDia(fecha).getTime() - inicioDia(desde).getTime()) / 86400000);
};

export async function generarRecordatoriosAgenda(corredorId: string): Promise<void> {
  const { data, error } = await supabase
    .from('agenda')
    .select('*')
    .eq('corredor_id', corredorId)
    .not('fecha', 'is', null)
    .in('estado', ['pendiente', 'presentado'])
    .limit(500);

  if (error) throw new Error(getErrorMessage(error));
  const items = (data as AgendaItem[]) || [];
  const hoy = inicioDia(new Date());

  const aAvisar = items.filter((a) => {
    const f = parseDateOnly(a.fecha!);
    const aviso = a.dias_aviso && a.dias_aviso > 0 ? a.dias_aviso : 0;
    const limite = new Date(hoy);
    limite.setDate(hoy.getDate() + aviso);
    return f >= hoy && f <= limite;
  });

  if (aAvisar.length === 0) return;

  const ids = aAvisar.map((a) => a.id);
  const { data: existentes } = await supabase
    .from('notificaciones')
    .select('agenda_id')
    .eq('corredor_id', corredorId)
    .in('agenda_id', ids);

  const yaAvisados = new Set((existentes || []).map((n) => n.agenda_id));

  for (const a of aAvisar) {
    if (yaAvisados.has(a.id)) continue;
    const dias = diasHasta(parseDateOnly(a.fecha!), hoy);
    const cuando = dias === 0 ? 'Hoy' : dias === 1 ? 'Mañana' : `En ${dias} días`;
    await crearNotificacion({
      corredor_id: corredorId,
      tipo: 'agenda_proxima',
      nivel: dias <= 1 ? 'warning' : 'info',
      titulo: `${cuando}: ${a.titulo}`,
      mensaje: `${etiquetaTipo(a.tipo)}${a.hora ? ` a las ${a.hora.slice(0, 5)}` : ''}${a.organismo ? ` · ${a.organismo}` : ''}`,
      enlace: 'agenda',
      dato_referencia: a.id,
      agenda_id: a.id,
      leido: false,
    });
  }
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