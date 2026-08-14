import { useCallback, useEffect, useState } from 'react';
import {
  fetchAgenda,
  crearAgenda,
  actualizarAgenda,
  eliminarAgenda,
  ESTADOS_AGENDA,
  etiquetaEstado,
  type AgendaItem,
  type AgendaInput,
} from '../lib/agenda';
import { getErrorMessage } from '../lib/format';
import { Loader2, AlertCircle, Plus, X, Briefcase, FileText, CalendarDays, Trash2 } from 'lucide-react';
import CalendarioMensual from './CalendarioMensual';

interface FormState {
  id?: string;
  tipo: string;
  titulo: string;
  organismo: string;
  monto: string;
  fecha: string;
  hora: string;
  dias_aviso: string;
  estado: string;
  notas: string;
}

const emptyForm = (tipo: string): FormState => ({
  tipo,
  titulo: '',
  organismo: '',
  monto: '',
  fecha: '',
  hora: '',
  dias_aviso: '',
  estado: 'pendiente',
  notas: '',
});

export default function CalendarioView({ corredorId }: { corredorId: string }) {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm('evento'));
  const [guardando, setGuardando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState<AgendaItem | null>(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAgenda(corredorId);
      setItems(data);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, 'Error al cargar el calendario.'));
    } finally {
      setLoading(false);
    }
  }, [corredorId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const abrirNuevo = () => {
    setForm(emptyForm('evento'));
    setModalOpen(true);
  };

  const abrirEnDia = (fecha: string) => {
    const f = emptyForm('evento');
    f.fecha = fecha;
    setForm(f);
    setModalOpen(true);
  };

  const abrirEdicion = (i: AgendaItem) => {
    setForm({
      id: i.id,
      tipo: i.tipo,
      titulo: i.titulo,
      organismo: i.organismo || '',
      monto: i.monto ? String(i.monto) : '',
      fecha: i.fecha ? i.fecha.slice(0, 10) : '',
      hora: i.hora ? i.hora.slice(0, 5) : '',
      dias_aviso: i.dias_aviso ? String(i.dias_aviso) : '',
      estado: i.estado,
      notas: i.notas || '',
    });
    setModalOpen(true);
  };

  const guardar = async () => {
    if (!form.titulo.trim()) {
      alert('Escribí un título.');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const input: AgendaInput = {
        corredor_id: corredorId,
        tipo: form.tipo,
        titulo: form.titulo.trim(),
        organismo: form.organismo.trim() || undefined,
        monto: form.monto ? Number(form.monto) : 0,
        fecha: form.fecha || undefined,
        hora: form.hora || undefined,
        dias_aviso: form.dias_aviso ? Number(form.dias_aviso) : undefined,
        estado: form.estado,
        notas: form.notas.trim() || undefined,
      };
      if (form.id) {
        await actualizarAgenda(form.id, input);
      } else {
        await crearAgenda(input);
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
        <CalendarioMensual items={items} onEditar={abrirEdicion} onAgregar={abrirEnDia} />
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-[var(--overlay)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--field)]">
              <h3 className="text-xl font-bold text-[var(--text)]">
                {form.id
                  ? 'Editar'
                  : form.tipo === 'pliego'
                    ? 'Nuevo Pliego'
                    : form.tipo === 'evento'
                      ? 'Nuevo Evento'
                      : 'Nueva Contratación'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--hover)] p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, tipo: 'contratacion' })}
                  className={`h-11 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    form.tipo === 'contratacion'
                      ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary-deep)]'
                      : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text2)] hover:bg-[var(--field)]'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Contratación
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, tipo: 'pliego' })}
                  className={`h-11 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    form.tipo === 'pliego'
                      ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary-deep)]'
                      : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text2)] hover:bg-[var(--field)]'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Pliego
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, tipo: 'evento' })}
                  className={`h-11 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    form.tipo === 'evento'
                      ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary-deep)]'
                      : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text2)] hover:bg-[var(--field)]'
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  Evento
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Título *</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ej. Reunión con Municipalidad"
                  className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Organismo / Cliente</label>
                  <input
                    type="text"
                    value={form.organismo}
                    onChange={(e) => setForm({ ...form, organismo: e.target.value })}
                    placeholder="Ej. Municipalidad de..."
                    className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Monto</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.monto}
                    onChange={(e) => setForm({ ...form, monto: e.target.value })}
                    placeholder="0.00"
                    className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Fecha de agenda</label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Hora</label>
                  <input
                    type="time"
                    value={form.hora}
                    onChange={(e) => setForm({ ...form, hora: e.target.value })}
                    className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Estado</label>
                  <select
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value })}
                    className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  >
                    {ESTADOS_AGENDA.map((s) => (
                      <option key={s} value={s}>
                        {etiquetaEstado(s)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Aviso previo (días)</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={form.dias_aviso}
                    onChange={(e) => setForm({ ...form, dias_aviso: e.target.value })}
                    placeholder="0 = sin aviso"
                    className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  />
                  <p className="text-xs text-[var(--text2)]">Te avisamos con la campanita antes de la fecha.</p>
                </div>
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