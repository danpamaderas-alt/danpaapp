import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { crearPedido } from '../lib/pedidos';
import { dinero } from '../lib/format';
import type { Database } from '../types';
import { PlusCircle, Trash2, Loader2, AlertCircle, CheckCircle2, ChevronLeft, User, UserPlus } from 'lucide-react';

type Producto = Database['public']['Tables']['productos']['Row'];
type Cliente = Database['public']['Tables']['clientes']['Row'];

interface Linea {
  key: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
}

interface NuevoPedidoProps {
  corredorId: string;
  onSuccess: () => void;
}

export default function NuevoPedido({ corredorId, onSuccess }: NuevoPedidoProps) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [notas, setNotas] = useState('');
  const [lineas, setLineas] = useState<Linea[]>([
    { key: crypto.randomUUID(), producto_id: '', cantidad: 1, precio_unitario: 0 },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    tipo_cliente: 'general',
  });
  const [guardandoCliente, setGuardandoCliente] = useState(false);
  const [errorCliente, setErrorCliente] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        setError(null);
        const [{ data: prods, error: e1 }, { data: clis, error: e2 }] = await Promise.all([
          supabase.from('productos').select('*').eq('activo', true).order('nombre', { ascending: true }),
          supabase.from('clientes').select('*').eq('corredor_id', corredorId).eq('activo', true).order('nombre', { ascending: true }),
        ]);
        if (e1) throw e1;
        if (e2) throw e2;
        setProductos((prods as Producto[]) || []);
        setClientes((clis as Cliente[]) || []);
      } catch (err: any) {
        console.error(err);
        setError('No se pudieron cargar productos/clientes.');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [corredorId]);

  const catalogoPorId = useMemo(
    () => Object.fromEntries(productos.map((p) => [p.id, p])),
    [productos]
  );

  const total = lineas.reduce((acc, l) => acc + l.cantidad * l.precio_unitario, 0);

  const actualizarLinea = (key: string, patch: Partial<Linea>) => {
    setLineas((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;
        const next = { ...l, ...patch };
        if (patch.producto_id !== undefined) {
          const p = catalogoPorId[patch.producto_id];
          next.precio_unitario = p?.precio ?? 0;
        }
        return next;
      })
    );
  };

  const agregarLinea = () => {
    setLineas((prev) => [
      ...prev,
      { key: crypto.randomUUID(), producto_id: '', cantidad: 1, precio_unitario: 0 },
    ]);
  };

  const quitarLinea = (key: string) => {
    setLineas((prev) => (prev.length === 1 ? prev : prev.filter((l) => l.key !== key)));
  };

  const guardarNuevoCliente = async () => {
    const nombre = nuevoCliente.nombre.trim();
    if (!nombre) {
      setErrorCliente('Ingresá el nombre del cliente.');
      return;
    }
    setGuardandoCliente(true);
    setErrorCliente(null);
    try {
      const { data, error: e } = await supabase
        .from('clientes')
        .insert({
          corredor_id: corredorId,
          nombre,
          telefono: nuevoCliente.telefono.trim() || null,
          direccion: nuevoCliente.direccion.trim() || null,
          tipo_cliente: nuevoCliente.tipo_cliente,
        })
        .select('*')
        .single();
      if (e) throw e;
      const nuevo = data as Cliente;
      setClientes((prev) => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setClienteId(nuevo.id);
      setNuevoCliente({ nombre: '', telefono: '', direccion: '', tipo_cliente: 'general' });
      setMostrarNuevoCliente(false);
    } catch (err: any) {
      console.error(err);
      setErrorCliente(err.message || 'No se pudo agregar el cliente.');
    } finally {
      setGuardandoCliente(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const items = lineas
      .filter((l) => l.producto_id && l.cantidad > 0)
      .map((l) => ({ producto_id: l.producto_id, cantidad: l.cantidad, precio_unitario: l.precio_unitario }));

    const stockInsuficiente = items.find((i) => {
      const p = catalogoPorId[i.producto_id];
      return p && i.cantidad > (p.stock || 0);
    });
    if (stockInsuficiente) {
      const p = catalogoPorId[stockInsuficiente.producto_id];
      setError(`Stock insuficiente para "${p?.nombre}": hay ${p?.stock} unidades.`);
      setSubmitting(false);
      return;
    }

    const result = await crearPedido(corredorId, clienteId || null, items, notas || undefined);

    setSubmitting(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(onSuccess, 1800);
    } else {
      setError(result.error || 'Error al procesar el pedido.');
    }
  };

  if (success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen p-8 text-[var(--text)]">
        <CheckCircle2 className="w-16 h-16 text-[var(--primary)] mb-4" />
        <h2 className="text-3xl font-bold mb-2">¡Pedido Cargado!</h2>
        <p className="text-[var(--text2)] mb-6">El pedido se registró y el stock fue descontado.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 text-[var(--text2)] hover:text-[var(--text)] transition-colors mb-6 font-medium text-sm"
      >
        <ChevronLeft className="w-4 h-4" />
        Volver
      </button>

      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[var(--text)] tracking-tight">Nuevo Pedido</h2>
        <p className="text-[var(--text2)] mt-2">Cargá los productos vendidos y el stock se descontará automáticamente.</p>
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
          <p>Cargando...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="bg-[var(--surface)] p-8 rounded-xl border border-[var(--border)] shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-[var(--text)]">
              <User className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Cliente</h3>
            </div>

            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
            >
              <option value="">— Sin cliente (venta directa) —</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>

            {!mostrarNuevoCliente && (
              <button
                type="button"
                onClick={() => {
                  setMostrarNuevoCliente(true);
                  setErrorCliente(null);
                }}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] hover:underline"
              >
                <UserPlus className="w-4 h-4" />
                Agregar cliente nuevo
              </button>
            )}

            {mostrarNuevoCliente && (
              <div className="mt-4 p-4 rounded-lg border border-[var(--border)] bg-[var(--field)] space-y-3">
                <p className="text-sm font-medium text-[var(--text)]">Nuevo cliente</p>
                {errorCliente && (
                  <div className="bg-[var(--danger-soft)] text-[var(--danger-deep)] p-3 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{errorCliente}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={nuevoCliente.nombre}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                      placeholder="Nombre y apellido"
                      className="w-full h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--surface)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Teléfono</label>
                    <input
                      type="tel"
                      value={nuevoCliente.telefono}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                      placeholder="+54 221..."
                      className="w-full h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--surface)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Dirección</label>
                    <input
                      type="text"
                      value={nuevoCliente.direccion}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })}
                      placeholder="Calle y número, localidad"
                      className="w-full h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--surface)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Tipo</label>
                    <select
                      value={nuevoCliente.tipo_cliente}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, tipo_cliente: e.target.value })}
                      className="w-full h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--surface)]"
                    >
                      <option value="general">General</option>
                      <option value="mayorista">Mayorista</option>
                      <option value="constructor">Constructor</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={guardarNuevoCliente}
                    disabled={guardandoCliente}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-deep)] transition-colors disabled:opacity-60"
                  >
                    {guardandoCliente ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Guardar cliente
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarNuevoCliente(false);
                      setErrorCliente(null);
                    }}
                    className="text-sm font-medium text-[var(--text2)] hover:text-[var(--text)] transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="bg-[var(--surface)] p-8 rounded-xl border border-[var(--border)] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-[var(--text)]">
                <PlusCircle className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Productos del Pedido</h3>
              </div>
              <button
                type="button"
                onClick={agregarLinea}
                className="flex items-center gap-2 text-[var(--primary)] text-sm font-medium hover:underline"
              >
                <PlusCircle className="w-4 h-4" />
                Agregar producto
              </button>
            </div>

            <div className="space-y-4">
              {lineas.map((linea, idx) => {
                const prod = catalogoPorId[linea.producto_id];
                return (
                  <div key={linea.key} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end border border-[var(--border)] rounded-lg p-4">
                    <div className="flex-1 w-full">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Producto</label>
                      <select
                        value={linea.producto_id}
                        onChange={(e) => actualizarLinea(linea.key, { producto_id: e.target.value })}
                        className="w-full h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)] mt-1"
                      >
                        <option value="">Seleccionar...</option>
                        {productos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} — {dinero(p.precio)} ({p.stock} uni.)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-32">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Cantidad</label>
                      <input
                        type="number"
                        min={1}
                        max={prod?.stock ?? 1}
                        value={linea.cantidad}
                        onChange={(e) => actualizarLinea(linea.key, { cantidad: Math.max(1, Number(e.target.value)) })}
                        className="w-full h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)] mt-1"
                      />
                    </div>

                    <div className="w-40 text-left sm:text-right">
                      <p className="text-xs text-[var(--text2)] mb-1">Subtotal</p>
                      <p className="font-bold text-[var(--text)]">
                        {dinero(linea.cantidad * linea.precio_unitario)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => quitarLinea(linea.key)}
                      disabled={lineas.length === 1}
                      className="w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text2)] hover:text-[var(--danger-deep)] hover:border-[var(--danger-soft)] disabled:opacity-40"
                      title={idx + 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {productos.length === 0 && (
              <p className="text-sm text-[var(--amber-text2)] mt-4">No hay productos activos cargados.</p>
            )}

            <div className="mt-6 pt-6 border-t border-[var(--blue-header)] flex justify-end items-center gap-4">
              <span className="text-[var(--text2)] text-sm">Total del pedido</span>
              <span className="text-3xl font-bold text-[var(--text)]">{dinero(total)}</span>
            </div>
          </section>

          <section className="bg-[var(--surface)] p-8 rounded-xl border border-[var(--border)] shadow-sm">
            <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Notas</h3>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Comentarios sobre entrega, facturación, etc..."
              rows={3}
              className="w-full p-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
            />
          </section>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={submitting || total <= 0}
              className="bg-[var(--primary)] text-white px-8 py-3 rounded-lg font-medium shadow-md hover:bg-[var(--primary-deep)] transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Registrar Pedido'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
