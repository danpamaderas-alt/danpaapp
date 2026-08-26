import { supabase } from './supabase';
import { getErrorMessage } from './format';

export type EstadoRecibo = 'borrador' | 'emitido' | 'anulado';

export interface Recibo {
  id: string;
  corredor_id: string;
  nro_recibo: string | null;
  fecha: string;
  cliente_nombre: string;
  cliente_domicilio: string | null;
  cliente_cuit: string | null;
  concepto: string;
  monto: number;
  forma_pago: string | null;
  estado: EstadoRecibo;
  notas: string | null;
  created_at: string;
}

export const ESTADOS_RECIBO: EstadoRecibo[] = ['borrador', 'emitido', 'anulado'];

export const etiquetaEstadoRecibo = (estado: EstadoRecibo) => {
  const mapa: Record<EstadoRecibo, string> = {
    borrador: 'Borrador',
    emitido: 'Emitido',
    anulado: 'Anulado',
  };
  return mapa[estado] || estado;
};

export const claseEstadoRecibo = (estado: EstadoRecibo) => {
  const mapa: Record<EstadoRecibo, string> = {
    borrador: 'bg-[var(--gray-soft)] text-[var(--text2)]',
    emitido: 'bg-[var(--primary-soft)] text-[var(--primary-deep)]',
    anulado: 'bg-[var(--danger-soft)] text-[var(--danger-deep)]',
  };
  return mapa[estado] || 'bg-[var(--gray-soft)] text-[var(--text2)]';
};

export const LIMITE_RECIBOS = 5000;

export const FORMAS_PAGO = ['Efectivo', 'Transferencia', 'Cheque', 'Débito', 'Crédito', 'Otro'];

export async function fetchRecibos(corredorId: string): Promise<Recibo[]> {
  const { data, error } = await supabase
    .from('recibos')
    .select('*')
    .eq('corredor_id', corredorId)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(LIMITE_RECIBOS);
  if (error) throw new Error(getErrorMessage(error));
  return (data as Recibo[]) || [];
}

export async function crearRecibo(payload: Omit<Recibo, 'id' | 'created_at'>): Promise<Recibo> {
  const { data, error } = await supabase
    .from('recibos')
    .insert({
      corredor_id: payload.corredor_id,
      nro_recibo: payload.nro_recibo || null,
      fecha: payload.fecha,
      cliente_nombre: payload.cliente_nombre,
      cliente_domicilio: payload.cliente_domicilio || null,
      cliente_cuit: payload.cliente_cuit || null,
      concepto: payload.concepto,
      monto: payload.monto,
      forma_pago: payload.forma_pago || null,
      estado: payload.estado,
      notas: payload.notas || null,
    })
    .select()
    .single();
  if (error) throw new Error(getErrorMessage(error));
  return data as Recibo;
}

export async function actualizarRecibo(id: string, payload: Partial<Omit<Recibo, 'id' | 'corredor_id' | 'created_at'>>): Promise<void> {
  const { error } = await supabase.from('recibos').update(payload).eq('id', id);
  if (error) throw new Error(getErrorMessage(error));
}

export async function eliminarRecibo(id: string): Promise<void> {
  const { error } = await supabase.from('recibos').delete().eq('id', id);
  if (error) throw new Error(getErrorMessage(error));
}

export function siguienteNroRecibo(recibos: Recibo[]): string {
  let max = 0;
  for (const r of recibos) {
    if (r.nro_recibo) {
      const num = parseInt(r.nro_recibo.replace(/\D/g, ''), 10);
      if (num > max) max = num;
    }
  }
  return `R-${String(max + 1).padStart(4, '0')}`;
}
