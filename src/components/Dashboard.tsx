import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { dinero, formatDate, parseDateOnly } from '../lib/format';
import type { Database } from '../types';
import { etiquetaTipo, type AgendaItem } from '../lib/agenda';
import { generarRecordatoriosAgenda } from '../lib/notificaciones';
import {
  PackageOpen,
  AlertTriangle,
  Loader2,
  AlertCircle,
  Banknote,
  Receipt,
  Boxes,
  X,
  Calendar,
  Factory,
  CheckCircle2,
  CalendarDays,
  ArrowRight,
} from 'lucide-react';

type Pedido = Database['public']['Tables']['pedidos']['Row'];
type Cliente = Database['public']['Tables']['clientes']['Row'];
type Item = Database['public']['Tables']['pedido_items']['Row'];
type Producto = Database['public']['Tables']['productos']['Row'];

type PedidoConDetalles = Pedido & { clientes: Cliente | null; pedido_items: Item[] };

interface DashboardProps {
  corredorId: string;
  onNavigate?: (view: 'agenda') => void;
}

export default function Dashboard({ corredorId, onNavigate }: DashboardProps) {
  const [pedidos, setPedidos] = useState<PedidoConDetalles[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PedidoConDetalles | null>(null);

  useEffect(() => {
    if (!corredorId) return;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [{ data: pData, error: pErr }, { data: prodData, error: prodErr }, { data: agendaData, error: agendaErr }] = await Promise.all([
          supabase
            .from('pedidos')
            .select('*, clientes(*), pedido_items(*)')
            .eq('corredor_id', corredorId)
            .order('created_at', { ascending: false })
            .limit(100),
          supabase.from('productos').select('*').order('nombre', { ascending: true }),
          supabase
            .from('agenda')
            .select('*')
            .eq('corredor_id', corredorId)
            .order('fecha', { ascending: true, nullsFirst: true }),
        ]);

        if (pErr) throw pErr;
        if (prodErr) throw prodErr;
        if (agendaErr) throw agendaErr;

        setPedidos((pData as unknown as PedidoConDetalles[]) || []);
        setProductos((prodData as Producto[]) || []);
        setAgenda((agendaData as AgendaItem[]) || []);
      } catch (err: any) {
        console.error('Error fetching dashboard:', err);
        setError(err.message || 'Error al cargar los datos.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [corredorId]);

  useEffect(() => {
    if (!corredorId) return;

    generarRecordatoriosAgenda(corredorId).catch((err) => {
      console.error('Error generando recordatorios de agenda:', err);
    });
  }, [corredorId]);

  const facturado = pedidos.reduce((acc, p) => acc + (p.total || 0), 0);
  const porCobrar = pedidos
    .filter((p) => p.estado_pago !== 'pagado')
    .reduce((acc, p) => acc + Math.max(0, (p.total || 0) - (p.monto_pagado || 0)), 0);
  const entregados = pedidos.filter((p) => p.estado === 'Entregado').length;
  const enProceso = pedidos.filter((p) => p.estado !== 'Entregado').length;
  const stockBajo = productos.filter((p) => p.activo && p.stock <= (p.stock_minimo || 0));

  const inicioDia = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };

  const diffDias = (f: Date, h: Date) =>
    Math.round((inicioDia(f).getTime() - inicioDia(h).getTime()) / 86400000);

  const eventosAgenda = useMemo(() => {
    const hoy = inicioDia(new Date());
    const conFecha = agenda.filter((a) => a.fecha && (a.estado === 'pendiente' || a.estado === 'presentado'));
    const vencidos = conFecha
      .filter((a) => parseDateOnly(a.fecha!) < hoy)
      .sort((a, b) => parseDateOnly(a.fecha!).getTime() - parseDateOnly(b.fecha!).getTime());
    const proximos = conFecha
      .filter((a) => parseDateOnly(a.fecha!) >= hoy)
      .sort((a, b) => parseDateOnly(a.fecha!).getTime() - parseDateOnly(b.fecha!).getTime())
      .slice(0, 6);
    return { vencidos, proximos };
  }, [agenda]);

  const etiquetaCuando = (dias: number) => {
    if (dias === 0) return { texto: 'Hoy', clase: 'bg-[var(--primary-soft)] text-[var(--primary-deep)]' };
    if (dias === 1) return { texto: 'Mañana', clase: 'bg-[var(--amber-soft2)] text-[var(--amber-text2)]' };
    if (dias <= 7) return { texto: `En ${dias} días`, clase: 'bg-[var(--blue-soft)] text-[var(--text)]' };
    return { texto: `En ${dias} días`, clase: 'bg-[var(--gray-soft)] text-[var(--text2)]' };
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[var(--bg)]">
      <main className="flex-1 p-4 sm:p-8 max-w-[1440px] mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--text)] tracking-tight">Resumen de Operativa</h2>
          <p className="text-[var(--text2)] mt-1">Estado de ventas, cobranzas y stock de tu operación.</p>
        </div>

        {error ? (
          <div className="bg-[var(--danger-soft)] text-[var(--danger-deep)] p-4 rounded-xl flex items-start gap-4 mb-8">
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center p-24 text-[var(--text2)]">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-[var(--primary)]" />
            <p>Cargando datos...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)]">
                <div className="p-2 bg-[var(--blue-soft)] rounded-lg w-fit mb-4">
                  <Receipt className="w-5 h-5 text-[var(--text)]" />
                </div>
                <h3 className="text-[var(--text2)] text-xs font-semibold uppercase tracking-wider mb-1">Total Facturado</h3>
                <div className="text-3xl font-bold text-[var(--text)]">{dinero(facturado)}</div>
              </div>

              <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)]">
                <div className="p-2 bg-[var(--amber-soft2)] rounded-lg w-fit mb-4">
                  <Banknote className="w-5 h-5 text-[var(--amber-text2)]" />
                </div>
                <h3 className="text-[var(--text2)] text-xs font-semibold uppercase tracking-wider mb-1">Por Cobrar</h3>
                <div className="text-3xl font-bold text-[var(--amber-text2)]">{dinero(porCobrar)}</div>
              </div>

              <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)]">
                <div className="p-2 bg-[var(--primary-soft)] rounded-lg w-fit mb-4">
                  <Factory className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <h3 className="text-[var(--text2)] text-xs font-semibold uppercase tracking-wider mb-1">Pedidos en Proceso</h3>
                <div className="text-3xl font-bold text-[var(--text)]">{enProceso}</div>
                <p className="text-[var(--text2)] text-sm mt-2">{entregados} entregados</p>
              </div>

              <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)]">
                <div className="p-2 bg-[var(--pink-soft)] rounded-lg w-fit mb-4">
                  <AlertTriangle className="w-5 h-5 text-[var(--danger)]" />
                </div>
                <h3 className="text-[var(--text2)] text-xs font-semibold uppercase tracking-wider mb-1">Stock Bajo</h3>
                <div className="text-3xl font-bold text-[var(--danger)]">{stockBajo.length}</div>
                <p className="text-[var(--text2)] text-sm mt-2">Productos en o bajo el mínimo.</p>
              </div>
            </div>

            {stockBajo.length > 0 && (
              <div className="bg-[var(--amber-soft3)] border border-[var(--amber)]/40 rounded-xl p-4 flex items-start gap-3 mb-8">
                <AlertTriangle className="w-5 h-5 text-[var(--amber-text2)] flex-shrink-0 mt-0.5" />
                <div className="text-sm text-[var(--amber-text3)]">
                  <span className="font-semibold">Alerta de stock: </span>
                  {stockBajo.map((p) => `${p.nombre} (${p.stock} uni.)`).join(', ')}
                </div>
              </div>
            )}

            {(eventosAgenda.vencidos.length > 0 || eventosAgenda.proximos.length > 0) && (
              <section className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden mb-8">
                <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-[var(--text)] flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-[var(--primary)]" />
                    Próximos eventos
                  </h3>
                  {onNavigate && (
                    <button
                      onClick={() => onNavigate('agenda')}
                      className="text-sm font-medium text-[var(--primary)] hover:underline flex items-center gap-1"
                    >
                      Ver agenda
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {eventosAgenda.vencidos.length > 0 && (
                    <div className="px-6 py-3 bg-[var(--danger-soft)]/60 flex items-center gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-[var(--danger-deep)] flex-shrink-0" />
                      <span className="text-[var(--danger-deep)]">
                        <span className="font-semibold">Vencidos sin resolver: </span>
                        {eventosAgenda.vencidos.slice(0, 3).map((v) => v.titulo).join(', ')}
                      </span>
                    </div>
                  )}
                  {eventosAgenda.proximos.map((a) => {
                    const dias = diffDias(parseDateOnly(a.fecha!), inicioDia(new Date()));
                    const etiqueta = etiquetaCuando(dias);
                    return (
                      <div key={a.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[var(--field)] transition-colors">
                        <div className="flex items-center gap-4 min-w-0">
                          <span className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            dias === 0 ? 'bg-[var(--primary-soft)]' : dias === 1 ? 'bg-[var(--amber-soft2)]' : 'bg-[var(--blue-soft)]'
                          }`}>
                            <CalendarDays className={`w-5 h-5 ${dias === 0 ? 'text-[var(--primary-deep)]' : dias === 1 ? 'text-[var(--amber-text2)]' : 'text-[var(--text)]'}`} />
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-[var(--text)] truncate">{a.titulo}</p>
                            <p className="text-xs text-[var(--text2)]">
                              {etiquetaTipo(a.tipo)}
                              {a.organismo ? ` · ${a.organismo}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${etiqueta.clase}`}>
                            {etiqueta.texto}
                          </span>
                          <p className="text-xs text-[var(--text2)] mt-1">
                            {formatDate(a.fecha!)}
                            {a.hora ? ` · ${a.hora.slice(0, 5)}` : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
              <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center">
                <h3 className="text-lg font-semibold text-[var(--text)]">Pedidos Recientes</h3>
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-[var(--text2)]" />
                  <span className="text-sm text-[var(--text2)]">{pedidos.length} pedidos</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-[var(--blue-header)]">
                      <th className="px-6 py-4 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Cliente</th>
                      <th className="px-6 py-4 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Fecha</th>
                      <th className="px-6 py-4 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Total</th>
                      <th className="px-6 py-4 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Estado</th>
                      <th className="px-6 py-4 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Pago</th>
                      <th className="px-6 py-4 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)] text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {pedidos.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-[var(--text2)]">
                          <PackageOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="font-medium">No hay pedidos para este corredor</p>
                        </td>
                      </tr>
                    ) : (
                      pedidos.map((p) => (
                        <tr
                          key={p.id}
                          onClick={() => setSelectedOrder(p)}
                          className="hover:bg-[var(--field)] transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4 text-[var(--text)] font-medium">{p.clientes?.nombre ?? '—'}</td>
                          <td className="px-6 py-4 text-[var(--text2)] text-sm">{formatDate(p.created_at)}</td>
                          <td className="px-6 py-4 text-[var(--text)] font-semibold">{dinero(p.total)}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                p.estado === 'Entregado'
                                  ? 'bg-[var(--primary-soft)] text-[var(--primary-deep)]'
                                  : 'bg-[var(--blue-soft)] text-[var(--text)]'
                              }`}
                            >
                              {p.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                p.estado_pago === 'pagado'
                                  ? 'bg-[var(--primary-soft)] text-[var(--primary-deep)]'
                                  : 'bg-[var(--amber-soft2)] text-[var(--amber-text2)]'
                              }`}
                            >
                              {p.estado_pago === 'pagado' ? 'Pagado' : 'Pendiente'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(p);
                              }}
                              className="px-4 py-2 text-[var(--primary)] text-sm font-medium hover:bg-[var(--primary-soft)] rounded transition-colors"
                            >
                              Ver detalle
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>

      {selectedOrder && (
        <div className="fixed inset-0 bg-[var(--overlay)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-start bg-[var(--field)]">
              <div>
                <h3 className="text-xl font-bold text-[var(--text)] tracking-tight">Detalle del Pedido</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-[var(--text2)]">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {formatDate(selectedOrder.created_at)}
                  </span>
                  <span className="font-semibold text-[var(--text)]">{selectedOrder.clientes?.nombre ?? 'Sin cliente'}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--hover)] p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="flex gap-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    selectedOrder.estado === 'Entregado' ? 'bg-[var(--primary-soft)] text-[var(--primary-deep)]' : 'bg-[var(--blue-soft)] text-[var(--text)]'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  {selectedOrder.estado}
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    selectedOrder.estado_pago === 'pagado' ? 'bg-[var(--primary-soft)] text-[var(--primary-deep)]' : 'bg-[var(--amber-soft2)] text-[var(--amber-text2)]'
                  }`}
                >
                  {selectedOrder.estado_pago === 'pagado' ? 'Pagado' : 'Pago pendiente'}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-semibold uppercase tracking-widest text-[var(--text2)] mb-3">Ítems</h4>
                {selectedOrder.pedido_items?.length === 0 ? (
                  <p className="text-[var(--text2)] italic text-sm">Sin ítems.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedOrder.pedido_items.map((it) => (
                      <div key={it.id} className="flex items-center justify-between border border-[var(--border)] rounded-lg p-4">
                        <div>
                          <p className="font-semibold text-[var(--text)]">Producto #{it.producto_id.slice(0, 8).toUpperCase()}</p>
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

              {selectedOrder.notas && (
                <div className="bg-[var(--field)] border border-[var(--border)] rounded-lg p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text2)] mb-1">Notas</p>
                  <p className="text-sm text-[var(--text)] whitespace-pre-line">{selectedOrder.notas}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--field)] flex justify-between items-center">
              <span className="text-sm text-[var(--text2)]">
                Pagado: <strong className="text-[var(--text)]">{dinero(selectedOrder.monto_pagado || 0)}</strong>
              </span>
              <span className="text-lg font-bold text-[var(--text)]">Total: {dinero(selectedOrder.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
