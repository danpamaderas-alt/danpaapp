import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Pencil } from 'lucide-react';
import { formatDate } from '../lib/format';
import { etiquetaEstado, etiquetaTipo, type AgendaItem } from '../lib/agenda';

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

interface CalendarioMensualProps {
  items: AgendaItem[];
  onEditar: (i: AgendaItem) => void;
  onAgregar: (fechaISO: string) => void;
}

export default function CalendarioMensual({ items, onEditar, onAgregar }: CalendarioMensualProps) {
  const [mesActual, setMesActual] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  const porDia = useMemo(() => {
    const mapa: Record<string, AgendaItem[]> = {};
    for (const i of items) {
      if (!i.fecha) continue;
      const clave = i.fecha.slice(0, 10);
      if (!mapa[clave]) mapa[clave] = [];
      mapa[clave].push(i);
    }
    return mapa;
  }, [items]);

  const semanas = useMemo(() => {
    const anio = mesActual.getFullYear();
    const mes = mesActual.getMonth();
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
  }, [mesActual]);

  const itemsDelDia = useMemo(() => (diaSeleccionado ? porDia[diaSeleccionado] || [] : []), [diaSeleccionado, porDia]);

  const cambiarMes = (delta: number) => {
    setMesActual((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  };

  const irHoy = () => {
    const d = new Date();
    setMesActual(new Date(d.getFullYear(), d.getMonth(), 1));
    setDiaSeleccionado(fechaISO(d));
  };

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h3 className="text-lg font-semibold text-[var(--text)] capitalize">
          {mesActual.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => cambiarMes(-1)}
            className="p-2 text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--blue-header)] rounded-lg transition-colors"
            title="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={irHoy}
            className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--text)] hover:bg-[var(--blue-header)] transition-colors"
          >
            Hoy
          </button>
          <button
            onClick={() => cambiarMes(1)}
            className="p-2 text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--blue-header)] rounded-lg transition-colors"
            title="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

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
                    title={`${i.titulo}${i.hora ? ` - ${i.hora.slice(0, 5)}` : ''}`}
                    className={`text-[10px] leading-tight text-left px-1.5 py-0.5 rounded truncate ${chipEstado(i.estado)} hover:opacity-80`}
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
                  className="flex items-center justify-between gap-3 border border-[var(--border)] rounded-lg px-4 py-3 hover:bg-[var(--field)] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text)] truncate">{i.titulo}</p>
                    <p className="text-xs text-[var(--text2)]">
                      {etiquetaTipo(i.tipo)}
                      {i.hora ? ` · ${i.hora.slice(0, 5)} hs` : ''}
                      {i.organismo ? ` · ${i.organismo}` : ''}
                    </p>
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
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}