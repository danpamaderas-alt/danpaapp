import { supabase } from './supabase';
import { getErrorMessage } from './format';
import type { Database } from '../types';

export type Empleado = Database['public']['Tables']['empleados']['Row'];
export type Asistencia = Database['public']['Tables']['asistencias']['Row'];
export type Licencia = Database['public']['Tables']['licencias']['Row'];
export type Liquidacion = Database['public']['Tables']['liquidaciones']['Row'];

export type EmpleadoInput = {
  corredor_id: string;
  nombre: string;
  telefono?: string;
  dni?: string;
  direccion?: string;
  puesto?: string;
  salario?: number;
  fecha_ingreso?: string;
  tipo_liquidacion?: string;
  activo?: boolean;
  notas?: string;
};

export type AsistenciaInput = {
  corredor_id: string;
  empleado_id: string;
  fecha: string;
  hora_entrada?: string;
  hora_salida?: string;
  estado?: string;
  horas_extra?: number;
  notas?: string;
};

export type LicenciaInput = {
  corredor_id: string;
  empleado_id: string;
  tipo: string;
  fecha_desde: string;
  fecha_hasta: string;
  estado?: string;
  notas?: string;
};

export type LiquidacionInput = {
  corredor_id: string;
  empleado_id: string;
  periodo: string;
  monto?: number;
  estado?: string;
  fecha_pago?: string;
  notas?: string;
};

export const TIPOS_LIQUIDACION = [
  { valor: 'fijo', etiqueta: 'Fijo (mensual)' },
  { valor: 'por_hora', etiqueta: 'Por hora' },
  { valor: 'por_dia', etiqueta: 'Por día' },
  { valor: 'por_produccion', etiqueta: 'Por producción' },
  { valor: 'por_semana', etiqueta: 'Por semana' },
  { valor: 'quincenal', etiqueta: 'Quincena' },
];

export const ESTADOS_ASISTENCIA = [
  { valor: 'presente', etiqueta: 'Presente', clase: 'bg-[var(--primary-soft)] text-[var(--primary-deep)]' },
  { valor: 'ausente', etiqueta: 'Ausente', clase: 'bg-[var(--danger-soft)] text-[var(--danger-deep)]' },
  { valor: 'licencia', etiqueta: 'Licencia', clase: 'bg-[var(--amber-soft2)] text-[var(--amber-text2)]' },
  { valor: 'media_jornada', etiqueta: 'Media jornada', clase: 'bg-[var(--blue-soft)] text-[var(--text)]' },
];

export const TIPOS_LICENCIA = [
  { valor: 'vacaciones', etiqueta: 'Vacaciones' },
  { valor: 'enfermedad', etiqueta: 'Enfermedad' },
  { valor: 'licencia', etiqueta: 'Licencia' },
  { valor: 'justificada', etiqueta: 'Falta justificada' },
  { valor: 'otro', etiqueta: 'Otro' },
];

export const ESTADOS_LICENCIA = [
  { valor: 'pendiente', etiqueta: 'Pendiente', clase: 'bg-[var(--amber-soft2)] text-[var(--amber-text2)]' },
  { valor: 'aprobada', etiqueta: 'Aprobada', clase: 'bg-[var(--primary-soft)] text-[var(--primary-deep)]' },
  { valor: 'rechazada', etiqueta: 'Rechazada', clase: 'bg-[var(--danger-soft)] text-[var(--danger-deep)]' },
];

export const ESTADOS_LIQUIDACION = [
  { valor: 'pendiente', etiqueta: 'Pendiente', clase: 'bg-[var(--amber-soft2)] text-[var(--amber-text2)]' },
  { valor: 'pagado', etiqueta: 'Pagado', clase: 'bg-[var(--primary-soft)] text-[var(--primary-deep)]' },
];

export const etiquetaEstado = (lista: { valor: string; etiqueta: string }[], v: string) =>
  lista.find((x) => x.valor === v)?.etiqueta || v;

export const badgeEstado = (lista: { valor: string; clase: string }[], v: string) =>
  lista.find((x) => x.valor === v)?.clase || 'bg-[var(--gray-soft)] text-[var(--text2)]';

// ---------------- Empleados ----------------

export async function fetchEmpleados(corredorId: string): Promise<Empleado[]> {
  const { data, error } = await supabase
    .from('empleados')
    .select('id, nombre, telefono, dni, direccion, puesto, salario, fecha_ingreso, tipo_liquidacion, activo, notas')
    .eq('corredor_id', corredorId)
    .order('activo', { ascending: false })
    .order('nombre', { ascending: true })
    .limit(500);
  if (error) throw error;
  return (data as Empleado[]) || [];
}

export async function crearEmpleado(input: EmpleadoInput): Promise<Empleado> {
  const { data, error } = await supabase
    .from('empleados')
    .insert({
      corredor_id: input.corredor_id,
      nombre: input.nombre,
      telefono: input.telefono || null,
      dni: input.dni || null,
      direccion: input.direccion || null,
      puesto: input.puesto || null,
      salario: input.salario || 0,
      fecha_ingreso: input.fecha_ingreso || null,
      tipo_liquidacion: input.tipo_liquidacion || 'fijo',
      activo: input.activo ?? true,
      notas: input.notas || null,
    })
    .select()
    .single();
  if (error) throw new Error(getErrorMessage(error));
  return data as Empleado;
}

export async function actualizarEmpleado(id: string, patch: Partial<EmpleadoInput>): Promise<void> {
  const { error } = await supabase.from('empleados').update(patch).eq('id', id);
  if (error) throw new Error(getErrorMessage(error));
}

export async function eliminarEmpleado(id: string): Promise<void> {
  const { error } = await supabase.from('empleados').delete().eq('id', id);
  if (error) throw new Error(getErrorMessage(error));
}

// ---------------- Asistencias ----------------

export async function fetchAsistencias(
  corredorId: string,
  filtros: { desde?: string; hasta?: string; empleadoId?: string } = {}
): Promise<Asistencia[]> {
  let query = supabase
    .from('asistencias')
    .select('id, empleado_id, fecha, hora_entrada, hora_salida, estado, horas_extra, notas')
    .eq('corredor_id', corredorId)
    .order('fecha', { ascending: false })
    .limit(500);
  if (filtros.desde) query = query.gte('fecha', filtros.desde);
  if (filtros.hasta) query = query.lte('fecha', filtros.hasta);
  if (filtros.empleadoId) query = query.eq('empleado_id', filtros.empleadoId);
  const { data, error } = await query;
  if (error) throw error;
  return (data as Asistencia[]) || [];
}

export async function crearAsistencia(input: AsistenciaInput): Promise<Asistencia> {
  const { data, error } = await supabase
    .from('asistencias')
    .insert({
      corredor_id: input.corredor_id,
      empleado_id: input.empleado_id,
      fecha: input.fecha,
      hora_entrada: input.hora_entrada || null,
      hora_salida: input.hora_salida || null,
      estado: input.estado || 'presente',
      horas_extra: input.horas_extra ?? 0,
      notas: input.notas || null,
    })
    .select()
    .single();
  if (error) throw new Error(getErrorMessage(error));
  return data as Asistencia;
}

export async function actualizarAsistencia(id: string, patch: Partial<AsistenciaInput>): Promise<void> {
  const { error } = await supabase.from('asistencias').update(patch).eq('id', id);
  if (error) throw new Error(getErrorMessage(error));
}

export async function eliminarAsistencia(id: string): Promise<void> {
  const { error } = await supabase.from('asistencias').delete().eq('id', id);
  if (error) throw new Error(getErrorMessage(error));
}

export async function upsertAsistencias(
  corredorId: string,
  filas: { empleado_id: string; fecha: string; estado: string; hora_entrada?: string | null; hora_salida?: string | null; horas_extra?: number; notas?: string | null }[]
): Promise<void> {
  if (!filas.length) return;
  const { error } = await supabase
    .from('asistencias')
    .upsert(
      filas.map((f) => ({
        corredor_id: corredorId,
        empleado_id: f.empleado_id,
        fecha: f.fecha,
        estado: f.estado,
        hora_entrada: f.hora_entrada || null,
        hora_salida: f.hora_salida || null,
        horas_extra: f.horas_extra ?? 0,
        notas: f.notas || null,
      })),
      { onConflict: 'corredor_id,empleado_id,fecha' }
    );
  if (error) throw new Error(getErrorMessage(error));
}

// ---------------- Licencias ----------------

export async function fetchLicencias(corredorId: string): Promise<Licencia[]> {
  const { data, error } = await supabase
    .from('licencias')
    .select('id, empleado_id, tipo, fecha_desde, fecha_hasta, estado, notas')
    .eq('corredor_id', corredorId)
    .order('fecha_desde', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data as Licencia[]) || [];
}

export async function crearLicencia(input: LicenciaInput): Promise<Licencia> {
  const { data, error } = await supabase
    .from('licencias')
    .insert({
      corredor_id: input.corredor_id,
      empleado_id: input.empleado_id,
      tipo: input.tipo,
      fecha_desde: input.fecha_desde,
      fecha_hasta: input.fecha_hasta,
      estado: input.estado || 'pendiente',
      notas: input.notas || null,
    })
    .select()
    .single();
  if (error) throw new Error(getErrorMessage(error));
  return data as Licencia;
}

export async function actualizarLicencia(id: string, patch: Partial<LicenciaInput>): Promise<void> {
  const { error } = await supabase.from('licencias').update(patch).eq('id', id);
  if (error) throw new Error(getErrorMessage(error));
}

export async function eliminarLicencia(id: string): Promise<void> {
  const { error } = await supabase.from('licencias').delete().eq('id', id);
  if (error) throw new Error(getErrorMessage(error));
}

// ---------------- Liquidaciones ----------------

export async function fetchLiquidaciones(corredorId: string): Promise<Liquidacion[]> {
  const { data, error } = await supabase
    .from('liquidaciones')
    .select('id, empleado_id, periodo, monto, estado, fecha_pago, notas')
    .eq('corredor_id', corredorId)
    .order('periodo', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data as Liquidacion[]) || [];
}

export async function crearLiquidacion(input: LiquidacionInput): Promise<Liquidacion> {
  const { data, error } = await supabase
    .from('liquidaciones')
    .insert({
      corredor_id: input.corredor_id,
      empleado_id: input.empleado_id,
      periodo: input.periodo,
      monto: input.monto || 0,
      estado: input.estado || 'pendiente',
      fecha_pago: input.fecha_pago || null,
      notas: input.notas || null,
    })
    .select()
    .single();
  if (error) throw new Error(getErrorMessage(error));
  return data as Liquidacion;
}

export async function actualizarLiquidacion(id: string, patch: Partial<LiquidacionInput>): Promise<void> {
  const { error } = await supabase.from('liquidaciones').update(patch).eq('id', id);
  if (error) throw new Error(getErrorMessage(error));
}

export async function eliminarLiquidacion(id: string): Promise<void> {
  const { error } = await supabase.from('liquidaciones').delete().eq('id', id);
  if (error) throw new Error(getErrorMessage(error));
}
