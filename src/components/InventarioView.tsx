import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { costoTotalProducto } from '../lib/pedidos';
import type { Database } from '../types';
import {
  Boxes,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Minus,
  Plus,
  Pencil,
  X,
  PackageX,
} from 'lucide-react';

type Producto = Database['public']['Tables']['productos']['Row'];

const dinero = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

const etiquetaEstado = (p: Producto) => {
  if (!p.activo) return { texto: 'Inactivo', clase: 'bg-[var(--gray-soft)] text-[var(--text2)]' };
  if (p.stock <= 0) return { texto: 'Sin stock', clase: 'bg-[var(--danger-soft)] text-[var(--danger-deep)]' };
  if (p.stock <= (p.stock_minimo || 0)) return { texto: 'Stock bajo', clase: 'bg-[var(--amber-soft2)] text-[var(--amber-text2)]' };
  return { texto: 'OK', clase: 'bg-[var(--primary-soft)] text-[var(--primary-deep)]' };
};

export default function InventarioView() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Producto | null>(null);
  const [ajuste, setAjuste] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [agregar, setAgregar] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState('');

  const num = (s: string) => (Number.isFinite(Number(s)) ? Math.max(0, Number(s)) : 0);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: e } = await supabase
        .from('productos')
        .select('*')
        .order('nombre', { ascending: true });
      if (e) throw e;
      setProductos((data as Producto[]) || []);
    } catch (err) {
      console.error(err);
      setError('Error al cargar el inventario.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const totalUnidades = useMemo(
    () => productos.reduce((acc, p) => acc + (p.stock || 0), 0),
    [productos]
  );
  const stockBajo = useMemo(
    () => productos.filter((p) => p.activo && p.stock <= (p.stock_minimo || 0)),
    [productos]
  );
  const sinStock = useMemo(
    () => productos.filter((p) => p.activo && p.stock <= 0),
    [productos]
  );
  const valorInventario = useMemo(
    () => productos.reduce((acc, p) => acc + (p.stock || 0) * costoTotalProducto(p), 0),
    [productos]
  );

  const aplicarAjuste = async (delta: number) => {
    if (!selected) return;
    const nuevo = Math.max(0, (selected.stock || 0) + delta);
    setGuardando(true);
    try {
      const { error: e } = await supabase
        .from('productos')
        .update({ stock: nuevo })
        .eq('id', selected.id);
      if (e) {
        alert('Error al ajustar el stock: ' + e.message);
        return;
      }
      setProductos((prev) => prev.map((p) => (p.id === selected.id ? { ...p, stock: nuevo } : p)));
      setSelected((prev) => (prev ? { ...prev, stock: nuevo } : prev));
    } catch (err) {
      console.error(err);
      alert('Error al ajustar el stock.');
    } finally {
      setGuardando(false);
    }
  };

  const setStockExacto = async () => {
    if (!selected) return;
    const nuevo = Math.max(0, ajuste);
    setGuardando(true);
    try {
      const { error: e } = await supabase
        .from('productos')
        .update({ stock: nuevo })
        .eq('id', selected.id);
      if (e) {
        alert('Error al ajustar el stock: ' + e.message);
        return;
      }
      setProductos((prev) => prev.map((p) => (p.id === selected.id ? { ...p, stock: nuevo } : p)));
      setSelected((prev) => (prev ? { ...prev, stock: nuevo } : prev));
    } catch (err) {
      console.error(err);
      alert('Error al ajustar el stock.');
    } finally {
      setGuardando(false);
    }
  };

  const agregarStock = async () => {
    if (!agregar) return;
    const n = Math.round(num(cantidad));
    if (n <= 0) {
      alert('Escribí una cantidad mayor a 0.');
      return;
    }
    const nuevo = (agregar.stock || 0) + n;
    setGuardando(true);
    try {
      const { error: e } = await supabase
        .from('productos')
        .update({ stock: nuevo })
        .eq('id', agregar.id);
      if (e) {
        alert('Error al agregar stock: ' + e.message);
        return;
      }
      setProductos((prev) => prev.map((p) => (p.id === agregar.id ? { ...p, stock: nuevo } : p)));
      setAgregar(null);
    } catch (err) {
      console.error(err);
      alert('Error al agregar stock.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-[1440px] mx-auto w-full">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text)] tracking-tight">Inventario</h2>
          <p className="text-[var(--text2)] mt-1">Control de stock y unidades disponibles de cada producto.</p>
        </div>
        <div className="hidden md:block">
          <span className="text-sm text-[var(--text2)]">{productos.length} productos</span>
        </div>
      </div>

      {error && (
        <div className="bg-[var(--danger-soft)] text-[var(--danger-deep)] p-4 rounded-xl flex items-start gap-4 mb-8">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)]">
          <div className="p-2 bg-[var(--blue-soft)] rounded-lg w-fit mb-4">
            <Boxes className="w-5 h-5 text-[var(--text)]" />
          </div>
          <h3 className="text-[var(--text2)] text-xs font-semibold uppercase tracking-wider mb-1">Unidades Totales</h3>
          <div className="text-3xl font-bold text-[var(--text)]">{totalUnidades}</div>
          <p className="text-[var(--text2)] text-sm mt-2">Suma de stock de todos los productos.</p>
        </div>

        <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)]">
          <div className="p-2 bg-[var(--amber-soft2)] rounded-lg w-fit mb-4">
            <AlertTriangle className="w-5 h-5 text-[var(--amber-text2)]" />
          </div>
          <h3 className="text-[var(--text2)] text-xs font-semibold uppercase tracking-wider mb-1">Stock Bajo</h3>
          <div className="text-3xl font-bold text-[var(--amber-text2)]">{stockBajo.length}</div>
          <p className="text-[var(--text2)] text-sm mt-2">En o bajo el mínimo.</p>
        </div>

        <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)]">
          <div className="p-2 bg-[var(--danger-soft)] rounded-lg w-fit mb-4">
            <PackageX className="w-5 h-5 text-[var(--danger)]" />
          </div>
          <h3 className="text-[var(--text2)] text-xs font-semibold uppercase tracking-wider mb-1">Sin Stock</h3>
          <div className="text-3xl font-bold text-[var(--danger)]">{sinStock.length}</div>
          <p className="text-[var(--text2)] text-sm mt-2">Productos agotados.</p>
        </div>

        <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)]">
          <div className="p-2 bg-[var(--primary-soft)] rounded-lg w-fit mb-4">
            <Boxes className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <h3 className="text-[var(--text2)] text-xs font-semibold uppercase tracking-wider mb-1">Valor del Inventario</h3>
          <div className="text-3xl font-bold text-[var(--primary)]">{dinero(valorInventario)}</div>
          <p className="text-[var(--text2)] text-sm mt-2">A costo de producción.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text2)]">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-[var(--primary)]" />
          <p>Cargando inventario...</p>
        </div>
      ) : productos.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-12 text-center text-[var(--text2)]">
          <Boxes className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[var(--text)] mb-2">No hay productos</h3>
          <p>Agregá productos en la sección Productos para comenzar.</p>
        </div>
      ) : (
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[var(--blue-header)]">
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Producto</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Categoría</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)] text-center">Stock Actual</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)] text-center">Stock Mínimo</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)] text-center">Estado</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)] text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {productos.map((p) => {
                  const estado = etiquetaEstado(p);
                  return (
                    <tr key={p.id} className="hover:bg-[var(--field)] transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-[var(--text)]">{p.nombre}</p>
                        {!p.activo && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text2)]">Inactivo</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[var(--text2)] text-sm capitalize">{p.categoria}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-lg font-bold ${p.stock <= 0 ? 'text-[var(--danger)]' : p.stock <= (p.stock_minimo || 0) ? 'text-[var(--amber-text2)]' : 'text-[var(--text)]'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-[var(--text2)] text-sm">{p.stock_minimo}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${estado.clase}`}>
                          {estado.texto}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setAgregar(p);
                              setCantidad('');
                            }}
                            className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--primary-deep)] transition-colors flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" />
                            Agregar stock
                          </button>
                          <button
                            onClick={() => {
                              setSelected(p);
                              setAjuste(p.stock);
                            }}
                            className="px-4 py-2 text-[var(--primary)] text-sm font-medium hover:bg-[var(--primary-soft)] rounded transition-colors flex items-center gap-1.5"
                          >
                            <Pencil className="w-4 h-4" />
                            Ajustar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-[var(--overlay)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-start bg-[var(--field)]">
              <div>
                <h3 className="text-xl font-bold text-[var(--text)] tracking-tight">{selected.nombre}</h3>
                <p className="text-sm text-[var(--text2)] capitalize">{selected.categoria}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--hover)] p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-[var(--border)] rounded-lg p-4 text-center">
                  <p className="text-xs uppercase tracking-wider text-[var(--text2)] mb-1">Stock actual</p>
                  <p className="text-2xl font-bold text-[var(--primary)]">{selected.stock} uni.</p>
                </div>
                <div className="border border-[var(--border)] rounded-lg p-4 text-center">
                  <p className="text-xs uppercase tracking-wider text-[var(--text2)] mb-1">Stock mínimo</p>
                  <p className="text-2xl font-bold text-[var(--text)]">{selected.stock_minimo} uni.</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold uppercase tracking-widest text-[var(--text2)] mb-3">Control de Stock</h4>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => aplicarAjuste(-1)}
                    disabled={guardando}
                    className="w-10 h-10 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--text2)] hover:bg-[var(--blue-header)] disabled:opacity-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="number"
                      value={ajuste}
                      min={0}
                      onChange={(e) => setAjuste(Number(e.target.value))}
                      className="w-full h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)] text-center font-semibold"
                    />
                    <button
                      onClick={setStockExacto}
                      disabled={guardando}
                      className="flex items-center gap-2 px-4 h-11 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-deep)] disabled:opacity-50"
                    >
                      {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                      <Pencil className="w-4 h-4" />
                      Aplicar
                    </button>
                  </div>
                  <button
                    onClick={() => aplicarAjuste(1)}
                    disabled={guardando}
                    className="w-10 h-10 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--text2)] hover:bg-[var(--blue-header)] disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-[var(--text2)] mt-2">
                  Escribí el valor deseado y presioná Aplicar, o usá +/- para ajustar de a uno.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {agregar && (
        <div className="fixed inset-0 bg-[var(--overlay)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-start bg-[var(--field)]">
              <div>
                <h3 className="text-xl font-bold text-[var(--text)] tracking-tight">Agregar Stock</h3>
                <p className="text-sm text-[var(--text2)] mt-0.5">{agregar.nombre}</p>
              </div>
              <button
                onClick={() => setAgregar(null)}
                className="text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--hover)] p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-[var(--border)] rounded-lg p-4 text-center">
                  <p className="text-xs uppercase tracking-wider text-[var(--text2)] mb-1">Stock actual</p>
                  <p className="text-2xl font-bold text-[var(--text)]">{agregar.stock} uni.</p>
                </div>
                <div className="border border-[var(--border)] rounded-lg p-4 text-center">
                  <p className="text-xs uppercase tracking-wider text-[var(--text2)] mb-1">Resultado</p>
                  <p className="text-2xl font-bold text-[var(--primary)]">{agregar.stock + Math.round(num(cantidad))} uni.</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Cantidad a agregar *</label>
                <input
                  type="number"
                  min="1"
                  autoFocus
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  placeholder="Ej. 10"
                  className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)] text-center font-semibold text-lg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') agregarStock();
                  }}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--field)] flex justify-end gap-3">
              <button
                onClick={() => setAgregar(null)}
                className="px-5 py-2.5 text-[var(--text2)] font-medium hover:bg-[var(--blue-header)] rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={agregarStock}
                disabled={guardando}
                className="px-5 py-2.5 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-deep)] transition-colors flex items-center gap-2"
              >
                {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
