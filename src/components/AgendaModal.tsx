import { useState } from 'react';
import {
  crearAgenda,
  actualizarAgenda,
  ESTADOS_AGENDA,
  PRIORIDADES,
  RECURRENCIAS,
  COLORES,
  etiquetaEstado,
  etiquetaPrioridad,
  type AgendaInput,
} from '../lib/agenda';
import { getErrorMessage } from '../lib/format';
import type { AgendaTarea } from '../types';
import {
  Loader2,
  AlertCircle,
  X,
  Briefcase,
  FileText,
  CalendarDays,
  Plus,
  Trash2,
  CheckSquare,
} from 'lucide-react';

export interface AgendaModalState {
  id?: string;
  tipo: string;
  titulo: string;
  organismo: string;
  monto: string;
  fecha: string;
  hora: string;
  hora_fin: string;
  lugar: string;
  prioridad: string;
  color: string;
  recurrencia: string;
  tareas: AgendaTarea[];
  dias_aviso: string;
  estado: string;
  notas: string;
}

export const emptyAgendaForm = (tipo: string, fecha?: string, hora?: string): AgendaModalState => ({
  tipo,
  titulo: '',
  organismo: '',
  monto: '',
  fecha: fecha || '',
  hora: hora || '',
  hora_fin: '',
  lugar: '',
  prioridad: 'media',
  color: '',
  recurrencia: 'ninguna',
  tareas: [],
  dias_aviso: '',
  estado: 'pendiente',
  notas: '',
});

export const agendaFormDesdeItem = (i: {
  id: string;
  tipo: string;
  titulo: string;
  organismo: string | null;
  monto: number;
  fecha: string | null;
  hora: string | null;
  hora_fin: string | null;
  lugar: string | null;
  prioridad: string | null;
  color: string | null;
  recurrencia: string | null;
  tareas: AgendaTarea[] | null;
  dias_aviso: number | null;
  estado: string;
  notas: string | null;
}): AgendaModalState => ({
  id: i.id,
  tipo: i.tipo,
  titulo: i.titulo,
  organismo: i.organismo || '',
  monto: i.monto ? String(i.monto) : '',
  fecha: i.fecha ? i.fecha.slice(0, 10) : '',
  hora: i.hora ? i.hora.slice(0, 5) : '',
  hora_fin: i.hora_fin ? i.hora_fin.slice(0, 5) : '',
  lugar: i.lugar || '',
  prioridad: i.prioridad || 'media',
  color: i.color || '',
  recurrencia: i.recurrencia || 'ninguna',
  tareas: Array.isArray(i.tareas) ? i.tareas : [],
  dias_aviso: i.dias_aviso ? String(i.dias_aviso) : '',
  estado: i.estado,
  notas: i.notas || '',
});

interface AgendaModalProps {
  corredorId: string;
  initial: AgendaModalState;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}

export default function AgendaModal({ corredorId, initial, onClose, onSaved }: AgendaModalProps) {
  const [form, setForm] = useState<AgendaModalState>(initial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nuevaTarea, setNuevaTarea] = useState('');

  const tituloModal = form.id
    ? 'Editar'
    : form.tipo === 'pliego'
      ? 'Nuevo Pliego'
      : form.tipo === 'evento'
        ? 'Nuevo Evento'
        : 'Nueva Contratación';

  const agregarTarea = () => {
    const texto = nuevaTarea.trim();
    if (!texto) return;
    setForm({
      ...form,
      tareas: [...form.tareas, { id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, texto, hecho: false }],
    });
    setNuevaTarea('');
  };

  const toggleTareaLocal = (indice: number) => {
    setForm({
      ...form,
      tareas: form.tareas.map((t, idx) => (idx === indice ? { ...t, hecho: !t.hecho } : t)),
    });
  };

  const quitarTarea = (indice: number) => {
    setForm({ ...form, tareas: form.tareas.filter((_, idx) => idx !== indice) });
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
        hora_fin: form.hora_fin || undefined,
        lugar: form.lugar.trim() || undefined,
        prioridad: form.prioridad || 'media',
        color: form.color || undefined,
        recurrencia: form.recurrencia || 'ninguna',
        tareas: form.tareas.length > 0 ? form.tareas : undefined,
        dias_aviso: form.dias_aviso ? Number(form.dias_aviso) : undefined,
        estado: form.estado,
        notas: form.notas.trim() || undefined,
      };
      if (form.id) {
        await actualizarAgenda(form.id, input);
      } else {
        await crearAgenda(input);
      }
      onClose();
      await onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[var(--overlay)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--field)]">
          <h3 className="text-xl font-bold text-[var(--text)]">{tituloModal}</h3>
          <button
            onClick={onClose}
            className="text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--hover)] p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="bg-[var(--danger-soft)] text-[var(--danger-deep)] p-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

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
              <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Recurrencia</label>
              <select
                value={form.recurrencia}
                onChange={(e) => setForm({ ...form, recurrencia: e.target.value })}
                className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
              >
                {RECURRENCIAS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Hora inicio</label>
              <input
                type="time"
                value={form.hora}
                onChange={(e) => setForm({ ...form, hora: e.target.value })}
                className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Hora fin</label>
              <input
                type="time"
                value={form.hora_fin}
                onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
                className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Lugar / Ubicación</label>
            <input
              type="text"
              value={form.lugar}
              onChange={(e) => setForm({ ...form, lugar: e.target.value })}
              placeholder="Ej. Municipalidad, Salón de reuniones..."
              className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Prioridad</label>
            <div className="grid grid-cols-3 gap-3">
              {PRIORIDADES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setForm({ ...form, prioridad: p.id })}
                  className={`h-11 rounded-lg border text-sm font-medium transition-colors ${
                    form.prioridad === p.id
                      ? `${p.clase} border-[var(--border)] ring-1 ring-current`
                      : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text2)] hover:bg-[var(--field)]'
                  }`}
                >
                  {etiquetaPrioridad(p.id)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Color de la actividad</label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, color: '' })}
                className={`h-8 px-3 rounded-lg border text-xs font-medium transition-colors ${
                  !form.color
                    ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-deep)]'
                    : 'border-[var(--border)] text-[var(--text2)] hover:bg-[var(--field)]'
                }`}
              >
                Sin color
              </button>
              {COLORES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  title={c.label}
                  onClick={() => setForm({ ...form, color: c.hex })}
                  className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                    form.color === c.hex ? 'ring-2 ring-offset-2 ring-[var(--primary)]' : ''
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
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

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5" />
              Lista de tareas
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nuevaTarea}
                onChange={(e) => setNuevaTarea(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    agregarTarea();
                  }
                }}
                placeholder="Ej. Llevar documentos, preparar pliego..."
                className="flex-1 h-11 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
              />
              <button
                type="button"
                onClick={agregarTarea}
                className="px-4 h-11 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-deep)] transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>
            {form.tareas.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {form.tareas.map((t, idx) => (
                  <div key={t.id} className="flex items-center gap-2 border border-[var(--border)] rounded-lg px-3 py-2">
                    <input
                      type="checkbox"
                      checked={t.hecho}
                      onChange={() => toggleTareaLocal(idx)}
                      className="w-4 h-4 accent-[var(--primary)]"
                    />
                    <span className={`flex-1 text-sm ${t.hecho ? 'line-through text-[var(--text2)]' : 'text-[var(--text)]'}`}>
                      {t.texto}
                    </span>
                    <button
                      type="button"
                      onClick={() => quitarTarea(idx)}
                      className="p-1 text-[var(--text2)] hover:text-[var(--danger-deep)] rounded transition-colors"
                      title="Quitar tarea"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
        </div>

        <div className="px-6 py-4 flex justify-end gap-3 border-t border-[var(--blue-header)] bg-[var(--field)]">
          <button
            type="button"
            onClick={onClose}
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
  );
}