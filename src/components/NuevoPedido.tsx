import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { crearPedido } from '../lib/pedidos';
import { dinero } from '../lib/format';
import type { Database } from '../types';
import { PlusCircle, Trash2, Loader2, AlertCircle, CheckCircle2, ChevronLeft, User, UserPlus, PackagePlus, Percent, X, BadgeCheck } from 'lucide-react';

type Producto = Database['public']['Tables']['productos']['Row'];
type Cliente = Database['public']['Tables']['clientes']['Row'];
type Usuario = Database['public']['Tables']['usuarios']['Row'];

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
  const [vendedores, setVendedores] = useState<Usuario[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [vendedorId, setVendedorId] = useState('');
  const [notas, setNotas] = useState('');
  const [descuentoTipo, setDescuentoTipo] = useState<'porcentaje' | 'monto'>('porcentaje');
  const [descuentoValor, setDescuentoValor] = useState('');
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
  const [mostrarNuevoProducto, setMostrarNuevoProducto] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    precio: '',
    stock: '',
    categoria: '',
  });
  const [guardandoProducto, setGuardandoProducto] = useState(false);
  const [errorProducto, setErrorProducto] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        setError(null);
        const [{ data: prods, error: e1 }, { data: clis, error: e2 }, { data: vends, error: e3 }] = await Promise.all([
          supabase.from('productos').select('*').eq('activo', true).order('nombre', { ascending: true }),
          supabase.from('clientes').select('*').eq('corredor_id', corredorId).eq('activo', true).order('nombre', { ascending: true }),
          supabase.rpc('listar_vendedores'),
        ]);
        if (e1) throw e1;
        if (e2) throw e2;
        if (e3) throw e3;
        setProductos((prods as Producto[]) || []);
        setClientes((clis as Cliente[]) || []);
        setVendedores((vends as Usuario[]) || []);
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

  const subtotal = lineas.reduce((acc, l) => acc + l.cantidad * l.precio_unitario, 0);

  const descuento = useMemo(() => {
    const v = Number(descuentoValor);
    if (!Number.isFinite(v) || v <= 0) return 0;
    if (descuentoTipo === 'porcentaje') return (Math.min(100, v) / 100) * subtotal;
    return Math.min(v, subtotal);
  }, [descuentoTipo, descuentoValor, subtotal]);

  const total = Math.max(0, subtotal - descuento);

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

  const guardarNuevoProducto = async () => {
    const nombre = nuevoProducto.nombre.trim();
    const precio = Number(nuevoProducto.precio);
    if (!nombre) {
      setErrorProducto('Ingresá el nombre del producto.');
      return;
    }
    if (!Number.isFinite(precio) || precio < 0) {
      setErrorProducto('El precio de venta debe ser un número mayor o igual a 0.');
      return;
    }
    setGuardandoProducto(true);
    setErrorProducto(null);
    try {
      const { data, error: e } = await supabase
        .from('productos')
        .insert({
          nombre,
          precio,
          stock: Math.max(0, Number(nuevoProducto.stock) || 0),
          stock_minimo: 0,
          categoria: nuevoProducto.categoria.trim() || 'general',
          activo: true,
          costo: 0,
          costo_adquisicion: 0,
          costo_transporte: 0,
          costo_empaque: 0,
          costo_almacenaje: 0,
          costo_almacenamiento: 0,
          costo_comision: 0,
          costo_otros: 0,
        })
        .select('*')
        .single();
      if (e) throw e;
      const nuevo = data as Producto;
      setProductos((prev) => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setLineas((prev) => [
        ...prev,
        { key: crypto.randomUUID(), producto_id: nuevo.id, cantidad: 1, precio_unitario: nuevo.precio },
      ]);
      setNuevoProducto({ nombre: '', precio: '', stock: '', categoria: '' });
      setMostrarNuevoProducto(false);
    } catch (err: any) {
      console.error(err);
      setErrorProducto(err.message || 'No se pudo agregar el producto.');
    } finally {
      setGuardandoProducto(false);
    }
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

    const result = await crearPedido(corredorId, clienteId || null, items, notas || undefined, descuento, vendedorId || null);

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

            <div className="mt-4 space-y-1">
              <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider flex items-center gap-1.5">
                <BadgeCheck className="w-3.5 h-3.5" />
                Vendedor
              </label>
              <select
                value={vendedorId}
                onChange={(e) => setVendedorId(e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
              >
                <option value="">— Sin vendedor asignado —</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nombre}
                  </option>
                ))}
              </select>
            </div>

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
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarNuevoProducto(true);
                    setErrorProducto(null);
                  }}
                  className="flex items-center gap-2 text-[var(--primary)] text-sm font-medium hover:underline"
                >
                  <PackagePlus className="w-4 h-4" />
                  Agregar producto nuevo
                </button>
                <button
                  type="button"
                  onClick={agregarLinea}
                  className="flex items-center gap-2 text-[var(--primary)] text-sm font-medium hover:underline"
                >
                  <PlusCircle className="w-4 h-4" />
                  Agregar producto
                </button>
              </div>
            </div>

            {mostrarNuevoProducto && (
              <div className="mb-4 p-4 rounded-lg border border-[var(--border)] bg-[var(--field)] space-y-3">
                <p className="text-sm font-medium text-[var(--text)]">Nuevo producto</p>
                {errorProducto && (
                  <div className="bg-[var(--danger-soft)] text-[var(--danger-deep)] p-3 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{errorProducto}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={nuevoProducto.nombre}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
                      placeholder="Ej: Tablón de pino 2m"
                      className="w-full h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--surface)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">
                      Precio venta *
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={nuevoProducto.precio}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio: e.target.value })}
                      placeholder="0"
                      className="w-full h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--surface)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">
                      Stock inicial
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={nuevoProducto.stock}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, stock: e.target.value })}
                      placeholder="0"
                      className="w-full h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--surface)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Categoría</label>
                    <input
                      type="text"
                      value={nuevoProducto.categoria}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, categoria: e.target.value })}
                      placeholder="general"
                      className="w-full h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--surface)]"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={guardarNuevoProducto}
                    disabled={guardandoProducto}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-deep)] transition-colors disabled:opacity-60"
                  >
                    {guardandoProducto ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <PackagePlus className="w-4 h-4" />
                        Guardar producto
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarNuevoProducto(false);
                      setErrorProducto(null);
                    }}
                    className="text-sm font-medium text-[var(--text2)] hover:text-[var(--text)] transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

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

            <div className="mt-6 pt-6 border-t border-[var(--blue-header)] space-y-3">
              <div className="flex justify-end items-center gap-4">
                <span className="text-[var(--text2)] text-sm">Subtotal</span>
                <span className="text-xl font-bold text-[var(--text)]">{dinero(subtotal)}</span>
              </div>

              <div className="flex flex-col sm:flex-row justify-end items-end sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text2)] text-sm">Descuento</span>
                  <div className="flex border border-[var(--border)] rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setDescuentoTipo('porcentaje')}
                      className={`h-9 px-3 flex items-center justify-center transition-colors ${
                        descuentoTipo === 'porcentaje'
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--field)] text-[var(--text2)] hover:text-[var(--text)]'
                      }`}
                      title="Descuento por porcentaje"
                    >
                      <Percent className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescuentoTipo('monto')}
                      className={`h-9 px-3 flex items-center justify-center transition-colors ${
                        descuentoTipo === 'monto'
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--field)] text-[var(--text2)] hover:text-[var(--text)]'
                      }`}
                      title="Descuento en monto fijo"
                    >
                      $
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={descuentoTipo === 'porcentaje' ? 100 : subtotal}
                      value={descuentoValor}
                      onChange={(e) => setDescuentoValor(e.target.value)}
                      placeholder={descuentoTipo === 'porcentaje' ? '0%' : '$0'}
                      className="w-28 h-9 px-3 pr-8 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)] text-right font-semibold"
                    />
                    {descuentoValor !== '' && (
                      <button
                        type="button"
                        onClick={() => setDescuentoValor('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text2)] hover:text-[var(--text)]"
                        title="Quitar descuento"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold text-[var(--danger-deep)]">
                  {descuento > 0 ? `- ${dinero(descuento)}` : '—'}
                </span>
              </div>

              <div className="flex justify-end items-center gap-4">
                <span className="text-[var(--text2)] text-sm">Total del pedido</span>
                <span className="text-3xl font-bold text-[var(--text)]">{dinero(total)}</span>
              </div>
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
