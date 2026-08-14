import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchAgenda,
  eliminarAgenda,
  ESTADOS_AGENDA,
  etiquetaEstado,
  type AgendaItem,
} from '../lib/agenda';
import { dinero, formatDate, getErrorMessage } from '../lib/format';
import {
  Briefcase,
  FileText,
  CheckCircle2,
  Clock,
  Hourglass,
  Loader2,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Building2,
  CalendarDays,
  Bell,
  List,
  Calendar,
} from 'lucide-react';
import CalendarioMensual from './CalendarioMensual';
import CalendarioToolbar from './CalendarioToolbar';
import AgendaModal, { emptyAgendaForm, agendaFormDesdeItem, type AgendaModalState } from './AgendaModal';

interface AgendaViewProps {
  corredorId: string;
}

const estadoBadge = (estado: string) => {
  switch (estado) {
    case 'adjudicado':
      return 'bg-[var(--primary-soft)] text-[var(--primary-deep)]';
    case 'presentado':
      return 'bg-[var(--blue-soft)] text-[var(--primary-deep)]';
    case 'perdido':
      return 'bg-[var(--danger-soft)] text-[var(--danger-deep)]';
    case 'vencido':
      return 'bg-[var(--gray-soft)] text-[var(--text2)]';
    default:
      return 'bg-[var(--amber-soft)] text-[var(--amber-text)]';
  }
};

export default function AgendaView({ corredorId }: AgendaViewProps) {
  const [tipoTab, setTipoTab] = useState('contratacion');
  const [estado, setEstado] = useState('');
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<AgendaModalState | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState<AgendaItem | null>(null);
  const [vista, setVista] = useState<'lista' | 'calendario'>('lista');
  const [fechaCal, setFechaCal] = useState(() => new Date());

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAgenda(corredorId, {
        tipo: tipoTab,
        estado: estado || undefined,
      });
      setItems(data);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, 'Error al cargar la agenda.'));
    } finally {
      setLoading(false);
    }
  }, [corredorId, tipoTab, estado]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const contadores = useMemo(() => {
    const pendiente = items.filter((i) => i.estado === 'pendiente').length;
    const presentado = items.filter((i) => i.estado === 'presentado').length;
    const adjudicado = items.filter((i) => i.estado === 'adjudicado').length;
    const montoTotal = items.reduce((a, i) => a + (i.monto || 0), 0);
    return { total: items.length, pendiente, presentado, adjudicado, montoTotal };
  }, [items]);

  const esPliego = tipoTab === 'pliego';
  const esEvento = tipoTab === 'evento';
  const tituloSeccion = esPliego ? 'Pliegos' : esEvento ? 'Eventos' : 'Contrataciones';
  const textoNuevo = esPliego ? 'Nuevo Pliego' : esEvento ? 'Nuevo Evento' : 'Nueva Contratación';
  const IconoSeccion = esPliego ? FileText : esEvento ? CalendarDays : Briefcase;

  const kpi = [
    {
      label: tituloSeccion,
      valor: String(contadores.total),
      clase: 'text-[var(--text)]',
      Icon: IconoSeccion,
      fondo: 'bg-[var(--gray-soft)]',
      iconColor: 'text-[var(--text)]',
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
      label: 'Presentados',
      valor: String(contadores.presentado),
      clase: 'text-[var(--primary)]',
      Icon: Hourglass,
      fondo: 'bg-[var(--blue-soft)]',
      iconColor: 'text-[var(--primary)]',
    },
    {
      label: 'Adjudicados',
      valor: String(contadores.adjudicado),
      clase: 'text-[var(--primary-green)]',
      Icon: CheckCircle2,
      fondo: 'bg-[var(--primary-soft)]',
      iconColor: 'text-[var(--primary-green)]',
    },
  ];

  const abrirNuevo = () => setModal(emptyAgendaForm(tipoTab));

  const abrirEnDia = (fecha: string, hora?: string) => setModal(emptyAgendaForm(tipoTab, fecha, hora));

  const abrirEdicion = (i: AgendaItem) => setModal(agendaFormDesdeItem(i));

  const confirmarBorrado = async () => {
    if (!confirmarEliminar) return;
    setGuardando(true);
    try {
      await eliminarAgenda(confirmarEliminar.id);
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
          <h2 className="text-2xl font-semibold text-[var(--text)] tracking-tight">Agenda</h2>
          <p className="text-[var(--text2)] mt-1">Eventos, contrataciones y pliegos con recordatorios para no perder ninguna fecha.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-[var(--field)] border border-[var(--border)] rounded-lg p-1">
            <button
              onClick={() => setTipoTab('contratacion')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                tipoTab === 'contratacion'
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--text2)] hover:text-[var(--text)]'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Contrataciones
            </button>
            <button
              onClick={() => setTipoTab('pliego')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                tipoTab === 'pliego'
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--text2)] hover:text-[var(--text)]'
              }`}
            >
              <FileText className="w-4 h-4" />
              Pliegos
            </button>
            <button
              onClick={() => setTipoTab('evento')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                tipoTab === 'evento'
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--text2)] hover:text-[var(--text)]'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Eventos
            </button>
          </div>
          <div className="flex bg-[var(--field)] border border-[var(--border)] rounded-lg p-1">
            <button
              onClick={() => setVista('lista')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                vista === 'lista'
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--text2)] hover:text-[var(--text)]'
              }`}
            >
              <List className="w-4 h-4" />
              Lista
            </button>
            <button
              onClick={() => setVista('calendario')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                vista === 'calendario'
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--text2)] hover:text-[var(--text)]'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Calendario
            </button>
          </div>
          <button
            onClick={abrirNuevo}
            className="bg-[var(--primary)] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--primary-deep)] transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            {textoNuevo}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-[var(--danger-soft)] text-[var(--danger-deep)] p-4 rounded-xl flex items-start gap-4 mb-8">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-[var(--text2)]">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-[var(--primary)]" />
          <p>Cargando agenda...</p>
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
              <Clock className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Filtro por estado</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-lg">
              <div>
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Estado</label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)] mt-1"
                >
                  <option value="">Todos</option>
                  {ESTADOS_AGENDA.map((s) => (
                    <option key={s} value={s}>
                      {etiquetaEstado(s)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                {estado && (
                  <button
                    onClick={() => setEstado('')}
                    className="h-11 text-sm text-[var(--primary)] font-medium hover:underline"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>

          {vista === 'lista' ? (
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
              <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center">
                <h3 className="text-lg font-semibold text-[var(--text)]">
                  {tituloSeccion}
                  {contadores.montoTotal > 0 && (
                    <span className="ml-3 text-base font-semibold text-[var(--primary)]">{dinero(contadores.montoTotal)}</span>
                  )}
                </h3>
                <span className="text-sm text-[var(--text2)]">{items.length} {items.length === 1 ? 'registro' : 'registros'}</span>
              </div>
              <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                <table className="w-full text-left border-collapse min-w-[680px]">
                  <thead className="sticky top-0 bg-[var(--blue-header)]">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Fecha</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Título</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Organismo</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)] text-right">Monto</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Estado</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)] text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-[var(--text2)]">
                          {esPliego ? (
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          ) : esEvento ? (
                            <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          ) : (
                            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          )}
                          <p className="font-medium">No hay {tituloSeccion.toLowerCase()} registrados</p>
                          <p className="text-sm mt-1">Agregá uno para no perder ninguna fecha importante.</p>
                        </td>
                      </tr>
                    ) : (
                      items.map((i) => (
                        <tr key={i.id} className="hover:bg-[var(--field)] transition-colors">
                          <td className="px-6 py-3.5 text-[var(--text2)] text-sm whitespace-nowrap">
                            {i.fecha ? (
                              <>
                                {formatDate(i.fecha)}
                                {i.hora && (
                                  <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--primary-deep)]">
                                    <Clock className="w-3 h-3" />
                                    {i.hora.slice(0, 5)}
                                    {i.hora_fin ? `-${i.hora_fin.slice(0, 5)}` : ''}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-[var(--muted)]">Sin fecha</span>
                            )}
                          </td>
                          <td className="px-6 py-3.5">
                            <p className="font-medium text-[var(--text)]">{i.titulo}</p>
                            {i.lugar && (
                              <p className="text-xs text-[var(--text2)] flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {i.lugar}
                              </p>
                            )}
                            {i.dias_aviso && i.dias_aviso > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs text-[var(--text2)]">
                                <Bell className="w-3 h-3" />
                                Avisa {i.dias_aviso} día{i.dias_aviso > 1 ? 's' : ''} antes
                              </span>
                            )}
                            {i.notas && <p className="text-xs text-[var(--text2)] line-clamp-1">{i.notas}</p>}
                          </td>
                          <td className="px-6 py-3.5">
                            {i.organismo ? (
                              <span className="inline-flex items-center gap-1.5 text-sm text-[var(--text)]">
                                <Building2 className="w-4 h-4 text-[var(--text2)]" />
                                {i.organismo}
                              </span>
                            ) : (
                              <span className="text-sm text-[var(--muted)]">—</span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-right font-semibold whitespace-nowrap">{i.monto ? dinero(i.monto) : <span className="text-[var(--muted)]">—</span>}</td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoBadge(i.estado)}`}>
                              {etiquetaEstado(i.estado)}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => abrirEdicion(i)}
                              className="p-2 text-[var(--text2)] hover:text-[var(--primary)] hover:bg-[var(--primary-soft)] rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmarEliminar(i)}
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
          ) : (
            <>
              <CalendarioToolbar fecha={fechaCal} vista="mes" onCambiar={setFechaCal} />
              <CalendarioMensual items={items} fecha={fechaCal} onEditar={abrirEdicion} onAgregar={abrirEnDia} />
            </>
          )}
        </>
      )}

      {modal && (
        <AgendaModal corredorId={corredorId} initial={modal} onClose={() => setModal(null)} onSaved={cargar} />
      )}

      {confirmarEliminar && (
        <div className="fixed inset-0 bg-[var(--overlay)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
            <Trash2 className="w-12 h-12 text-[var(--danger)] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[var(--text)] mb-2">¿Eliminar registro?</h3>
            <p className="text-sm text-[var(--text2)] mb-6">Se borrará "{confirmarEliminar.titulo}".</p>
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