import { supabase } from './supabase';
import { getErrorMessage } from './format';
import type { AgendaTarea, Database } from '../types';

export type AgendaItem = Database['public']['Tables']['agenda']['Row'];

export type AgendaInput = {
  corredor_id: string;
  tipo: string;
  titulo: string;
  organismo?: string;
  monto?: number;
  fecha?: string;
  hora?: string;
  hora_fin?: string;
  lugar?: string;
  prioridad?: string;
  color?: string;
  recurrencia?: string;
  tareas?: AgendaTarea[];
  dias_aviso?: number;
  estado?: string;
  notas?: string;
};

export const TIPOS_AGENDA = ['contratacion', 'pliego', 'evento'];

export const ESTADOS_AGENDA = ['pendiente', 'presentado', 'adjudicado', 'perdido', 'vencido'];

export const PRIORIDADES: { id: string; label: string; clase: string }[] = [
  { id: 'alta', label: 'Alta', clase: 'bg-[var(--danger-soft)] text-[var(--danger-deep)]' },
  { id: 'media', label: 'Media', clase: 'bg-[var(--amber-soft)] text-[var(--amber-text)]' },
  { id: 'baja', label: 'Baja', clase: 'bg-[var(--blue-soft)] text-[var(--primary-deep)]' },
];

export const RECURRENCIAS = [
  { id: 'ninguna', label: 'No repetir' },
  { id: 'semanal', label: 'Cada semana' },
  { id: 'bisemanal', label: 'Cada 2 semanas' },
  { id: 'mensual', label: 'Cada mes' },
];

export const COLORES = [
  { id: 'rojo', hex: '#ef4444', label: 'Rojo' },
  { id: 'naranja', hex: '#f97316', label: 'Naranja' },
  { id: 'ambar', hex: '#f59e0b', label: 'Ámbar' },
  { id: 'verde', hex: '#22c55e', label: 'Verde' },
  { id: 'teal', hex: '#14b8a6', label: 'Teal' },
  { id: 'azul', hex: '#3b82f6', label: 'Azul' },
  { id: 'violeta', hex: '#8b5cf6', label: 'Violeta' },
  { id: 'rosa', hex: '#ec4899', label: 'Rosa' },
  { id: 'gris', hex: '#6b7280', label: 'Gris' },
];

export const etiquetaEstado = (e: string) => e.charAt(0).toUpperCase() + e.slice(1);

export const etiquetaTipo = (t: string) => {
  switch (t) {
    case 'pliego': return 'Pliego';
    case 'evento': return 'Evento';
    default: return 'Contratación';
  }
};

export const etiquetaPrioridad = (p: string | null | undefined) => {
  switch (p) {
    case 'alta': return 'Alta';
    case 'baja': return 'Baja';
    default: return 'Media';
  }
};

export const etiquetaRecurrencia = (r: string | null | undefined) => {
  switch (r) {
    case 'semanal': return 'Cada semana';
    case 'bisemanal': return 'Cada 2 semanas';
    case 'mensual': return 'Cada mes';
    default: return '';
  }
};

export async function fetchAgenda(
  corredorId: string,
  filtros: { tipo?: string; estado?: string; prioridad?: string; desde?: string; hasta?: string; q?: string } = {}
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
  if (filtros.prioridad) query = query.eq('prioridad', filtros.prioridad);
  if (filtros.desde) query = query.gte('fecha', filtros.desde);
  if (filtros.hasta) query = query.lte('fecha', filtros.hasta);

  const { data, error } = await query;
  if (error) throw error;
  let filas = (data as AgendaItem[]) || [];

  if (filtros.q) {
    const q = filtros.q.trim().toLowerCase();
    filas = filas.filter(
      (i) =>
        (i.titulo || '').toLowerCase().includes(q) ||
        (i.organismo || '').toLowerCase().includes(q) ||
        (i.lugar || '').toLowerCase().includes(q) ||
        (i.notas || '').toLowerCase().includes(q)
    );
  }

  return filas;
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
      hora: input.hora || null,
      hora_fin: input.hora_fin || null,
      lugar: input.lugar || null,
      prioridad: input.prioridad || 'media',
      color: input.color || null,
      recurrencia: input.recurrencia || 'ninguna',
      tareas: input.tareas && input.tareas.length > 0 ? input.tareas : null,
      dias_aviso: input.dias_aviso && input.dias_aviso > 0 ? input.dias_aviso : null,
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

export async function toggleTarea(id: string, indice: number, hecho: boolean): Promise<void> {
  const { data, error } = await supabase.from('agenda').select('tareas').eq('id', id).single();
  if (error) throw new Error(getErrorMessage(error));
  const tareas = Array.isArray(data.tareas) ? [...(data.tareas as AgendaTarea[])] : [];
  if (tareas[indice]) tareas[indice] = { ...tareas[indice], hecho };
  const { error: e2 } = await supabase.from('agenda').update({ tareas }).eq('id', id);
  if (e2) throw new Error(getErrorMessage(e2));
}

export type Ocurrencia = { fecha: Date; esBase: boolean };

export function ocurrenciasEnMes(base: Date, recurrencia: string | null | undefined, anio: number, mes: number): Ocurrencia[] {
  const res: Ocurrencia[] = [];
  const push = (f: Date, esBase: boolean) => {
    if (f.getFullYear() === anio && f.getMonth() === mes) res.push({ fecha: f, esBase });
  };

  push(base, true);

  if (!recurrencia || recurrencia === 'ninguna') return res;

  if (recurrencia === 'mensual') {
    for (let k = 1; k <= 24; k++) {
      const f = new Date(base.getFullYear(), base.getMonth() + k, base.getDate());
      if (f.getTime() > new Date(anio, mes + 1, 0).getTime()) break;
      push(f, false);
    }
    for (let k = 1; k <= 12; k++) {
      const f = new Date(base.getFullYear(), base.getMonth() - k, base.getDate());
      if (f.getTime() < new Date(anio, mes, 1).getTime()) break;
      push(f, false);
    }
  } else {
    const paso = recurrencia === 'semanal' ? 7 : 14;
    for (let k = 1; k <= 26; k++) {
      const f = new Date(base.getFullYear(), base.getMonth(), base.getDate() + k * paso);
      if (f.getTime() > new Date(anio, mes + 1, 0).getTime()) break;
      push(f, false);
    }
    for (let k = 1; k <= 26; k++) {
      const f = new Date(base.getFullYear(), base.getMonth(), base.getDate() - k * paso);
      if (f.getTime() < new Date(anio, mes, 1).getTime()) break;
      push(f, false);
    }
  }

  return res;
}

/** Expande las ocurrencias de un evento recurrente dentro de un rango de fechas (inclusive). */
export function ocurrenciasEntre(
  base: Date,
  recurrencia: string | null | undefined,
  desde: Date,
  hasta: Date
): Ocurrencia[] {
  const res: Ocurrencia[] = [];
  const hastaEod = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate(), 23, 59, 59);
  const push = (f: Date, esBase: boolean) => {
    if (f >= desde && f <= hastaEod) res.push({ fecha: f, esBase });
  };

  if (!recurrencia || recurrencia === 'ninguna') {
    push(new Date(base.getFullYear(), base.getMonth(), base.getDate()), true);
    return res;
  }

  if (recurrencia === 'mensual') {
    for (let k = 0; k <= 36; k++) {
      const f = new Date(base.getFullYear(), base.getMonth() + k, base.getDate());
      if (f > hastaEod) break;
      push(f, k === 0);
    }
    for (let k = 1; k <= 36; k++) {
      const f = new Date(base.getFullYear(), base.getMonth() - k, base.getDate());
      if (f < desde) break;
      push(f, false);
    }
  } else {
    const paso = recurrencia === 'semanal' ? 7 : 14;
    for (let k = 0; k <= 52; k++) {
      const f = new Date(base.getFullYear(), base.getMonth(), base.getDate() + k * paso);
      if (f > hastaEod) break;
      push(f, k === 0);
    }
    for (let k = 1; k <= 52; k++) {
      const f = new Date(base.getFullYear(), base.getMonth(), base.getDate() - k * paso);
      if (f < desde) break;
      push(f, false);
    }
  }

  return res;
}