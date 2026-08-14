import { useCallback, useEffect, useState } from 'react';
import {
  fetchAgenda,
  eliminarAgenda,
  toggleTarea,
  TIPOS_AGENDA,
  ESTADOS_AGENDA,
  PRIORIDADES,
  etiquetaEstado,
  etiquetaTipo,
  etiquetaPrioridad,
  type AgendaItem,
} from '../lib/agenda';
import { getErrorMessage } from '../lib/format';
import { Loader2, AlertCircle, Plus, Trash2, Search } from 'lucide-react';
import CalendarioMensual from './CalendarioMensual';
import AgendaModal, { emptyAgendaForm, agendaFormDesdeItem, type AgendaModalState } from './AgendaModal';

export default function CalendarioView({ corredorId }: { corredorId: string }) {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<AgendaModalState | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState<AgendaItem | null>(null);
  const [q, setQ] = useState('');
  const [fTipo, setFTipo] = useState('');
  const [fEstado, setFEstado] = useState('');
  const [fPrioridad, setFPrioridad] = useState('');

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAgenda(corredorId, { q: q || undefined });
      setItems(data);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, 'Error al cargar el calendario.'));
    } finally {
      setLoading(false);
    }
  }, [corredorId, q]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const filtrados = items.filter((i) => {
    if (fTipo && i.tipo !== fTipo) return false;
    if (fEstado && i.estado !== fEstado) return false;
    if (fPrioridad && (i.prioridad || 'media') !== fPrioridad) return false;
    return true;
  });

  const abrirNuevo = () => setModal(emptyAgendaForm('evento'));

  const abrirEnDia = (fecha: string) => setModal(emptyAgendaForm('evento', fecha));

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

  const marcarTarea = async (id: string, indice: number, hecho: boolean) => {
    try {
      await toggleTarea(id, indice, hecho);
      await cargar();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const selectClase = 'w-full h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)] text-sm';

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-[1440px] mx-auto w-full">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text)] tracking-tight">Calendario</h2>
          <p className="text-[var(--text2)] mt-1">Todas tus contrataciones, pliegos y eventos en un solo lugar.</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="bg-[var(--primary)] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--primary-deep)] transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Agregar actividad
        </button>
      </div>

      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text2)]" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título, organismo, lugar..."
            className="w-full h-11 pl-9 pr-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)] text-sm"
          />
        </div>
        <select value={fTipo} onChange={(e) => setFTipo(e.target.value)} className={selectClase}>
          <option value="">Tipo: Todos</option>
          {TIPOS_AGENDA.map((t) => (
            <option key={t} value={t}>
              {etiquetaTipo(t)}
            </option>
          ))}
        </select>
        <select value={fEstado} onChange={(e) => setFEstado(e.target.value)} className={selectClase}>
          <option value="">Estado: Todos</option>
          {ESTADOS_AGENDA.map((s) => (
            <option key={s} value={s}>
              {etiquetaEstado(s)}
            </option>
          ))}
        </select>
        <select value={fPrioridad} onChange={(e) => setFPrioridad(e.target.value)} className={selectClase}>
          <option value="">Prioridad: Todas</option>
          {PRIORIDADES.map((p) => (
            <option key={p.id} value={p.id}>
              {etiquetaPrioridad(p.id)}
            </option>
          ))}
        </select>
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
          <p>Cargando calendario...</p>
        </div>
      ) : (
        <>
          {filtrados.length === 0 ? (
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] py-16 text-center text-[var(--text2)]">
              No hay actividades que coincidan con los filtros.
            </div>
          ) : (
            <CalendarioMensual
              items={filtrados}
              onEditar={abrirEdicion}
              onAgregar={abrirEnDia}
              onToggleTarea={marcarTarea}
            />
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