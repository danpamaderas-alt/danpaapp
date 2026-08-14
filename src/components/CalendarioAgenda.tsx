import { useMemo } from 'react';
import { parseDateOnly, claveFecha } from '../lib/format';
import { ocurrenciasEntre, etiquetaEstado, etiquetaRecurrencia, type AgendaItem } from '../lib/agenda';
import { Plus, Pencil, Clock, MapPin } from 'lucide-react';

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const estadoClase = (i: AgendaItem) => {
  switch (i.estado) {
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

interface CalendarioAgendaProps {
  items: AgendaItem[];
  fecha: Date;
  onEditar: (i: AgendaItem) => void;
  onAgregar: (fechaISO: string, hora?: string) => void;
}

export default function CalendarioAgenda({ items, fecha, onEditar, onAgregar }: CalendarioAgendaProps) {
  const hoy = useMemo(() => claveFecha(new Date()), []);

  const grupos = useMemo(() => {
    const desde = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const hasta = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 89);
    const mapa: Record<string, AgendaItem[]> = {};
    for (const i of items) {
      if (!i.fecha) continue;
      const occ = ocurrenciasEntre(parseDateOnly(i.fecha), i.recurrencia, desde, hasta);
      for (const o of occ) {
        const k = claveFecha(o.fecha);
        if (!mapa[k]) mapa[k] = [];
        mapa[k].push(i);
      }
    }
    for (const k of Object.keys(mapa)) {
      mapa[k].sort((a, b) => (a.hora || '99:00').localeCompare(b.hora || '99:00'));
    }
    return mapa;
  }, [items, fecha]);

  const diasOrdenados = useMemo(() => Object.keys(grupos).sort(), [grupos]);

  const pasados = useMemo(() => {
    const desde = claveFecha(fecha);
    return items
      .filter((i) => i.fecha && i.fecha < desde && (!i.recurrencia || i.recurrencia === 'ninguna'))
      .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))
      .slice(0, 40);
  }, [items, fecha]);

  const etiquetaDia = (k: string) => {
    if (k === hoy) return 'Hoy';
    const d = parseDateOnly(k);
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    if (k === claveFecha(manana)) return 'Mañana';
    return capitalizar(`${DIAS_SEMANA[d.getDay()]} ${d.getDate()} de ${d.toLocaleDateString('es-AR', { month: 'long' })}`);
  };

  const renderFila = (i: AgendaItem, dim: boolean) => (
    <div
      key={i.id}
      className={`flex items-center gap-3 px-4 py-3 hover:bg-[var(--field)] transition-colors ${dim ? 'opacity-55' : ''}`}
    >
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: i.color || 'var(--border)' }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--text)] truncate">
          {i.titulo}
          {i.prioridad === 'alta' && (
            <span className="ml-2 text-[10px] font-semibold text-[var(--danger-deep)]">ALTA</span>
          )}
        </p>
        <p className="text-xs text-[var(--text2)] flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
          {i.hora && (
            <span className="inline-flex items-center gap-1 font-medium text-[var(--primary-deep)]">
              <Clock className="w-3 h-3" />
              {i.hora.slice(0, 5)}
              {i.hora_fin ? `-${i.hora_fin.slice(0, 5)}` : ''}
            </span>
          )}
          {i.lugar && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {i.lugar}
            </span>
          )}
          {i.organismo && <span>{i.organismo}</span>}
          {i.recurrencia && i.recurrencia !== 'ninguna' && <span>· {etiquetaRecurrencia(i.recurrencia)}</span>}
        </p>
      </div>
      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${estadoClase(i)}`}>
        {etiquetaEstado(i.estado)}
      </span>
      <button
        onClick={() => onEditar(i)}
        className="p-1.5 text-[var(--text2)] hover:text-[var(--primary)] hover:bg-[var(--primary-soft)] rounded-lg transition-colors flex-shrink-0"
        title="Editar"
      >
        <Pencil className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
      {diasOrdenados.length === 0 && pasados.length === 0 ? (
        <div className="py-16 text-center text-[var(--text2)]">
          <p className="font-medium">No hay actividades próximas</p>
          <p className="text-sm mt-1">Agregá una para verla acá.</p>
        </div>
      ) : (
        <>
          {diasOrdenados.map((k) => (
            <div key={k}>
              <div className="flex items-center justify-between px-4 py-2 bg-[var(--blue-header)] border-y border-[var(--border)]">
                <span className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider">
                  {etiquetaDia(k)}
                </span>
                <button
                  onClick={() => onAgregar(k)}
                  className="p-1.5 text-[var(--text2)] hover:text-[var(--primary)] rounded transition-colors"
                  title="Agregar actividad este día"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="divide-y divide-[var(--blue-header)]">
                {grupos[k].map((i) => renderFila(i, false))}
              </div>
            </div>
          ))}
          {pasados.length > 0 && (
            <>
              <div className="px-4 py-2 bg-[var(--blue-header)] border-y border-[var(--border)]">
                <span className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Anteriores</span>
              </div>
              {pasados.map((i) => renderFila(i, true))}
            </>
          )}
        </>
      )}
    </div>
  );
}