import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchPodas,
  crearPoda,
  actualizarPoda,
  eliminarPoda,
  TIPOS_ARBOL,
  TIPOS_PODA,
  etiquetaTipoPoda,
  type Poda,
  type PodaInput,
} from '../lib/podas';
import { formatDate, hoyISO, getErrorMessage } from '../lib/format';
import {
  Scissors,
  Trees,
  ClipboardList,
  CalendarDays,
  Loader2,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  X,
  MapPin,
} from 'lucide-react';

interface PodasViewProps {
  corredorId: string;
}

interface FormState {
  id?: string;
  cantidad_arboles: string;
  detalle: string;
  tipo_arbol: string;
  tipo_poda: string;
  lugar: string;
  fecha: string;
  notas: string;
}

const emptyForm = (): FormState => ({
  cantidad_arboles: '',
  detalle: '',
  tipo_arbol: '',
  tipo_poda: '',
  lugar: '',
  fecha: hoyISO(),
  notas: '',
});

const opcionesTipoArbol = (podas: Poda[]) => {
  const set = new Set<string>(TIPOS_ARBOL);
  podas.forEach((p) => {
    if (p.tipo_arbol) set.add(p.tipo_arbol);
  });
  return Array.from(set);
};

const estiloTipoPoda: Record<string, { fondo: string; texto: string; barra: string }> = {
  de_altura: { fondo: 'bg-[var(--primary-soft)]', texto: 'text-[var(--primary-deep)]', barra: 'bg-[var(--primary)]' },
  al_ras: { fondo: 'bg-[var(--amber-soft2)]', texto: 'text-[var(--amber-text2)]', barra: 'bg-[var(--amber-text2)]' },
  extraccion: { fondo: 'bg-[var(--danger-soft)]', texto: 'text-[var(--danger-deep)]', barra: 'bg-[var(--danger)]' },
};

export default function PodasView({ corredorId }: PodasViewProps) {
  const [podas, setPodas] = useState<Poda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [tipoPoda, setTipoPoda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [guardando, setGuardando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState<Poda | null>(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPodas(corredorId, {
        desde: desde || undefined,
        hasta: hasta || undefined,
        tipoPoda: tipoPoda || undefined,
      });
      setPodas(data);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, 'Error al cargar las podas.'));
    } finally {
      setLoading(false);
    }
  }, [corredorId, desde, hasta, tipoPoda]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const totalArboles = useMemo(
    () => podas.reduce((a, p) => a + (p.cantidad_arboles || 0), 0),
    [podas]
  );
  const promedio = useMemo(
    () => (podas.length > 0 ? Math.round(totalArboles / podas.length) : 0),
    [podas, totalArboles]
  );
  const ultimo = useMemo(() => podas[0]?.fecha || null, [podas]);

  const podasPorTipo = useMemo(
    () =>
      TIPOS_PODA.map((t) => {
        const lista = podas.filter((p) => p.tipo_poda === t.valor);
        return {
          ...t,
          trabajos: lista.length,
          arboles: lista.reduce((a, p) => a + (p.cantidad_arboles || 0), 0),
        };
      }),
    [podas]
  );
  const podasSinTipo = useMemo(() => podas.filter((p) => !p.tipo_poda), [podas]);
  const maxArbolesTipo = Math.max(1, ...podasPorTipo.map((t) => t.arboles));

  const tipos = useMemo(() => opcionesTipoArbol(podas), [podas]);

  const kpi = [
    {
      label: 'Árboles podados',
      valor: String(totalArboles),
      clase: 'text-[var(--primary)]',
      Icon: Trees,
      fondo: 'bg-[var(--primary-soft)]',
      iconColor: 'text-[var(--primary-green)]',
    },
    {
      label: 'Trabajos registrados',
      valor: String(podas.length),
      clase: 'text-[var(--text)]',
      Icon: ClipboardList,
      fondo: 'bg-[var(--gray-soft)]',
      iconColor: 'text-[var(--text)]',
    },
    {
      label: 'Promedio por trabajo',
      valor: String(promedio),
      clase: 'text-[var(--text)]',
      Icon: Scissors,
      fondo: 'bg-[var(--blue-soft)]',
      iconColor: 'text-[var(--primary)]',
    },
    {
      label: 'Fecha más reciente',
      valor: ultimo ? formatDate(ultimo) : '—',
      clase: 'text-[var(--text)]',
      Icon: CalendarDays,
      fondo: 'bg-[var(--amber-soft)]',
      iconColor: 'text-[var(--amber-text)]',
    },
  ];

  const abrirNuevo = () => {
    setForm(emptyForm());
    setModalOpen(true);
  };

  const abrirEdicion = (p: Poda) => {
    setForm({
      id: p.id,
      cantidad_arboles: String(p.cantidad_arboles ?? 0),
      detalle: p.detalle,
      tipo_arbol: p.tipo_arbol || '',
      tipo_poda: p.tipo_poda || '',
      lugar: p.lugar || '',
      fecha: p.fecha.slice(0, 10),
      notas: p.notas || '',
    });
    setModalOpen(true);
  };

  const guardar = async () => {
    const cantidad = Number(form.cantidad_arboles);
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      alert('Ingresá una cantidad de árboles válida (mayor a 0).');
      return;
    }
    if (!form.detalle.trim()) {
      alert('Contá qué trabajo se realizó.');
      return;
    }
    if (!form.fecha) {
      alert('Elegí una fecha.');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const input: PodaInput = {
        corredor_id: corredorId,
        cantidad_arboles: cantidad,
        detalle: form.detalle.trim(),
        tipo_arbol: form.tipo_arbol.trim() || undefined,
        tipo_poda: form.tipo_poda || undefined,
        lugar: form.lugar.trim() || undefined,
        fecha: form.fecha,
        notas: form.notas.trim() || undefined,
      };
      if (form.id) {
        await actualizarPoda(form.id, input);
      } else {
        await crearPoda(input);
      }
      setModalOpen(false);
      await cargar();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  };

  const confirmarBorrado = async () => {
    if (!confirmarEliminar) return;
    setGuardando(true);
    try {
      await eliminarPoda(confirmarEliminar.id);
      setConfirmarEliminar(null);
      await cargar();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-[1440px] mx-auto w-full">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text)] tracking-tight">Podas de Árboles</h2>
          <p className="text-[var(--text2)] mt-1">Registrá la cantidad de árboles podados, el trabajo realizado y la fecha.</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="bg-[var(--primary)] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--primary-deep)] transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Registrar Poda
        </button>
      </div>

      {error && (
        <div className="bg-[var(--danger-soft)] text-[var(--danger-deep)] p-4 rounded-xl flex items-start gap-4 mb-8">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading && podas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-[var(--text2)]">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-[var(--primary)]" />
          <p>Cargando podas...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {kpi.map((k) => (
              <div key={k.label} className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)]">
                <div className={`p-2 rounded-lg w-fit mb-4 ${k.fondo}`}>
                  <k.Icon className={`w-5 h-5 ${k.iconColor}`} />
                </div>
                <h3 className="text-[var(--text2)] text-xs font-semibold uppercase tracking-wider mb-1">{k.label}</h3>
                <div className={`text-3xl font-bold ${k.clase}`}>{k.valor}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {podasPorTipo.map((t, i) => {
              const esActivo = tipoPoda === t.valor;
              const est = estiloTipoPoda[t.valor] || { fondo: 'bg-[var(--gray-soft)]', texto: 'text-[var(--text)]', barra: 'bg-[var(--text2)]' };
              const Icon = [Trees, Scissors, Trash2][i];
              return (
                <button
                  key={t.valor}
                  onClick={() => setTipoPoda(esActivo ? '' : t.valor)}
                  title={esActivo ? 'Quitar filtro' : `Filtrar por ${t.etiqueta.toLowerCase()}`}
                  className={`bg-[var(--surface)] p-6 rounded-xl border text-left transition-all hover:shadow-md ${
                    esActivo ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/30' : 'border-[var(--border)]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2 rounded-lg w-fit ${est.fondo}`}>
                      <Icon className={`w-5 h-5 ${est.texto}`} />
                    </div>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text2)]">
                      {t.trabajos} {t.trabajos === 1 ? 'trabajo' : 'trabajos'}
                    </span>
                  </div>
                  <div className={`text-3xl font-bold ${est.texto}`}>{t.arboles}</div>
                  <p className="text-[var(--text2)] text-xs font-semibold uppercase tracking-wider mt-1">{t.etiqueta}</p>
                  <div className="h-2 bg-[var(--blue-header)] rounded-full overflow-hidden mt-4">
                    <div
                      className={`h-full ${est.barra} rounded-full transition-all duration-500`}
                      style={{ width: `${(t.arboles / maxArbolesTipo) * 100}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {podasSinTipo.length > 0 && (
            <p className="text-xs text-[var(--text2)] -mt-4 mb-8">
              {podasSinTipo.length} {podasSinTipo.length === 1 ? 'trabajo tiene' : 'trabajos tienen'} tipo de poda sin especificar (
              {podasSinTipo.reduce((a, p) => a + (p.cantidad_arboles || 0), 0)} árboles).
            </p>
          )}

          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 mb-8">
            <div className="flex items-center gap-2 mb-4 text-[var(--text)]">
              <CalendarDays className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Filtros</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-2xl">
              <div>
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Desde</label>
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)] mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Hasta</label>
                <input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)] mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Tipo de poda</label>
                <select
                  value={tipoPoda}
                  onChange={(e) => setTipoPoda(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)] mt-1"
                >
                  <option value="">Todos</option>
                  {TIPOS_PODA.map((t) => (
                    <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                {(desde || hasta || tipoPoda) && (
                  <button
                    onClick={() => {
                      setDesde('');
                      setHasta('');
                      setTipoPoda('');
                    }}
                    className="h-11 text-sm text-[var(--primary)] font-medium hover:underline"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="text-lg font-semibold text-[var(--text)]">Registro de Podas</h3>
              <span className="text-sm text-[var(--text2)]">{podas.length} {podas.length === 1 ? 'trabajo' : 'trabajos'}</span>
            </div>
            <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
              <table className="w-full text-left border-collapse min-w-[680px]">
                <thead className="sticky top-0 bg-[var(--blue-header)]">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Fecha</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Árboles</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Tipo</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Qué se realizó</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Lugar</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)] text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {podas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-[var(--text2)]">
                        <Scissors className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">No hay podas registradas</p>
                        <p className="text-sm mt-1">Registrá un trabajo para llevar el control.</p>
                      </td>
                    </tr>
                  ) : (
                    podas.map((p) => (
                      <tr key={p.id} className="hover:bg-[var(--field)] transition-colors">
                        <td className="px-6 py-3.5 text-[var(--text2)] text-sm whitespace-nowrap">{formatDate(p.fecha)}</td>
                        <td className="px-6 py-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--primary-soft)] text-[var(--primary-deep)]">
                            <Trees className="w-3.5 h-3.5" />
                            {p.cantidad_arboles}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          {p.tipo_arbol ? (
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--blue-header)] text-[var(--text2)]">
                              {p.tipo_arbol}
                            </span>
                          ) : (
                            <span className="text-sm text-[var(--muted)]">—</span>
                          )}
                          {p.tipo_poda && (
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--amber-soft)] text-[var(--amber-text)] mt-1">
                              {etiquetaTipoPoda(p.tipo_poda)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          <p className="font-medium text-[var(--text)]">{p.detalle}</p>
                          {p.notas && <p className="text-xs text-[var(--text2)] line-clamp-1">{p.notas}</p>}
                        </td>
                        <td className="px-6 py-3.5">
                          {p.lugar ? (
                            <span className="inline-flex items-center gap-1.5 text-sm text-[var(--text)]">
                              <MapPin className="w-4 h-4 text-[var(--text2)]" />
                              {p.lugar}
                            </span>
                          ) : (
                            <span className="text-sm text-[var(--muted)]">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => abrirEdicion(p)}
                            className="p-2 text-[var(--text2)] hover:text-[var(--primary)] hover:bg-[var(--primary-soft)] rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmarEliminar(p)}
                            className="p-2 text-[var(--text2)] hover:text-[var(--danger-deep)] hover:bg-[var(--danger-soft)] rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-[var(--overlay)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--field)]">
              <h3 className="text-xl font-bold text-[var(--text)]">{form.id ? 'Editar Poda' : 'Registrar Poda'}</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--hover)] p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Cantidad de árboles *</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.cantidad_arboles}
                    onChange={(e) => setForm({ ...form, cantidad_arboles: e.target.value })}
                    placeholder="Ej. 25"
                    className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Fecha *</label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Qué se realizó *</label>
                <input
                  type="text"
                  value={form.detalle}
                  onChange={(e) => setForm({ ...form, detalle: e.target.value })}
                  placeholder="Ej. Poda y desrame de fresnos"
                  className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Tipo de árbol</label>
                <select
                  value={form.tipo_arbol && !tipos.includes(form.tipo_arbol) ? '__otro__' : form.tipo_arbol}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm({ ...form, tipo_arbol: v === '__otro__' ? form.tipo_arbol : v });
                  }}
                  className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                >
                  <option value="">— Sin especificar —</option>
                  {tipos.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value="__otro__">Otro (escribir)...</option>
                </select>
                {form.tipo_arbol && !tipos.includes(form.tipo_arbol) && (
                  <input
                    type="text"
                    value={form.tipo_arbol}
                    onChange={(e) => setForm({ ...form, tipo_arbol: e.target.value })}
                    placeholder="Tipo de árbol"
                    className="w-full h-12 px-4 mt-2 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Tipo de poda</label>
                <select
                  value={form.tipo_poda}
                  onChange={(e) => setForm({ ...form, tipo_poda: e.target.value })}
                  className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                >
                  <option value="">— Sin especificar —</option>
                  {TIPOS_PODA.map((t) => (
                    <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Lugar</label>
                <input
                  type="text"
                  value={form.lugar}
                  onChange={(e) => setForm({ ...form, lugar: e.target.value })}
                  placeholder="Ej. Plaza San Martín"
                  className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Notas</label>
                <textarea
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  rows={3}
                  placeholder="Detalles opcionales..."
                  className="w-full p-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[var(--blue-header)]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 text-[var(--text2)] font-medium hover:bg-[var(--blue-header)] rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardar}
                  disabled={guardando}
                  className="px-5 py-2.5 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-deep)] transition-colors flex items-center gap-2"
                >
                  {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmarEliminar && (
        <div className="fixed inset-0 bg-[var(--overlay)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
            <Trash2 className="w-12 h-12 text-[var(--danger)] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[var(--text)] mb-2">¿Eliminar registro?</h3>
            <p className="text-sm text-[var(--text2)] mb-6">
              Se borrará la poda del {formatDate(confirmarEliminar.fecha)} ({confirmarEliminar.cantidad_arboles} árboles).
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setConfirmarEliminar(null)}
                className="px-5 py-2.5 text-[var(--text2)] font-medium hover:bg-[var(--blue-header)] rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarBorrado}
                disabled={guardando}
                className="px-5 py-2.5 bg-[var(--danger)] text-white font-medium rounded-lg hover:bg-[var(--danger-deep)] transition-colors flex items-center gap-2"
              >
                {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}