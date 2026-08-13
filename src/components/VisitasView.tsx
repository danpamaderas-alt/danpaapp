import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchVisitas,
  crearVisita,
  actualizarVisita,
  eliminarVisita,
  ESTADOS_VISITA,
  etiquetaEstado,
  type Visita,
  type VisitaInput,
} from '../lib/visitas';
import { supabase } from '../lib/supabase';
import type { Database } from '../types';
import { formatDate, hoyISO, getErrorMessage } from '../lib/format';
import {
  CalendarCheck2,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  X,
  MapPin,
  Navigation,
  User,
} from 'lucide-react';

type Cliente = Database['public']['Tables']['clientes']['Row'];

interface VisitasViewProps {
  corredorId: string;
}

interface FormState {
  id?: string;
  cliente_id: string;
  fecha: string;
  estado: string;
  latitud: string;
  longitud: string;
}

const emptyForm = (): FormState => ({
  cliente_id: '',
  fecha: hoyISO(),
  estado: 'pendiente',
  latitud: '',
  longitud: '',
});

const estadoBadge = (estado: string) => {
  switch (estado) {
    case 'realizada':
      return 'bg-[var(--primary-soft)] text-[var(--primary-deep)]';
    case 'cancelada':
      return 'bg-[var(--gray-soft)] text-[var(--text2)]';
    default:
      return 'bg-[var(--amber-soft)] text-[var(--amber-text)]';
  }
};

export default function VisitasView({ corredorId }: VisitasViewProps) {
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [estado, setEstado] = useState('');
  const [clienteFiltro, setClienteFiltro] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [guardando, setGuardando] = useState(false);
  const [ubicando, setUbicando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState<Visita | null>(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchVisitas(corredorId, {
        desde: desde || undefined,
        hasta: hasta || undefined,
        estado: estado || undefined,
        clienteId: clienteFiltro || undefined,
      });
      setVisitas(data);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, 'Error al cargar las visitas.'));
    } finally {
      setLoading(false);
    }
  }, [corredorId, desde, hasta, estado, clienteFiltro]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cargarClientes = useCallback(async () => {
    try {
      const { data, error: e } = await supabase
        .from('clientes')
        .select('*')
        .eq('corredor_id', corredorId)
        .order('nombre', { ascending: true });
      if (!e) setClientes((data as Cliente[]) || []);
    } catch {
      setClientes([]);
    }
  }, [corredorId]);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  const clientesPorId = useMemo(
    () => new Map(clientes.map((c) => [c.id, c])),
    [clientes]
  );

  const contadores = useMemo(() => {
    const total = visitas.length;
    const realizada = visitas.filter((v) => v.estado === 'realizada').length;
    const pendiente = visitas.filter((v) => v.estado === 'pendiente').length;
    const cancelada = visitas.filter((v) => v.estado === 'cancelada').length;
    return { total, realizada, pendiente, cancelada };
  }, [visitas]);

  const kpi = [
    {
      label: 'Total Visitas',
      valor: String(contadores.total),
      clase: 'text-[var(--text)]',
      Icon: CalendarCheck2,
      fondo: 'bg-[var(--gray-soft)]',
      iconColor: 'text-[var(--text)]',
    },
    {
      label: 'Realizadas',
      valor: String(contadores.realizada),
      clase: 'text-[var(--primary)]',
      Icon: CheckCircle2,
      fondo: 'bg-[var(--primary-soft)]',
      iconColor: 'text-[var(--primary-green)]',
    },
    {
      label: 'Pendientes',
      valor: String(contadores.pendiente),
      clase: 'text-[var(--amber-text)]',
      Icon: Clock,
      fondo: 'bg-[var(--amber-soft)]',
      iconColor: 'text-[var(--amber-text)]',
    },
    {
      label: 'Canceladas',
      valor: String(contadores.cancelada),
      clase: 'text-[var(--text2)]',
      Icon: XCircle,
      fondo: 'bg-[var(--gray-soft)]',
      iconColor: 'text-[var(--text2)]',
    },
  ];

  const abrirNuevo = () => {
    setForm(emptyForm());
    setModalOpen(true);
  };

  const abrirEdicion = (v: Visita) => {
    setForm({
      id: v.id,
      cliente_id: v.cliente_id || '',
      fecha: v.fecha.slice(0, 10),
      estado: v.estado,
      latitud: v.latitud != null ? String(v.latitud) : '',
      longitud: v.longitud != null ? String(v.longitud) : '',
    });
    setModalOpen(true);
  };

  const capturarUbicacion = () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no está disponible en este navegador.');
      return;
    }
    setUbicando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitud: String(pos.coords.latitude),
          longitud: String(pos.coords.longitude),
        }));
        setUbicando(false);
      },
      () => {
        alert('No se pudo obtener la ubicación. Verificá los permisos del navegador.');
        setUbicando(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const guardar = async () => {
    if (!form.cliente_id) {
      alert('Elegí un cliente.');
      return;
    }
    if (!form.fecha) {
      alert('Elegí una fecha.');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const input: VisitaInput = {
        corredor_id: corredorId,
        cliente_id: form.cliente_id,
        fecha: form.fecha,
        estado: form.estado,
        latitud: form.latitud ? Number(form.latitud) : null,
        longitud: form.longitud ? Number(form.longitud) : null,
      };
      if (form.id) {
        await actualizarVisita(form.id, input);
      } else {
        await crearVisita(input);
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
      await eliminarVisita(confirmarEliminar.id);
      setConfirmarEliminar(null);
      await cargar();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  };

  const hayFiltros = Boolean(desde || hasta || estado || clienteFiltro);

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-[1440px] mx-auto w-full">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text)] tracking-tight">Visitas</h2>
          <p className="text-[var(--text2)] mt-1">Registrá y seguí las visitas a tus clientes.</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="bg-[var(--primary)] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--primary-deep)] transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Registrar Visita
        </button>
      </div>

      {error && (
        <div className="bg-[var(--danger-soft)] text-[var(--danger-deep)] p-4 rounded-xl flex items-start gap-4 mb-8">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading && visitas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-[var(--text2)]">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-[var(--primary)]" />
          <p>Cargando visitas...</p>
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

          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 mb-8">
            <div className="flex items-center gap-2 mb-4 text-[var(--text)]">
              <User className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Filtros</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Estado</label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)] mt-1"
                >
                  <option value="">Todos</option>
                  {ESTADOS_VISITA.map((s) => (
                    <option key={s} value={s}>
                      {etiquetaEstado(s)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Cliente</label>
                <select
                  value={clienteFiltro}
                  onChange={(e) => setClienteFiltro(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)] mt-1"
                >
                  <option value="">Todos</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {hayFiltros && (
              <button
                onClick={() => {
                  setDesde('');
                  setHasta('');
                  setEstado('');
                  setClienteFiltro('');
                }}
                className="mt-4 text-sm text-[var(--primary)] font-medium hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="text-lg font-semibold text-[var(--text)]">Historial de Visitas</h3>
              <span className="text-sm text-[var(--text2)]">{visitas.length} visitas</span>
            </div>
            <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
              <table className="w-full text-left border-collapse min-w-[680px]">
                <thead className="sticky top-0 bg-[var(--blue-header)]">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Fecha</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Cliente</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Estado</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Ubicación</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)] text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {visitas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[var(--text2)]">
                        <CalendarCheck2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">No hay visitas registradas</p>
                        <p className="text-sm mt-1">Registrá una visita para comenzar a llevar el control.</p>
                      </td>
                    </tr>
                  ) : (
                    visitas.map((v) => {
                      const cliente = v.cliente_id ? clientesPorId.get(v.cliente_id) : undefined;
                      return (
                        <tr key={v.id} className="hover:bg-[var(--field)] transition-colors">
                          <td className="px-6 py-3.5 text-[var(--text2)] text-sm whitespace-nowrap">{formatDate(v.fecha)}</td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
                              <span className="font-medium text-[var(--text)]">{cliente?.nombre || '—'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoBadge(v.estado)}`}>
                              {etiquetaEstado(v.estado)}
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            {v.latitud != null && v.longitud != null ? (
                              <span className="inline-flex items-center gap-1 text-sm text-[var(--primary)]">
                                <MapPin className="w-4 h-4" />
                                Grabada
                              </span>
                            ) : (
                              <span className="text-sm text-[var(--muted)]">Sin ubicación</span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => abrirEdicion(v)}
                              className="p-2 text-[var(--text2)] hover:text-[var(--primary)] hover:bg-[var(--primary-soft)] rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmarEliminar(v)}
                              className="p-2 text-[var(--text2)] hover:text-[var(--danger-deep)] hover:bg-[var(--danger-soft)] rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
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
              <h3 className="text-xl font-bold text-[var(--text)]">{form.id ? 'Editar Visita' : 'Registrar Visita'}</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--hover)] p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Cliente *</label>
                <select
                  value={form.cliente_id}
                  onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
                  className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Fecha *</label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Estado</label>
                  <select
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value })}
                    className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  >
                    {ESTADOS_VISITA.map((s) => (
                      <option key={s} value={s}>
                        {etiquetaEstado(s)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Ubicación</label>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={capturarUbicacion}
                    disabled={ubicando}
                    className="inline-flex items-center gap-2 px-4 h-11 rounded-lg border border-[var(--primary)] text-[var(--primary-deep)] text-sm font-medium hover:bg-[var(--primary-soft)] transition-colors"
                  >
                    {ubicando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                    {ubicando ? 'Obteniendo...' : 'Usar mi ubicación'}
                  </button>
                  {form.latitud && form.longitud && (
                    <div className="flex items-center gap-2 text-sm text-[var(--primary)]">
                      <MapPin className="w-4 h-4" />
                      <span>{Number(form.latitud).toFixed(5)}, {Number(form.longitud).toFixed(5)}</span>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, latitud: '', longitud: '' })}
                        className="text-[var(--danger-deep)] hover:underline text-xs"
                      >
                        quitar
                      </button>
                    </div>
                  )}
                </div>
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
            <h3 className="text-xl font-bold text-[var(--text)] mb-2">¿Eliminar visita?</h3>
            <p className="text-sm text-[var(--text2)] mb-6">
              Se borrará la visita del {confirmarEliminar.fecha.slice(0, 10)}.
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
