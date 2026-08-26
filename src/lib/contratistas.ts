import { supabase } from './supabase';
import { getErrorMessage } from './format';
import type { Database } from '../types';

export type Contratista = Database['public']['Tables']['contratistas']['Row'];
export type TrabajoContratista = Database['public']['Tables']['contratista_trabajos']['Row'];
export type EventoContratista = Database['public']['Tables']['contratista_eventos']['Row'];
export type PagoContratista = Database['public']['Tables']['contratista_pagos']['Row'];

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
  nro_contrato?: string;
  nro_remito?: string;
  cantidad_arboles?: number | null;
  notas?: string;
};

export const TIPOS_TARIFA = [
  { valor: 'por_trabajo', etiqueta: 'Por trabajo' },
  { valor: 'por_hora', etiqueta: 'Por hora' },
  { valor: 'por_dia', etiqueta: 'Por día' },
];

export const ESTADOS_TRABAJO = [
  { valor: 'pendiente', etiqueta: 'Pendiente', clase: 'bg-[var(--amber-soft2)] text-[var(--amber-text2)]' },
  { valor: 'parcial', etiqueta: 'Pago parcial', clase: 'bg-[var(--blue-soft)] text-[var(--text)]' },
  { valor: 'pagado', etiqueta: 'Pagado', clase: 'bg-[var(--primary-soft)] text-[var(--primary-deep)]' },
];

export const etiquetaTipoTarifa = (v: string) => TIPOS_TARIFA.find((t) => t.valor === v)?.etiqueta || v;
export const etiquetaEstadoTrabajo = (v: string) => ESTADOS_TRABAJO.find((t) => t.valor === v)?.etiqueta || v;
export const claseEstadoTrabajo = (v: string) => ESTADOS_TRABAJO.find((t) => t.valor === v)?.clase || 'bg-[var(--gray-soft)] text-[var(--text2)]';

export const TIPOS_EVENTO = [
  { valor: 'creacion', etiqueta: 'Creación', clase: 'bg-[var(--primary-soft)] text-[var(--primary-deep)]' },
  { valor: 'edicion', etiqueta: 'Edición', clase: 'bg-[var(--blue-soft)] text-[var(--text)]' },
  { valor: 'pago', etiqueta: 'Pago', clase: 'bg-[var(--amber-soft2)] text-[var(--amber-text2)]' },
  { valor: 'eliminado', etiqueta: 'Eliminación', clase: 'bg-[var(--danger-soft)] text-[var(--danger-deep)]' },
  { valor: 'nota', etiqueta: 'Nota', clase: 'bg-[var(--gray-soft)] text-[var(--text2)]' },
];

export const etiquetaEvento = (v: string) => TIPOS_EVENTO.find((t) => t.valor === v)?.etiqueta || v;
export const claseEvento = (v: string) => TIPOS_EVENTO.find((t) => t.valor === v)?.clase || 'bg-[var(--gray-soft)] text-[var(--text2)]';

// ---------------- Contratistas ----------------

export async function fetchContratistas(corredorId: string): Promise<Contratista[]> {
  const { data, error } = await supabase
    .from('contratistas')
    .select('id, nombre, telefono, dni, especialidad, tarifa, tipo_tarifa, activo, notas')
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

/** Límites de lectura por consulta; si se alcanzan, puede haber datos incompletos. */
export const LIMITES = { trabajos: 2000, pagos: 5000 };

// ---------------- Trabajos ----------------

export async function fetchTrabajos(
  corredorId: string,
  filtros: { desde?: string; hasta?: string; contratistaId?: string; estado?: string } = {}
): Promise<TrabajoContratista[]> {
  let query = supabase
    .from('contratista_trabajos')
    .select('id, contratista_id, descripcion, lugar, fecha, costo, estado, fecha_pago, nro_contrato, nro_remito, cantidad_arboles, notas')
    .eq('corredor_id', corredorId)
    .order('fecha', { ascending: false })
    .limit(LIMITES.trabajos);
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
      nro_contrato: input.nro_contrato || null,
      nro_remito: input.nro_remito || null,
      cantidad_arboles: input.cantidad_arboles ?? null,
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

// ---------------- Historial de eventos ----------------

export async function fetchEventos(
  corredorId: string,
  filtros: { contratistaId?: string } = {}
): Promise<EventoContratista[]> {
  let query = supabase
    .from('contratista_eventos')
    .select('id, contratista_id, trabajo_id, tipo, descripcion, monto, fecha, created_at')
    .eq('corredor_id', corredorId)
    .order('created_at', { ascending: false })
    .limit(500);
  if (filtros.contratistaId) query = query.eq('contratista_id', filtros.contratistaId);
  const { data, error } = await query;
  if (error) throw error;
  return (data as EventoContratista[]) || [];
}

export type EventoContratistaInput = {
  corredor_id: string;
  contratista_id: string;
  trabajo_id?: string;
  tipo: string;
  descripcion: string;
  monto?: number;
};

export async function crearEvento(input: EventoContratistaInput): Promise<void> {
  const { error } = await supabase.from('contratista_eventos').insert({
    corredor_id: input.corredor_id,
    contratista_id: input.contratista_id,
    trabajo_id: input.trabajo_id || null,
    tipo: input.tipo,
    descripcion: input.descripcion,
    monto: input.monto ?? null,
  });
  if (error) throw new Error(getErrorMessage(error));
}

/** Registra un evento sin interrumpir el flujo si falla (best-effort). */
export async function registrarEvento(input: EventoContratistaInput): Promise<void> {
  try {
    await crearEvento(input);
  } catch (err) {
    console.error('No se pudo registrar el evento:', err);
  }
}

// ---------------- Pagos (totales y parciales) ----------------

export async function fetchPagos(
  corredorId: string,
  filtros: { contratistaId?: string; trabajoId?: string } = {}
): Promise<PagoContratista[]> {
  let query = supabase
    .from('contratista_pagos')
    .select('id, contratista_id, trabajo_id, monto, fecha, metodo, notas, created_at')
    .eq('corredor_id', corredorId)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(LIMITES.pagos);
  if (filtros.contratistaId) query = query.eq('contratista_id', filtros.contratistaId);
  if (filtros.trabajoId) query = query.eq('trabajo_id', filtros.trabajoId);
  const { data, error } = await query;
  if (error) throw error;
  return (data as PagoContratista[]) || [];
}

export type PagoContratistaInput = {
  corredor_id: string;
  contratista_id: string;
  trabajo_id: string;
  monto: number;
  fecha?: string;
  metodo?: string;
  notas?: string;
};

export async function crearPago(input: PagoContratistaInput): Promise<PagoContratista> {
  const { data, error } = await supabase
    .from('contratista_pagos')
    .insert({
      corredor_id: input.corredor_id,
      contratista_id: input.contratista_id,
      trabajo_id: input.trabajo_id,
      monto: input.monto,
      fecha: input.fecha || undefined,
      metodo: input.metodo || null,
      notas: input.notas || null,
    })
    .select()
    .single();
  if (error) throw new Error(getErrorMessage(error));
  return data as PagoContratista;
}

export async function eliminarPago(id: string): Promise<void> {
  const { error } = await supabase.from('contratista_pagos').delete().eq('id', id);
  if (error) throw new Error(getErrorMessage(error));
}

/**
 * Busca y elimina el egreso que `registrarPagoEfectuado` creó en Centro
 * financiero para este pago. Primero por referencia exacta (notas contienen
 * el id del pago); como fallback, por concepto + fecha + monto.
 * Devuelve true si encontró y eliminó el movimiento.
 */
export async function revertirEgresoDePago(
  corredorId: string,
  pago: Pick<PagoContratista, 'id' | 'monto' | 'fecha'>,
  conceptosAlternativos: string[] = []
): Promise<boolean> {
  const montoNegativo = -Math.abs(pago.monto);
  const { data, error } = await supabase
    .from('movimientos')
    .select('id, concepto, notas')
    .eq('corredor_id', corredorId)
    .eq('categoria', 'Contratistas')
    .eq('monto', montoNegativo)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(getErrorMessage(error));
  const lista = data || [];
  let objetivo = lista.find((m) => (m.notas || '').includes(pago.id));
  if (!objetivo && conceptosAlternativos.length > 0) {
    objetivo = lista.find((m) => conceptosAlternativos.includes(m.concepto));
  }
  if (!objetivo) return false;
  const { error: errDel } = await supabase.from('movimientos').delete().eq('id', objetivo.id);
  if (errDel) throw new Error(getErrorMessage(errDel));
  return true;
}

/** Elimina todos los eventos de historial de un contratista (al borrarlo). */
export async function eliminarEventosDeContratista(corredorId: string, contratistaId: string): Promise<void> {
  const { error } = await supabase
    .from('contratista_eventos')
    .delete()
    .eq('corredor_id', corredorId)
    .eq('contratista_id', contratistaId);
  if (error) throw new Error(getErrorMessage(error));
}
