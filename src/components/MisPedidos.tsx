import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { dinero, formatDate } from '../lib/format';
import type { Database } from '../types';
import {
  ListOrdered,
  Loader2,
  AlertCircle,
  X,
  Calendar,
  CheckCircle2,
  Banknote,
  Truck,
} from 'lucide-react';

type Pedido = Database['public']['Tables']['pedidos']['Row'];
type Cliente = Database['public']['Tables']['clientes']['Row'];
type Item = Database['public']['Tables']['pedido_items']['Row'] & { productos: Database['public']['Tables']['productos']['Row'] | null };
type PedidoConDetalles = Pedido & { clientes: Cliente | null; pedido_items: Item[] };

interface MisPedidosProps {
  corredorId: string;
}

export default function MisPedidos({ corredorId }: MisPedidosProps) {
  const [pedidos, setPedidos] = useState<PedidoConDetalles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('todos');
  const [selected, setSelected] = useState<PedidoConDetalles | null>(null);
  const [actualizando, setActualizando] = useState(false);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: e } = await supabase
        .from('pedidos')
        .select('*, clientes(*), pedido_items(*, productos(id, nombre, precio))')
        .eq('corredor_id', corredorId)
        .order('created_at', { ascending: false })
        .limit(200);
      if (e) throw e;
      setPedidos((data as unknown as PedidoConDetalles[]) || []);
    } catch (err: any) {
      console.error(err);
      setError('Error al cargar los pedidos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
  }, [corredorId]);

  const actualizarPedido = async (id: string, patch: Partial<Pedido>) => {
    setActualizando(true);
    const { error: e } = await supabase.from('pedidos').update(patch).eq('id', id);
    setActualizando(false);
    if (e) {
      alert('Error al actualizar: ' + e.message);
      return;
    }
    setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setSelected((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
  };

  const filtrados = filtro === 'todos'
    ? pedidos
    : filtro === 'entregados'
      ? pedidos.filter((p) => p.estado === 'Entregado')
      : filtro === 'pagados'
        ? pedidos.filter((p) => p.estado_pago === 'pagado')
        : pedidos.filter((p) => p.estado_pago !== 'pagado');

  return (
    <div className="flex-1 p-8 max-w-[1440px] mx-auto w-full">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text)] tracking-tight">Mis Pedidos</h2>
          <p className="text-[var(--text2)] mt-1">Historial de ventas del corredor.</p>
        </div>

        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="h-11 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
        >
          <option value="todos">Todos</option>
          <option value="pendientes">Pago pendiente</option>
          <option value="pagados">Pagados</option>
          <option value="entregados">Entregados</option>
        </select>
      </div>

      {error && (
        <div className="bg-[var(--danger-soft)] text-[var(--danger-deep)] p-4 rounded-xl flex items-start gap-4 mb-8">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text2)]">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-[var(--primary)]" />
          <p>Cargando pedidos...</p>
        </div>
      ) : (
        <section className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-[var(--blue-header)]">
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Cliente</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Fecha</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Ítems</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Total</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Estado</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Pago</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)] text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-[var(--text2)]">
                      <ListOrdered className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">No hay pedidos para este filtro</p>
                    </td>
                  </tr>
                ) : (
                  filtrados.map((p) => {
                    const items = p.pedido_items?.length ?? 0;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelected(p)}
                        className="hover:bg-[var(--field)] transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 text-[var(--text)] font-medium">{p.clientes?.nombre ?? '—'}</td>
                        <td className="px-6 py-4 text-[var(--text2)] text-sm">{formatDate(p.created_at)}</td>
                        <td className="px-6 py-4 text-[var(--text)]">{items} ítem{items === 1 ? '' : 's'}</td>
                        <td className="px-6 py-4 text-[var(--text)] font-semibold">{dinero(p.total)}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              p.estado === 'Entregado' ? 'bg-[var(--primary-soft)] text-[var(--primary-deep)]' : 'bg-[var(--blue-soft)] text-[var(--text)]'
                            }`}
                          >
                            {p.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              p.estado_pago === 'pagado' ? 'bg-[var(--primary-soft)] text-[var(--primary-deep)]' : 'bg-[var(--amber-soft2)] text-[var(--amber-text2)]'
                            }`}
                          >
                            {p.estado_pago === 'pagado' ? 'Pagado' : 'Pendiente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(p);
                            }}
                            className="px-4 py-2 text-[var(--primary)] text-sm font-medium hover:bg-[var(--primary-soft)] rounded transition-colors"
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selected && (
        <div className="fixed inset-0 bg-[var(--overlay)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-start bg-[var(--field)]">
              <div>
                <h3 className="text-xl font-bold text-[var(--text)]">Detalle del Pedido</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-[var(--text2)]">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {formatDate(selected.created_at)}
                  </span>
                  <span className="font-semibold text-[var(--text)]">{selected.clientes?.nombre ?? 'Sin cliente'}</span>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--hover)] p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex flex-wrap gap-3">
                {selected.estado === 'Entregado' ? (
                  <button
                    onClick={() => actualizarPedido(selected.id, { estado: 'Pendiente' })}
                    disabled={actualizando}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--text2)] hover:bg-[var(--blue-header)] disabled:opacity-50"
                  >
                    <Truck className="w-4 h-4" />
                    Marcar como Pendiente
                  </button>
                ) : (
                  <button
                    onClick={() => actualizarPedido(selected.id, { estado: 'Entregado' })}
                    disabled={actualizando}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-deep)] disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Marcar Entregado
                  </button>
                )}

                {selected.estado_pago === 'pagado' ? (
                  <button
                    onClick={() => actualizarPedido(selected.id, { estado_pago: 'no_pagado', monto_pagado: 0 })}
                    disabled={actualizando}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--text2)] hover:bg-[var(--blue-header)] disabled:opacity-50"
                  >
                    <Banknote className="w-4 h-4" />
                    Marcar No Pagado
                  </button>
                ) : (
                  <button
                    onClick={() => actualizarPedido(selected.id, { estado_pago: 'pagado', monto_pagado: selected.total })}
                    disabled={actualizando}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary-green)] text-white text-sm font-medium hover:bg-[var(--primary-green-deep)] disabled:opacity-50"
                  >
                    <Banknote className="w-4 h-4" />
                    Marcar Pagado
                  </button>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold uppercase tracking-widest text-[var(--text2)] mb-3">Ítems</h4>
                {selected.pedido_items?.length === 0 ? (
                  <p className="text-[var(--text2)] italic text-sm">Sin ítems.</p>
                ) : (
                  <div className="space-y-3">
                    {selected.pedido_items.map((it) => (
                      <div key={it.id} className="flex items-center justify-between border border-[var(--border)] rounded-lg p-4">
                        <div>
                          <p className="font-semibold text-[var(--text)]">{it.productos?.nombre ?? 'Producto'}</p>
                          <p className="text-sm text-[var(--text2)]">
                            {it.cantidad} uni. × {dinero(it.precio_unitario)}
                          </p>
                        </div>
                        <p className="font-bold text-[var(--text)]">{dinero(it.cantidad * it.precio_unitario)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selected.notas && (
                <div className="bg-[var(--field)] border border-[var(--border)] rounded-lg p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text2)] mb-1">Notas</p>
                  <p className="text-sm text-[var(--text)] whitespace-pre-line">{selected.notas}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--field)] flex justify-between items-center">
              <span className="text-sm text-[var(--text2)]">
                Pagado: <strong className="text-[var(--text)]">{dinero(selected.monto_pagado || 0)}</strong>
              </span>
              <span className="text-lg font-bold text-[var(--text)]">Total: {dinero(selected.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
