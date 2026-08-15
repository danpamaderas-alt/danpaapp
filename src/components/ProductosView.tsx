import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { costoTotalProducto, desgloseCostos } from '../lib/pedidos';
import type { Database } from '../types';
import {
  TreePine,
  Loader2,
  AlertCircle,
  AlertTriangle,
  X,
  TrendingUp,
  Boxes,
  Pencil,
  Plus,
  Trash2,
  Search,
  BarChart3,
  Coins,
  Percent,
} from 'lucide-react';

type Producto = Database['public']['Tables']['productos']['Row'];

const dinero = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

const pct = (n: number) => `${Number.isFinite(n) ? n.toFixed(1) : '0.0'}%`;

const CAMPOS_COSTO: [keyof FormState, string][] = [
  ['costo', 'Costo base'],
  ['costo_adquisicion', 'Adquisición'],
  ['costo_transporte', 'Transporte'],
  ['costo_empaque', 'Empaque'],
  ['costo_almacenaje', 'Almacenaje'],
  ['costo_almacenamiento', 'Almacenamiento'],
  ['costo_comision', 'Comisión'],
  ['costo_otros', 'Otros'],
];

type FormState = {
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: string;
  stock: string;
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
  stock: '',
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

const num = (s: string) => (Number.isFinite(Number(s)) ? Math.max(0, Number(s)) : 0);

type Tab = 'datos' | 'costos' | 'analisis';

export default function ProductosView() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [tab, setTab] = useState<Tab>('datos');
  const [guardando, setGuardando] = useState(false);
  const [eliminar, setEliminar] = useState<Producto | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [margenObjetivo, setMargenObjetivo] = useState('30');

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
      setError('Error al cargar los productos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const categorias = useMemo(
    () => Array.from(new Set(productos.map((p) => p.categoria).filter(Boolean))).sort(),
    [productos]
  );

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    return productos.filter((p) => {
      if (categoria && p.categoria !== categoria) return false;
      if (q && !`${p.nombre} ${p.descripcion || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [productos, search, categoria]);

  const activos = useMemo(() => productos.filter((p) => p.activo), [productos]);
  const valorCatalogo = useMemo(() => activos.reduce((acc, p) => acc + p.precio, 0), [activos]);
  const costoCatalogo = useMemo(
    () => activos.reduce((acc, p) => acc + costoTotalProducto(p), 0),
    [activos]
  );
  const margenPromedio = useMemo(() => {
    if (valorCatalogo <= 0) return 0;
    return ((valorCatalogo - costoCatalogo) / valorCatalogo) * 100;
  }, [valorCatalogo, costoCatalogo]);
  const stockBajo = useMemo(
    () => productos.filter((p) => p.activo && p.stock <= (p.stock_minimo || 0)),
    [productos]
  );

  const costoForm = CAMPOS_COSTO.reduce((acc, [campo]) => acc + num(form[campo]), 0);
  const precioForm = num(form.precio);
  const margenForm = precioForm - costoForm;
  const margenPctForm = precioForm > 0 ? (margenForm / precioForm) * 100 : 0;
  const markupForm = costoForm > 0 ? (margenForm / costoForm) * 100 : precioForm > 0 ? 100 : 0;
  const precioSugerido = (() => {
    const t = num(margenObjetivo) / 100;
    if (costoForm <= 0 || t >= 1) return 0;
    return costoForm / (1 - t);
  })();

  const abrirNuevo = () => {
    setForm(emptyForm());
    setEditandoId(null);
    setTab('datos');
    setModalOpen(true);
  };

  const abrirEditar = (p: Producto) => {
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      categoria: p.categoria,
      precio: String(p.precio),
      stock: String(p.stock),
      stock_minimo: String(p.stock_minimo ?? 0),
      activo: p.activo,
      costo: String(p.costo ?? 0),
      costo_adquisicion: String(p.costo_adquisicion ?? 0),
      costo_transporte: String(p.costo_transporte ?? 0),
      costo_empaque: String(p.costo_empaque ?? 0),
      costo_almacenaje: String(p.costo_almacenaje ?? 0),
      costo_almacenamiento: String(p.costo_almacenamiento ?? 0),
      costo_comision: String(p.costo_comision ?? 0),
      costo_otros: String(p.costo_otros ?? 0),
    });
    setEditandoId(p.id);
    setTab('datos');
    setModalOpen(true);
  };

  const validar = (): string | null => {
    if (!form.nombre.trim()) return 'Escribí un nombre para el producto.';
    if (precioForm <= 0) return 'El precio de venta debe ser mayor a 0.';
    if (!editandoId && !form.stock.trim()) return 'Escribí el stock inicial.';
    return null;
  };

  const guardar = async () => {
    const err = validar();
    if (err) {
      alert(err);
      return;
    }
    setGuardando(true);
    setError(null);
    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      categoria: form.categoria.trim() || 'general',
      precio: precioForm,
      stock_minimo: num(form.stock_minimo),
      activo: form.activo,
      costo: num(form.costo),
      costo_adquisicion: num(form.costo_adquisicion),
      costo_transporte: num(form.costo_transporte),
      costo_empaque: num(form.costo_empaque),
      costo_almacenaje: num(form.costo_almacenaje),
      costo_almacenamiento: num(form.costo_almacenamiento),
      costo_comision: num(form.costo_comision),
      costo_otros: num(form.costo_otros),
    };
    try {
      if (editandoId) {
        const { error: e } = await supabase.from('productos').update(payload).eq('id', editandoId);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from('productos').insert({ ...payload, stock: num(form.stock) });
        if (e) throw e;
      }
      setModalOpen(false);
      await cargarProductos();
    } catch (e: any) {
      console.error(e);
      setError('Error al guardar el producto: ' + (e?.message || ''));
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = (p: Producto) => setEliminar(p);

  const eliminarProducto = async () => {
    if (!eliminar) return;
    setEliminando(true);
    try {
      const { count, error: cErr } = await supabase
        .from('pedido_items')
        .select('*', { count: 'exact', head: true })
        .eq('producto_id', eliminar.id);
      if (cErr) throw cErr;
      if ((count ?? 0) > 0) {
        alert(`No se puede eliminar "${eliminar.nombre}": ya fue usado en ${count} pedido(s). Podés desactivarlo en la edición en su lugar.`);
        setEliminar(null);
        return;
      }
      const { error: e } = await supabase.from('productos').delete().eq('id', eliminar.id);
      if (e) throw e;
      setProductos((prev) => prev.filter((p) => p.id !== eliminar.id));
      setEliminar(null);
    } catch (e: any) {
      console.error(e);
      alert('Error al eliminar el producto: ' + (e?.message || ''));
    } finally {
      setEliminando(false);
    }
  };

  const inputCls =
    'w-full h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]';

  const tabs: { id: Tab; label: string; Icon: typeof Boxes }[] = [
    { id: 'datos', label: 'Datos', Icon: Boxes },
    { id: 'costos', label: 'Costos', Icon: Coins },
    { id: 'analisis', label: 'Análisis de costos', Icon: BarChart3 },
  ];

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-[1440px] mx-auto w-full">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text)] tracking-tight">Productos</h2>
          <p className="text-[var(--text2)] mt-1">Catálogo, precios y análisis de costos de producción.</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="bg-[var(--primary)] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--primary-deep)] transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nuevo Producto
        </button>
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
            <TreePine className="w-5 h-5 text-[var(--text)]" />
          </div>
          <h3 className="text-[var(--text2)] text-xs font-semibold uppercase tracking-wider mb-1">Productos Activos</h3>
          <div className="text-3xl font-bold text-[var(--text)]">{activos.length}</div>
          <p className="text-[var(--text2)] text-sm mt-2">De {productos.length} totales.</p>
        </div>

        <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)]">
          <div className="p-2 bg-[var(--primary-soft)] rounded-lg w-fit mb-4">
            <TrendingUp className="w-5 h-5 text-[var(--primary-green)]" />
          </div>
          <h3 className="text-[var(--text2)] text-xs font-semibold uppercase tracking-wider mb-1">Valor del Catálogo</h3>
          <div className="text-3xl font-bold text-[var(--text)]">{dinero(valorCatalogo)}</div>
          <p className="text-[var(--text2)] text-sm mt-2">Suma de precios de venta.</p>
        </div>

        <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)]">
          <div className="p-2 bg-[var(--gray-soft)] rounded-lg w-fit mb-4">
            <Coins className="w-5 h-5 text-[var(--text)]" />
          </div>
          <h3 className="text-[var(--text2)] text-xs font-semibold uppercase tracking-wider mb-1">Costo del Catálogo</h3>
          <div className="text-3xl font-bold text-[var(--text)]">{dinero(costoCatalogo)}</div>
          <p className="text-[var(--text2)] text-sm mt-2">Suma de costos de producción.</p>
        </div>

        <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)]">
          <div className="p-2 bg-[var(--amber-soft2)] rounded-lg w-fit mb-4">
            <Percent className="w-5 h-5 text-[var(--amber-text2)]" />
          </div>
          <h3 className="text-[var(--text2)] text-xs font-semibold uppercase tracking-wider mb-1">Margen Promedio</h3>
          <div className={`text-3xl font-bold ${margenPromedio >= 0 ? 'text-[var(--primary)]' : 'text-[var(--danger)]'}`}>
            {pct(margenPromedio)}
          </div>
          <p className="text-[var(--text2)] text-sm mt-2">{stockBajo.length} con stock bajo.</p>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--text2)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o descripción..."
            className="w-full h-11 pl-10 pr-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--surface)]"
          />
        </div>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="h-11 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] bg-[var(--surface)] text-[var(--text)] sm:w-56"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text2)]">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-[var(--primary)]" />
          <p>Cargando productos...</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-12 text-center text-[var(--text2)]">
          <TreePine className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[var(--text)] mb-2">Sin resultados</h3>
          <p>{productos.length === 0 ? 'Agregá el primer producto con el botón "Nuevo Producto".' : 'No hay productos que coincidan con la búsqueda.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtrados.map((p) => {
            const costo = costoTotalProducto(p);
            const margen = p.precio - costo;
            const margenPct = p.precio > 0 ? (margen / p.precio) * 100 : 0;
            const bajo = p.activo && p.stock <= (p.stock_minimo || 0);
            return (
              <div
                key={p.id}
                className={`bg-[var(--surface)] rounded-xl border p-6 hover:shadow-md transition-shadow ${
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

                <p className="text-xs text-[var(--text2)] capitalize mb-4">{p.categoria}</p>

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

                <div className="border-t border-[var(--blue-header)] pt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text2)]">Costo total</span>
                    <span className="font-semibold text-[var(--text)]">{dinero(costo)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text2)]">Margen</span>
                    <span className={`font-semibold ${margen >= 0 ? 'text-[var(--primary)]' : 'text-[var(--danger)]'}`}>
                      {dinero(margen)} ({pct(margenPct)})
                    </span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden bg-[var(--gray-soft)] mt-1">
                    <div
                      className="bg-[var(--text2)]/70"
                      style={{ width: `${Math.min(100, (costo / p.precio) * 100)}%` }}
                      title={`Costo: ${dinero(costo)}`}
                    />
                    <div
                      className={margen >= 0 ? 'bg-[var(--primary)]' : 'bg-[var(--danger)]'}
                      style={{ width: `${Math.max(0, 100 - Math.min(100, (costo / p.precio) * 100))}%` }}
                      title={`Margen: ${dinero(margen)}`}
                    />
                  </div>
                </div>

                {bajo && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[var(--amber-text2)]">
                    <AlertTriangle className="w-4 h-4" />
                    Stock bajo (mín. {p.stock_minimo})
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-[var(--blue-header)] flex items-center gap-2">
                  <button
                    onClick={() => abrirEditar(p)}
                    className="flex-1 px-4 py-2 text-[var(--primary)] text-sm font-medium hover:bg-[var(--primary-soft)] rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => confirmarEliminar(p)}
                    className="px-4 py-2 text-[var(--danger)] text-sm font-medium hover:bg-[var(--danger-soft)] rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-[var(--overlay)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-start bg-[var(--field)]">
              <div>
                <h3 className="text-xl font-bold text-[var(--text)] tracking-tight">
                  {editandoId ? 'Editar Producto' : 'Nuevo Producto'}
                </h3>
                <p className="text-sm text-[var(--text2)] mt-0.5">{form.nombre || 'Completá los datos del producto.'}</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--hover)] p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 pt-4 flex gap-2 border-b border-[var(--border)]">
              {tabs.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors ${
                    tab === id
                      ? 'bg-[var(--surface)] text-[var(--primary)] border border-b-0 border-[var(--border)] -mb-px'
                      : 'text-[var(--text2)] hover:text-[var(--text)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {tab === 'datos' && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Nombre *</label>
                    <input
                      type="text"
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      placeholder="Ej. Tabla de Pino 2x4"
                      className={inputCls}
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
                        list="categorias-productos"
                        className={inputCls}
                      />
                      <datalist id="categorias-productos">
                        {categorias.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
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
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5 items-end">
                    {!editandoId && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Stock inicial *</label>
                        <input
                          type="number"
                          min="0"
                          value={form.stock}
                          onChange={(e) => setForm({ ...form, stock: e.target.value })}
                          placeholder="0"
                          className={inputCls}
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Stock mínimo</label>
                      <input
                        type="number"
                        min="0"
                        value={form.stock_minimo}
                        onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <label className="flex items-center gap-3 h-11 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.activo}
                        onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                        className="w-5 h-5 accent-[var(--primary)]"
                      />
                      <span className="text-sm font-medium text-[var(--text2)]">Producto activo</span>
                    </label>
                  </div>
                </div>
              )}

              {tab === 'costos' && (
                <div>
                  <p className="text-sm text-[var(--text2)] mb-4">
                    Costos que componen el producto. El <strong className="text-[var(--text)]">costo total</strong> se calcula automáticamente.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {CAMPOS_COSTO.map(([campo, label]) => (
                      <div key={campo} className="space-y-1">
                        <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">{label}</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form[campo] as string}
                          onChange={(e) => setForm({ ...form, [campo]: e.target.value })}
                          placeholder="0.00"
                          className={inputCls}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 bg-[var(--field)] border border-[var(--border)] rounded-lg p-4 flex justify-between items-center">
                    <span className="font-semibold text-[var(--text)]">Costo total</span>
                    <span className="text-xl font-bold text-[var(--text)]">{dinero(costoForm)}</span>
                  </div>
                </div>
              )}

              {tab === 'analisis' && (
                <div className="space-y-6">
                  <div className="border border-[var(--border)] rounded-lg divide-y divide-[var(--border)]/50 overflow-hidden">
                    {desgloseCostos({
                      id: '',
                      nombre: form.nombre,
                      descripcion: null,
                      precio: precioForm,
                      stock: 0,
                      activo: true,
                      imagen_url: null,
                      categoria: form.categoria,
                      stock_minimo: num(form.stock_minimo),
                      costo: num(form.costo),
                      costo_adquisicion: num(form.costo_adquisicion),
                      costo_transporte: num(form.costo_transporte),
                      costo_empaque: num(form.costo_empaque),
                      costo_almacenaje: num(form.costo_almacenaje),
                      costo_almacenamiento: num(form.costo_almacenamiento),
                      costo_comision: num(form.costo_comision),
                      costo_otros: num(form.costo_otros),
                      created_at: '',
                    } as Producto).map((d) => (
                      <div key={d.nombre} className="flex justify-between px-4 py-2.5 text-sm">
                        <span className="text-[var(--text2)]">{d.nombre}</span>
                        <span className="font-medium text-[var(--text)]">{dinero(d.valor)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between px-4 py-3 bg-[var(--field)]">
                      <span className="font-semibold text-[var(--text)]">Costo Total</span>
                      <span className="font-bold text-[var(--text)]">{dinero(costoForm)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="border border-[var(--border)] rounded-lg p-4">
                      <p className="text-xs uppercase tracking-wider text-[var(--text2)] mb-1">Precio Venta</p>
                      <p className="text-xl font-bold text-[var(--text)]">{dinero(precioForm)}</p>
                    </div>
                    <div className="border border-[var(--border)] rounded-lg p-4">
                      <p className="text-xs uppercase tracking-wider text-[var(--text2)] mb-1">Margen bruto</p>
                      <p className={`text-xl font-bold ${margenForm >= 0 ? 'text-[var(--primary)]' : 'text-[var(--danger)]'}`}>{dinero(margenForm)}</p>
                    </div>
                    <div className="border border-[var(--border)] rounded-lg p-4">
                      <p className="text-xs uppercase tracking-wider text-[var(--text2)] mb-1">% sobre precio</p>
                      <p className={`text-xl font-bold ${margenPctForm >= 0 ? 'text-[var(--primary)]' : 'text-[var(--danger)]'}`}>{pct(margenPctForm)}</p>
                    </div>
                    <div className="border border-[var(--border)] rounded-lg p-4">
                      <p className="text-xs uppercase tracking-wider text-[var(--text2)] mb-1">Markup sobre costo</p>
                      <p className={`text-xl font-bold ${markupForm >= 0 ? 'text-[var(--primary)]' : 'text-[var(--danger)]'}`}>{pct(markupForm)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[var(--text)] mb-2">Composición del precio</p>
                    <div className="flex h-4 rounded-full overflow-hidden bg-[var(--gray-soft)]">
                      <div
                        className="bg-[var(--text2)]/70"
                        style={{ width: `${Math.min(100, precioForm > 0 ? (costoForm / precioForm) * 100 : 0)}%` }}
                        title={`Costo: ${dinero(costoForm)}`}
                      />
                      <div
                        className={margenForm >= 0 ? 'bg-[var(--primary)]' : 'bg-[var(--danger)]'}
                        style={{ width: `${Math.max(0, precioForm > 0 ? 100 - (costoForm / precioForm) * 100 : 0)}%` }}
                        title={`Margen: ${dinero(margenForm)}`}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-[var(--text2)]">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[var(--text2)]/70" /> Costo ({pct(precioForm > 0 ? (costoForm / precioForm) * 100 : 0)})</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[var(--primary)]" /> Margen ({pct(margenPctForm)})</span>
                    </div>
                  </div>

                  <div className="bg-[var(--blue-soft)] border border-[var(--border)] rounded-lg p-4">
                    <p className="text-sm font-semibold text-[var(--text)] mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[var(--primary)]" />
                      Precio sugerido por margen objetivo
                    </p>
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Margen objetivo (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="90"
                          value={margenObjetivo}
                          onChange={(e) => setMargenObjetivo(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Precio sugerido</label>
                        <p className={`text-xl font-bold ${precioSugerido > 0 ? 'text-[var(--primary)]' : 'text-[var(--text2)]'}`}>
                          {precioSugerido > 0 ? dinero(precioSugerido) : '—'}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text2)] mt-2">
                      Con costo {dinero(costoForm)} y {margenObjetivo}% de margen, el precio de venta debería ser {precioSugerido > 0 ? dinero(precioSugerido) : '—'}.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--field)] flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 text-[var(--text2)] font-medium hover:bg-[var(--blue-header)] rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={guardando}
                className="px-5 py-2.5 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-deep)] transition-colors flex items-center gap-2"
              >
                {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                {editandoId ? 'Guardar cambios' : 'Crear producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {eliminar && (
        <div className="fixed inset-0 bg-[var(--overlay)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-[var(--danger-soft)] rounded-lg flex-shrink-0">
                <Trash2 className="w-5 h-5 text-[var(--danger)]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text)]">Eliminar producto</h3>
                <p className="text-sm text-[var(--text2)] mt-1">
                  ¿Seguro que querés eliminar <strong className="text-[var(--text)]">{eliminar.nombre}</strong>? Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEliminar(null)}
                className="px-5 py-2.5 text-[var(--text2)] font-medium hover:bg-[var(--blue-header)] rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarProducto}
                disabled={eliminando}
                className="px-5 py-2.5 bg-[var(--danger)] text-white font-medium rounded-lg hover:bg-[var(--danger-deep)] transition-colors flex items-center gap-2"
              >
                {eliminando && <Loader2 className="w-4 h-4 animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
