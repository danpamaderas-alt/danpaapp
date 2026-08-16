import { supabase } from './supabase';
import { getErrorMessage } from './format';
import type { Database } from '../types';

export type Contratista = Database['public']['Tables']['contratistas']['Row'];
export type TrabajoContratista = Database['public']['Tables']['contratista_trabajos']['Row'];

export type ContratistaInput = {
  corredor_id: string;
  nombre: string;
  telefono?: string;
  dni?: string;
  especialidad?: string;
  tarifa?: number;
  tipo_tarifa?: string;
  activo?: boolean;
  notas?: string;
};

export type TrabajoContratistaInput = {
  corredor_id: string;
  contratista_id: string;
  descripcion: string;
  lugar?: string;
  fecha: string;
  costo?: number;
  estado?: string;
  fecha_pago?: string;
  notas?: string;
};

export const TIPOS_TARIFA = [
  { valor: 'por_trabajo', etiqueta: 'Por trabajo' },
  { valor: 'por_hora', etiqueta: 'Por hora' },
  { valor: 'por_dia', etiqueta: 'Por día' },
];

export const ESTADOS_TRABAJO = [
  { valor: 'pendiente', etiqueta: 'Pendiente', clase: 'bg-[var(--amber-soft2)] text-[var(--amber-text2)]' },
  { valor: 'pagado', etiqueta: 'Pagado', clase: 'bg-[var(--primary-soft)] text-[var(--primary-deep)]' },
];

export const etiquetaTipoTarifa = (v: string) => TIPOS_TARIFA.find((t) => t.valor === v)?.etiqueta || v;
export const etiquetaEstadoTrabajo = (v: string) => ESTADOS_TRABAJO.find((t) => t.valor === v)?.etiqueta || v;
export const claseEstadoTrabajo = (v: string) => ESTADOS_TRABAJO.find((t) => t.valor === v)?.clase || 'bg-[var(--gray-soft)] text-[var(--text2)]';

// ---------------- Contratistas ----------------

export async function fetchContratistas(corredorId: string): Promise<Contratista[]> {
  const { data, error } = await supabase
    .from('contratistas')
    .select('*')
    .eq('corredor_id', corredorId)
    .order('activo', { ascending: false })
    .order('nombre', { ascending: true })
    .limit(500);
  if (error) throw error;
  return (data as Contratista[]) || [];
}

export async function crearContratista(input: ContratistaInput): Promise<Contratista> {
  const { data, error } = await supabase
    .from('contratistas')
    .insert({
      corredor_id: input.corredor_id,
      nombre: input.nombre,
      telefono: input.telefono || null,
      dni: input.dni || null,
      especialidad: input.especialidad || null,
      tarifa: input.tarifa || 0,
      tipo_tarifa: input.tipo_tarifa || 'por_trabajo',
      activo: input.activo ?? true,
      notas: input.notas || null,
    })
    .select()
    .single();
  if (error) throw new Error(getErrorMessage(error));
  return data as Contratista;
}

export async function actualizarContratista(id: string, patch: Partial<ContratistaInput>): Promise<void> {
  const { error } = await supabase.from('contratistas').update(patch).eq('id', id);
  if (error) throw new Error(getErrorMessage(error));
}

export async function eliminarContratista(id: string): Promise<void> {
  const { error } = await supabase.from('contratistas').delete().eq('id', id);
  if (error) throw new Error(getErrorMessage(error));
}

// ---------------- Trabajos ----------------

export async function fetchTrabajos(
  corredorId: string,
  filtros: { desde?: string; hasta?: string; contratistaId?: string; estado?: string } = {}
): Promise<TrabajoContratista[]> {
  let query = supabase
    .from('contratista_trabajos')
    .select('*')
    .eq('corredor_id', corredorId)
    .order('fecha', { ascending: false })
    .limit(500);
  if (filtros.desde) query = query.gte('fecha', filtros.desde);
  if (filtros.hasta) query = query.lte('fecha', filtros.hasta);
  if (filtros.contratistaId) query = query.eq('contratista_id', filtros.contratistaId);
  if (filtros.estado) query = query.eq('estado', filtros.estado);
  const { data, error } = await query;
  if (error) throw error;
  return (data as TrabajoContratista[]) || [];
}

export async function crearTrabajo(input: TrabajoContratistaInput): Promise<TrabajoContratista> {
  const { data, error } = await supabase
    .from('contratista_trabajos')
    .insert({
      corredor_id: input.corredor_id,
      contratista_id: input.contratista_id,
      descripcion: input.descripcion,
      lugar: input.lugar || null,
      fecha: input.fecha,
      costo: input.costo || 0,
      estado: input.estado || 'pendiente',
      fecha_pago: input.fecha_pago || null,
      notas: input.notas || null,
    })
    .select()
    .single();
  if (error) throw new Error(getErrorMessage(error));
  return data as TrabajoContratista;
}

export async function actualizarTrabajo(id: string, patch: Partial<TrabajoContratistaInput>): Promise<void> {
  const { error } = await supabase.from('contratista_trabajos').update(patch).eq('id', id);
  if (error) throw new Error(getErrorMessage(error));
}

export async function eliminarTrabajo(id: string): Promise<void> {
  const { error } = await supabase.from('contratista_trabajos').delete().eq('id', id);
  if (error) throw new Error(getErrorMessage(error));
}
