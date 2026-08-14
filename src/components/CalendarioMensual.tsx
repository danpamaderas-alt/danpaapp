import { useMemo, useState } from 'react';
import { Plus, Pencil, MapPin, Flag, CheckSquare } from 'lucide-react';
import { formatDate, parseDateOnly } from '../lib/format';
import {
  etiquetaEstado,
  etiquetaTipo,
  etiquetaPrioridad,
  etiquetaRecurrencia,
  ocurrenciasEnMes,
  type AgendaItem,
} from '../lib/agenda';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const fechaISO = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const chipEstado = (estado: string) => {
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

const prioridadClase = (p: string | null | undefined) => {
  switch (p) {
    case 'alta': return 'text-[var(--danger-deep)] bg-[var(--danger-soft)]';
    case 'baja': return 'text-[var(--primary-deep)] bg-[var(--blue-soft)]';
    default: return 'text-[var(--amber-text)] bg-[var(--amber-soft)]';
  }
};

interface CalendarioMensualProps {
  items: AgendaItem[];
  fecha: Date;
  onEditar: (i: AgendaItem) => void;
  onAgregar: (fechaISO: string, hora?: string) => void;
  onToggleTarea?: (id: string, indice: number, hecho: boolean) => void;
}

export default function CalendarioMensual({ items, fecha, onEditar, onAgregar, onToggleTarea }: CalendarioMensualProps) {
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  const porDia = useMemo(() => {
    const mapa: Record<string, AgendaItem[]> = {};
    for (const i of items) {
      if (!i.fecha) continue;
      const ocurrencias = ocurrenciasEnMes(
        parseDateOnly(i.fecha),
        i.recurrencia,
        fecha.getFullYear(),
        fecha.getMonth()
      );
      for (const o of ocurrencias) {
        const clave = fechaISO(o.fecha);
        if (!mapa[clave]) mapa[clave] = [];
        mapa[clave].push(i);
      }
    }
    return mapa;
  }, [items, fecha]);

  const semanas = useMemo(() => {
    const anio = fecha.getFullYear();
    const mes = fecha.getMonth();
    const offset = (new Date(anio, mes, 1).getDay() + 6) % 7;
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();
    const celdas: { fecha: Date; enMes: boolean }[] = [];
    for (let i = offset - 1; i >= 0; i--) {
      celdas.push({ fecha: new Date(anio, mes, -i), enMes: false });
    }
    for (let d = 1; d <= diasEnMes; d++) {
      celdas.push({ fecha: new Date(anio, mes, d), enMes: true });
    }
    let siguiente = 1;
    while (celdas.length < 42) {
      celdas.push({ fecha: new Date(anio, mes + 1, siguiente), enMes: false });
      siguiente++;
    }
    return celdas;
  }, [fecha]);

  const itemsDelDia = useMemo(() => (diaSeleccionado ? porDia[diaSeleccionado] || [] : []), [diaSeleccionado, porDia]);

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 mb-8">
      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-[var(--text2)] uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {semanas.map((celda, idx) => {
          const clave = fechaISO(celda.fecha);
          const delDia = porDia[clave] || [];
          const esHoy = clave === fechaISO(new Date());
          const esSeleccionado = clave === diaSeleccionado;
          return (
            <div
              key={idx}
              onClick={() => setDiaSeleccionado(clave)}
              className={`flex flex-col gap-1 rounded-lg border p-1.5 sm:p-2 min-h-[80px] sm:min-h-[96px] cursor-pointer transition-colors ${
                esSeleccionado
                  ? 'border-[var(--primary)] ring-1 ring-[var(--primary)] bg-[var(--primary-soft)]'
                  : 'border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--field)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold ${!celda.enMes ? 'opacity-40' : ''} ${
                    esHoy ? 'text-[var(--primary)]' : 'text-[var(--text2)]'
                  }`}
                >
                  {celda.fecha.getDate()}
                </span>
                {esHoy && <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />}
              </div>
              <div className="flex flex-col gap-1 overflow-hidden">
                {delDia.slice(0, 3).map((i) => (
                  <button
                    key={i.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditar(i);
                    }}
                    title={`${i.titulo}${i.hora ? ` - ${i.hora.slice(0, 5)} hs` : ''}${i.prioridad === 'alta' ? ' - Prioridad alta' : ''}`}
                    className={`text-[10px] leading-tight text-left px-1.5 py-0.5 rounded truncate hover:opacity-80 ${
                      i.color ? 'text-white' : chipEstado(i.estado)
                    } ${i.prioridad === 'alta' && !i.color ? 'ring-1 ring-[var(--danger)]' : ''}`}
                    style={i.color ? { backgroundColor: i.color } : undefined}
                  >
                    {i.hora ? `${i.hora.slice(0, 5)} ` : ''}
                    {i.titulo}
                  </button>
                ))}
                {delDia.length > 3 && (
                  <span className="text-[10px] text-[var(--text2)] px-1">+{delDia.length - 3} más</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-[10px] text-[var(--text2)]">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[var(--amber-soft)] border border-[var(--amber)]" /> Pendiente</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[var(--blue-soft)] border border-[var(--primary)]" /> Presentado</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[var(--primary-soft)] border border-[var(--primary)]" /> Adjudicado</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[var(--danger-soft)] border border-[var(--danger)]" /> Perdido</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[var(--gray-soft)] border border-[var(--border)]" /> Vencido</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[var(--danger)]" /> Prioridad alta</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-gradient-to-r from-[#ef4444] via-[#f59e0b] to-[#3b82f6]" /> Color elegido</span>
      </div>

      {diaSeleccionado && (
        <div className="mt-6 border-t border-[var(--border)] pt-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h4 className="font-semibold text-[var(--text)]">{formatDate(diaSeleccionado)}</h4>
            <button
              onClick={() => onAgregar(diaSeleccionado)}
              className="bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--primary-deep)] transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar en este día
            </button>
          </div>
          {itemsDelDia.length === 0 ? (
            <p className="text-sm text-[var(--text2)]">Sin actividades para este día.</p>
          ) : (
            <div className="space-y-2">
              {itemsDelDia.map((i) => (
                <div
                  key={i.id}
                  className="border border-[var(--border)] rounded-lg px-4 py-3 hover:bg-[var(--field)] transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--text)] truncate">{i.titulo}</p>
                      <p className="text-xs text-[var(--text2)] mt-0.5">
                        {etiquetaTipo(i.tipo)}
                        {i.hora ? ` · ${i.hora.slice(0, 5)} hs` : ''}
                        {i.hora_fin ? ` - ${i.hora_fin.slice(0, 5)} hs` : ''}
                        {i.organismo ? ` · ${i.organismo}` : ''}
                      </p>
                      {(i.lugar || i.prioridad || i.recurrencia !== 'ninguna') && (
                        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-[var(--text2)]">
                          {i.lugar && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {i.lugar}
                            </span>
                          )}
                          {i.prioridad && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${prioridadClase(i.prioridad)}`}>
                              <Flag className="w-3 h-3" />
                              Prioridad {etiquetaPrioridad(i.prioridad)}
                            </span>
                          )}
                          {i.recurrencia && i.recurrencia !== 'ninguna' && (
                            <span className="flex items-center gap-1">
                              {etiquetaRecurrencia(i.recurrencia)}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${chipEstado(i.estado)}`}>
                        {etiquetaEstado(i.estado)}
                      </span>
                      <button
                        onClick={() => onEditar(i)}
                        className="p-2 text-[var(--text2)] hover:text-[var(--primary)] hover:bg-[var(--primary-soft)] rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {Array.isArray(i.tareas) && i.tareas.length > 0 && onToggleTarea && (
                    <div className="mt-3 pt-3 border-t border-[var(--blue-header)] space-y-1.5">
                      {i.tareas.map((t, idx) => (
                        <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={t.hecho}
                            onChange={() => onToggleTarea(i.id, idx, !t.hecho)}
                            className="w-4 h-4 accent-[var(--primary)]"
                          />
                          <span className={`text-sm flex items-center gap-1.5 ${t.hecho ? 'line-through text-[var(--text2)]' : 'text-[var(--text)]'}`}>
                            <CheckSquare className="w-3.5 h-3.5 text-[var(--text2)]" />
                            {t.texto}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}