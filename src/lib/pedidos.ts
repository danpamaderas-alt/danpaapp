import { supabase } from './supabase';
import type { Database } from '../types';

interface NuevoItemPedido {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
}

interface ResultadoCrearPedido {
  success: boolean;
  pedidoId?: string;
  error?: string;
}

/**
 * Crea un pedido vía la RPC transaccional crear_pedido (migracion_seguridad_fase3.sql).
 * El servidor crea el pedido, inserta los ítems, descuenta el stock de forma
 * atómica (UPDATE ... WHERE stock >= cantidad) y genera las notificaciones de
 * stock bajo; si algo falla, toda la transacción se revierte.
 */
export async function crearPedido(
  corredorId: string,
  clienteId: string | null,
  items: NuevoItemPedido[],
  notas?: string,
  descuento?: number,
  vendedorId?: string | null
): Promise<ResultadoCrearPedido> {
  try {
    if (!corredorId) throw new Error('Falta el corredor seleccionado.');
    if (items.length === 0) throw new Error('Agrega al menos un producto al pedido.');

    const { data, error } = await supabase.rpc('crear_pedido', {
      p_corredor_id: corredorId,
      p_cliente_id: clienteId,
      p_items: items.map((i) => ({
        producto_id: i.producto_id,
        cantidad: i.cantidad,
        precio_unitario: i.precio_unitario,
      })),
      p_notas: notas || null,
      p_descuento: descuento || 0,
      p_vendedor_id: vendedorId || null,
    });

    if (error) throw error;
    if (!data) throw new Error('No se pudo generar el pedido.');

    return { success: true, pedidoId: data };
  } catch (error: any) {
    console.error('Error al crear el pedido:', error);
    return {
      success: false,
      error: error.message || 'Ocurrió un error inesperado al procesar el pedido.',
    };
  }
}

/** Calcula el costo total de un producto sumando todos los componentes. */
export function costoTotalProducto(p: Database['public']['Tables']['productos']['Row']): number {
  return (
    (p.costo || 0) +
    (p.costo_adquisicion || 0) +
    (p.costo_transporte || 0) +
    (p.costo_empaque || 0) +
    (p.costo_almacenaje || 0) +
    (p.costo_almacenamiento || 0) +
    (p.costo_comision || 0) +
    (p.costo_otros || 0)
  );
}

/** Devuelve el desglose de costos con nombre y valor (solo los > 0). */
export function desgloseCostos(p: Database['public']['Tables']['productos']['Row']) {
  const partes = [
    { nombre: 'Costo base', valor: p.costo || 0 },
    { nombre: 'Adquisición', valor: p.costo_adquisicion || 0 },
    { nombre: 'Transporte', valor: p.costo_transporte || 0 },
    { nombre: 'Empaque', valor: p.costo_empaque || 0 },
    { nombre: 'Almacenaje', valor: p.costo_almacenaje || 0 },
    { nombre: 'Almacenamiento', valor: p.costo_almacenamiento || 0 },
    { nombre: 'Comisión', valor: p.costo_comision || 0 },
    { nombre: 'Otros', valor: p.costo_otros || 0 },
  ];
  return partes.filter((p) => p.valor > 0);
}
