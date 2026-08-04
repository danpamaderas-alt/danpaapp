import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { costoTotalProducto, desgloseCostos } from '../lib/pedidos';
import type { Database } from '../types';
import {
  TreePine,
  Loader2,
  AlertCircle,
  AlertTriangle,
  X,
  Minus,
  Plus,
  TrendingUp,
  Coins,
  Pencil,
} from 'lucide-react';

type Producto = Database['public']['Tables']['productos']['Row'];

const dinero = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

type FormState = {
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: string;
  stock_minimo: string;
  activo: boolean;
  costo: string;
  costo_adquisicion: string;
  costo_transporte: string;
  costo_empaque: string;
  costo_almacenaje: string;
  costo_almacenamiento: string;
  costo_comision: string;
  costo_otros: string;
};

const emptyForm = (): FormState => ({
  nombre: '',
  descripcion: '',
  categoria: 'general',
  precio: '',
  stock_minimo: '0',
  activo: true,
  costo: '',
  costo_adquisicion: '',
  costo_transporte: '',
  costo_empaque: '',
  costo_almacenaje: '',
  costo_almacenamiento: '',
  costo_comision: '',
  costo_otros: '',
});

export default function ProductosView() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Producto | null>(null);
  const [ajuste, setAjuste] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState(emptyForm);

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
    } catch (err: any) {
      console.error(err);
      setError('Error al cargar los productos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const abrirEdicion = () => {
    if (!selected) return;
    setForm({
      nombre: selected.nombre,
      descripcion: selected.descripcion || '',
      categoria: selected.categoria,
      precio: String(selected.precio),
      stock_minimo: String(selected.stock_minimo ?? 0),
      activo: selected.activo,
      costo: String(selected.costo ?? 0),
      costo_adquisicion: String(selected.costo_adquisicion ?? 0),
      costo_transporte: String(selected.costo_transporte ?? 0),
      costo_empaque: String(selected.costo_empaque ?? 0),
      costo_almacenaje: String(selected.costo_almacenaje ?? 0),
      costo_almacenamiento: String(selected.costo_almacenamiento ?? 0),
      costo_comision: String(selected.costo_comision ?? 0),
      costo_otros: String(selected.costo_otros ?? 0),
    });
    setEditando(true);
  };

  const guardarEdicion = async () => {
    if (!selected) return;
    if (!form.nombre.trim()) {
      alert('Escribí un nombre para el producto.');
      return;
    }
    const precio = Number(form.precio);
    if (!Number.isFinite(precio) || precio < 0) {
      alert('El precio de venta debe ser un número mayor o igual a 0.');
      return;
    }
    setGuardando(true);
    setError(null);
    const { error: e } = await supabase
      .from('productos')
      .update({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        categoria: form.categoria.trim() || 'general',
        precio,
        stock_minimo: Math.max(0, Number(form.stock_minimo) || 0),
        activo: form.activo,
        costo: Math.max(0, Number(form.costo) || 0),
        costo_adquisicion: Math.max(0, Number(form.costo_adquisicion) || 0),
        costo_transporte: Math.max(0, Number(form.costo_transporte) || 0),
        costo_empaque: Math.max(0, Number(form.costo_empaque) || 0),
        costo_almacenaje: Math.max(0, Number(form.costo_almacenaje) || 0),
        costo_almacenamiento: Math.max(0, Number(form.costo_almacenamiento) || 0),
        costo_comision: Math.max(0, Number(form.costo_comision) || 0),
        costo_otros: Math.max(0, Number(form.costo_otros) || 0),
      })
      .eq('id', selected.id);
    setGuardando(false);
    if (e) {
      setError('Error al guardar el producto: ' + e.message);
      return;
    }
    setEditando(false);
    await cargarProductos();
  };

  const aplicarAjuste = async (delta: number) => {
    if (!selected) return;
    const nuevo = Math.max(0, (selected.stock || 0) + delta);
    setGuardando(true);
    const { error: e } = await supabase
      .from('productos')
      .update({ stock: nuevo })
      .eq('id', selected.id);
    setGuardando(false);
    if (e) {
      alert('Error al ajustar el stock: ' + e.message);
      return;
    }
    setProductos((prev) => prev.map((p) => (p.id === selected.id ? { ...p, stock: nuevo } : p)));
    setSelected((prev) => (prev ? { ...prev, stock: nuevo } : prev));
  };

  const setStockExacto = async () => {
    if (!selected) return;
    setGuardando(true);
    const { error: e } = await supabase
      .from('productos')
      .update({ stock: Math.max(0, ajuste) })
      .eq('id', selected.id);
    setGuardando(false);
    if (e) {
      alert('Error al ajustar el stock: ' + e.message);
      return;
    }
    setProductos((prev) => prev.map((p) => (p.id === selected.id ? { ...p, stock: Math.max(0, ajuste) } : p)));
    setSelected((prev) => (prev ? { ...prev, stock: Math.max(0, ajuste) } : prev));
  };

  return (
    <div className="flex-1 p-8 max-w-[1440px] mx-auto w-full">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text)] tracking-tight">Productos & Stock</h2>
          <p className="text-[var(--text2)] mt-1">Catálogo, control de stock y desglose de costos de producción.</p>
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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text2)]">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-[var(--primary)]" />
          <p>Cargando productos...</p>
        </div>
      ) : productos.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-12 text-center text-[var(--text2)]">
          <TreePine className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[var(--text)] mb-2">No hay productos</h3>
          <p>Agregá productos en la tabla productos para comenzar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {productos.map((p) => {
            const costo = costoTotalProducto(p);
            const margen = p.precio - costo;
            const bajo = p.activo && p.stock <= (p.stock_minimo || 0);
            return (
              <button
                key={p.id}
                onClick={() => {
                  setSelected(p);
                  setAjuste(p.stock);
                  setEditando(false);
                }}
                className={`bg-[var(--surface)] rounded-xl border p-6 text-left hover:shadow-md transition-shadow ${
                  bajo ? 'border-[var(--amber)]' : 'border-[var(--border)]'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[var(--blue-soft)] rounded-lg">
                      <TreePine className="w-5 h-5 text-[var(--text)]" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text)]">{p.nombre}</h3>
                  </div>
                  {!p.activo && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--gray-soft)] text-[var(--text2)] px-2 py-0.5 rounded">
                      Inactivo
                    </span>
                  )}
                </div>

                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-[var(--text2)] text-xs uppercase tracking-wider mb-0.5">Precio Venta</p>
                    <p className="text-2xl font-bold text-[var(--text)]">{dinero(p.precio)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[var(--text2)] text-xs uppercase tracking-wider mb-0.5">Stock</p>
                    <p className={`text-2xl font-bold ${bajo ? 'text-[var(--danger)]' : 'text-[var(--primary)]'}`}>{p.stock} uni.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[var(--blue-header)] pt-3 text-sm">
                  <span className="text-[var(--text2)]">Costo total</span>
                  <span className="font-semibold text-[var(--text)]">{dinero(costo)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 text-sm">
                  <span className="text-[var(--text2)]">Margen</span>
                  <span className={`font-semibold ${margen >= 0 ? 'text-[var(--primary)]' : 'text-[var(--danger)]'}`}>
                    {dinero(margen)}
                  </span>
                </div>

                {bajo && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[var(--amber-text2)]">
                    <AlertTriangle className="w-4 h-4" />
                    Stock bajo (mín. {p.stock_minimo})
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-[var(--overlay)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-start bg-[var(--field)]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--blue-soft)] rounded-lg">
                  <TreePine className="w-5 h-5 text-[var(--text)]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[var(--text)]">{selected.nombre}</h3>
                  <p className="text-sm text-[var(--text2)] capitalize">{selected.categoria}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={abrirEdicion}
                  disabled={editando}
                  className="px-4 py-2 rounded-lg border border-[var(--primary)] text-[var(--primary)] text-sm font-medium hover:bg-[var(--primary-soft)] disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--hover)] p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {editando ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Nombre *</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Ej. Tabla de Pino 2x4"
                    className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Descripción</label>
                  <textarea
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    rows={2}
                    placeholder="Detalle del producto..."
                    className="w-full p-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Categoría</label>
                    <input
                      type="text"
                      value={form.categoria}
                      onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                      placeholder="Ej. madera, tablero..."
                      className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Precio venta *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.precio}
                      onChange={(e) => setForm({ ...form, precio: e.target.value })}
                      placeholder="0.00"
                      className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5 items-end">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Stock mínimo</label>
                    <input
                      type="number"
                      min="0"
                      value={form.stock_minimo}
                      onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })}
                      className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                    />
                  </div>
                  <label className="flex items-center gap-3 h-12 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.activo}
                      onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                      className="w-5 h-5 accent-[var(--primary)]"
                    />
                    <span className="text-sm font-medium text-[var(--text2)]">Producto activo</span>
                  </label>
                </div>

                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-widest text-[var(--text2)] mb-3">
                    Costos de producción
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(
                      [
                        ['costo', 'Costo base'],
                        ['costo_adquisicion', 'Adquisición'],
                        ['costo_transporte', 'Transporte'],
                        ['costo_empaque', 'Empaque'],
                        ['costo_almacenaje', 'Almacenaje'],
                        ['costo_almacenamiento', 'Almacenamiento'],
                        ['costo_comision', 'Comisión'],
                        ['costo_otros', 'Otros'],
                      ] as [keyof FormState, string][]
                    ).map(([campo, label]) => (
                      <div key={campo} className="space-y-1">
                        <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">{label}</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form[campo] as string}
                          onChange={(e) => setForm({ ...form, [campo]: e.target.value })}
                          placeholder="0.00"
                          className="w-full h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setEditando(false)}
                    className="px-5 py-2.5 text-[var(--text2)] font-medium hover:bg-[var(--blue-header)] rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={guardarEdicion}
                    disabled={guardando}
                    className="px-5 py-2.5 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-deep)] transition-colors flex items-center gap-2"
                  >
                    {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                    Guardar cambios
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selected.descripcion && <p className="text-[var(--text2)] text-sm">{selected.descripcion}</p>}

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-[var(--border)] rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wider text-[var(--text2)] mb-1">Precio Venta</p>
                  <p className="text-2xl font-bold text-[var(--text)]">{dinero(selected.precio)}</p>
                </div>
                <div className="border border-[var(--border)] rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wider text-[var(--text2)] mb-1">Stock actual</p>
                  <p className="text-2xl font-bold text-[var(--primary)]">{selected.stock} uni.</p>
                  <p className="text-xs text-[var(--text2)]">Mínimo: {selected.stock_minimo}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold uppercase tracking-widest text-[var(--text2)] mb-3">
                  Desglose de Costos de Producción
                </h4>
                <div className="border border-[var(--border)] rounded-lg divide-y divide-[var(--border)]/50 overflow-hidden">
                  {desgloseCostos(selected).map((d) => (
                    <div key={d.nombre} className="flex justify-between px-4 py-2.5 text-sm">
                      <span className="text-[var(--text2)]">{d.nombre}</span>
                      <span className="font-medium text-[var(--text)]">{dinero(d.valor)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between px-4 py-3 bg-[var(--field)]">
                    <span className="font-semibold text-[var(--text)]">Costo Total</span>
                    <span className="font-bold text-[var(--text)]">{dinero(costoTotalProducto(selected))}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-[var(--text2)] flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
                    Margen por unidad
                  </span>
                  <span className={`font-bold ${selected.precio - costoTotalProducto(selected) >= 0 ? 'text-[var(--primary)]' : 'text-[var(--danger)]'}`}>
                    {dinero(selected.precio - costoTotalProducto(selected))}
                  </span>
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
                <p className="text-xs text-[var(--text2)] mt-2 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" />
                  Escribí el valor deseado y presioná Aplicar, o usá +/- para ajustar de a uno.
                </p>
              </div>
            </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
