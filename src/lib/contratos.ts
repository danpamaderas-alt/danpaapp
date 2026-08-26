import { supabase } from './supabase';
import { getErrorMessage } from './format';

export type EstadoContrato = 'borrador' | 'activo' | 'finalizado' | 'cancelado';
export type TipoContrato = 'cliente' | 'subcontratista';

export interface Contrato {
  id: string;
  corredor_id: string;
  tipo: TipoContrato;
  nro_contrato: string | null;
  titulo: string;
  contraparte: string | null;
  descripcion: string | null;
  lugar: string | null;
  fecha: string;
  fecha_fin: string | null;
  monto: number;
  forma_pago: string | null;
  estado: EstadoContrato;
  notas: string | null;
  created_at: string;
}

export const ESTADOS_CONTRATO: EstadoContrato[] = ['borrador', 'activo', 'finalizado', 'cancelado'];

export const etiquetaEstadoContrato = (estado: EstadoContrato) => {
  const mapa: Record<EstadoContrato, string> = {
    borrador: 'Borrador',
    activo: 'Activo',
    finalizado: 'Finalizado',
    cancelado: 'Cancelado',
  };
  return mapa[estado] || estado;
};

export const claseEstadoContrato = (estado: EstadoContrato) => {
  const mapa: Record<EstadoContrato, string> = {
    borrador: 'bg-[var(--gray-soft)] text-[var(--text2)]',
    activo: 'bg-[var(--amber-soft2)] text-[var(--amber-text2)]',
    finalizado: 'bg-[var(--primary-soft)] text-[var(--primary-deep)]',
    cancelado: 'bg-[var(--danger-soft)] text-[var(--danger-deep)]',
  };
  return mapa[estado] || 'bg-[var(--gray-soft)] text-[var(--text2)]';
};

export const LIMITE_CONTRATOS = 2000;

// ---------------- Contratos ----------------

export async function fetchContratos(
  corredorId: string,
  filtros: { tipo?: TipoContrato } = {}
): Promise<Contrato[]> {
  let query = supabase
    .from('contratos')
    .select('*')
    .eq('corredor_id', corredorId)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(LIMITE_CONTRATOS);
  if (filtros.tipo) query = query.eq('tipo', filtros.tipo);
  const { data, error } = await query;
  if (error) throw new Error(getErrorMessage(error));
  return (data as Contrato[]) || [];
}

export async function crearContrato(
  payload: Omit<Contrato, 'id' | 'created_at'>
): Promise<Contrato> {
  const { data, error } = await supabase
    .from('contratos')
    .insert({
      corredor_id: payload.corredor_id,
      tipo: payload.tipo,
      nro_contrato: payload.nro_contrato || null,
      titulo: payload.titulo,
      contraparte: payload.contraparte || null,
      descripcion: payload.descripcion || null,
      lugar: payload.lugar || null,
      fecha: payload.fecha,
      fecha_fin: payload.fecha_fin || null,
      monto: payload.monto,
      forma_pago: payload.forma_pago || null,
      estado: payload.estado,
      notas: payload.notas || null,
    })
    .select()
    .single();
  if (error) throw new Error(getErrorMessage(error));
  return data as Contrato;
}

export async function actualizarContrato(
  id: string,
  payload: Partial<Omit<Contrato, 'id' | 'corredor_id' | 'created_at'>>
): Promise<void> {
  const { error } = await supabase.from('contratos').update(payload).eq('id', id);
  if (error) throw new Error(getErrorMessage(error));
}

export async function eliminarContrato(id: string): Promise<void> {
  const { error } = await supabase.from('contratos').delete().eq('id', id);
  if (error) throw new Error(getErrorMessage(error));
}
