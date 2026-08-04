import { supabase } from './supabase';
import type { Database } from '../types';

export interface NuevoItemPedido {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
}

export interface ResultadoCrearPedido {
  success: boolean;
  pedidoId?: string;
  error?: string;
}

/**
 * Crea un pedido para un corredor, inserta sus ítems y descuenta el stock.
 * Nota: no es transaccional a nivel de BD; en producción se recomienda una RPC.
 */
export async function crearPedido(
  corredorId: string,
  clienteId: string | null,
  items: NuevoItemPedido[],
  notas?: string
): Promise<ResultadoCrearPedido> {
  try {
    if (!corredorId) throw new Error('Falta el corredor seleccionado.');
    if (items.length === 0) throw new Error('Agrega al menos un producto al pedido.');

    const total = items.reduce((acc, i) => acc + i.cantidad * i.precio_unitario, 0);

    // 1. Crear el pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        corredor_id: corredorId,
        cliente_id: clienteId,
        total,
        notas: notas || null,
        estado: 'Pendiente',
        estado_pago: 'no_pagado',
      })
      .select('id')
      .single();

    if (pedidoError) throw pedidoError;
    if (!pedido) throw new Error('No se pudo generar el pedido.');

    // 2. Insertar los ítems
    const itemsToInsert = items.map((i) => ({
      pedido_id: pedido.id,
      producto_id: i.producto_id,
      cantidad: i.cantidad,
      precio_unitario: i.precio_unitario,
    }));

    const { error: itemsError } = await supabase.from('pedido_items').insert(itemsToInsert);
    if (itemsError) {
      await supabase.from('pedidos').delete().eq('id', pedido.id);
      throw new Error(`Error al guardar los ítems del pedido: ${itemsError.message}`);
    }

    // 3. Descontar stock
    for (const i of items) {
      const { data: prod } = await supabase
        .from('productos')
        .select('stock')
        .eq('id', i.producto_id)
        .single();

      if (prod) {
        const nuevoStock = Math.max(0, (prod.stock || 0) - i.cantidad);
        await supabase.from('productos').update({ stock: nuevoStock }).eq('id', i.producto_id);
      }
    }

    return { success: true, pedidoId: pedido.id };
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
