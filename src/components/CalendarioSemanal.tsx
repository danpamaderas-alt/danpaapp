import { useMemo } from 'react';
import { parseDateOnly, claveFecha } from '../lib/format';
import { ocurrenciasEntre, type AgendaItem } from '../lib/agenda';

const HORA_INICIO = 6;
const HORA_FIN = 22;
const HORA_PX = 56;
const ALTURA_GRILLA = (HORA_FIN - HORA_INICIO) * HORA_PX;
const ALTURA_CABECERA = 48;
const ALTURA_DIA_COMPLETO = 40;

const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

const pad = (n: number) => String(n).padStart(2, '0');

const parseHora = (h: string | null | undefined): number | null => {
  if (!h) return null;
  const [hh, mm] = h.split(':').map(Number);
  if (!Number.isFinite(hh)) return null;
  return hh * 60 + (mm || 0);
};

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

interface CalendarioSemanalProps {
  items: AgendaItem[];
  fecha: Date;
  modo: 'dia' | 'semana';
  onEditar: (i: AgendaItem) => void;
  onAgregar: (fechaISO: string, hora?: string) => void;
}

type Timed = { item: AgendaItem; inicio: number; fin: number; col: number; total: number };

export default function CalendarioSemanal({ items, fecha, modo, onEditar, onAgregar }: CalendarioSemanalProps) {
  const dias = useMemo(() => {
    if (modo === 'dia') return [fecha];
    const lunes = new Date(fecha);
    lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(lunes);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [fecha, modo]);

  const ocurrencias = useMemo(() => {
    const mapa: Record<string, AgendaItem[]> = {};
    const desde = dias[0];
    const hasta = dias[dias.length - 1];
    for (const i of items) {
      if (!i.fecha) continue;
      const occ = ocurrenciasEntre(parseDateOnly(i.fecha), i.recurrencia, desde, hasta);
      for (const o of occ) {
        const k = claveFecha(o.fecha);
        if (!mapa[k]) mapa[k] = [];
        mapa[k].push(i);
      }
    }
    return mapa;
  }, [items, dias]);

  const placar = (delDia: AgendaItem[]): Timed[] => {
    const conHora = delDia
      .map((i) => {
        const p = parseHora(i.hora);
        if (p === null) return null;
        const inicio = Math.max(p, HORA_INICIO * 60);
        const fin = Math.min(Math.max(parseHora(i.hora_fin) ?? inicio + 45, inicio + 30), HORA_FIN * 60);
        return { item: i, inicio, fin, col: 0, total: 1 };
      })
      .filter((e): e is Timed => e !== null)
      .sort((a, b) => a.inicio - b.inicio);
    const usados: Timed[] = [];
    for (const e of conHora) {
      let col = 0;
      while (usados.some((u) => u.col === col && u.fin > e.inicio)) col++;
      e.col = col;
      e.total = col + 1;
      usados.push(e);
    }
    return conHora;
  };

  const hoyK = claveFecha(new Date());
  const ahora = new Date();
  const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes();
  const mostrarAhora = ahoraMin >= HORA_INICIO * 60 && ahoraMin <= HORA_FIN * 60;
  const ahoraTop = ((ahoraMin - HORA_INICIO * 60) / 60) * HORA_PX;

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-x-auto">
      <div className="flex min-w-[620px]">
        <div className="w-12 sm:w-14 flex-shrink-0">
          <div style={{ height: ALTURA_CABECERA }} className="border-b border-[var(--border)]" />
          <div
            style={{ height: ALTURA_DIA_COMPLETO }}
            className="border-b border-[var(--border)] flex items-end justify-end pb-1 pr-1 text-[9px] uppercase tracking-wider text-[var(--text2)]"
          >
            Todo el día
          </div>
          <div className="relative" style={{ height: ALTURA_GRILLA }}>
            {Array.from({ length: HORA_FIN - HORA_INICIO + 1 }, (_, i) => (
              <span
                key={i}
                className="absolute right-2 text-[10px] text-[var(--text2)] -translate-y-1/2"
                style={{ top: i * HORA_PX }}
              >
                {pad(HORA_INICIO + i)}:00
              </span>
            ))}
            {mostrarAhora && (
              <span className="absolute right-1 -translate-y-1/2 z-10" style={{ top: ahoraTop }}>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--danger)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)]" />
                  {pad(ahora.getHours())}:{pad(ahora.getMinutes())}
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1">
          {dias.map((dia) => {
            const k = claveFecha(dia);
            const delDia = ocurrencias[k] || [];
            const sinHora = delDia.filter((i) => parseHora(i.hora) === null);
            const timed = placar(delDia);
            const esHoy = k === hoyK;
            return (
              <div
                key={k}
                className={`flex-1 min-w-0 border-l border-[var(--border)] first:border-l-0 flex flex-col ${esHoy ? 'bg-[var(--primary-soft)]/30' : ''}`}
              >
                <div
                  style={{ height: ALTURA_CABECERA }}
                  className="border-b border-[var(--border)] flex flex-col items-center justify-center"
                >
                  <div className="text-[10px] uppercase tracking-wide text-[var(--text2)]">
                    {DIAS_CORTOS[dia.getDay()]}
                  </div>
                  <div className={`text-sm font-semibold ${esHoy ? 'text-[var(--primary)]' : 'text-[var(--text)]'}`}>
                    {dia.getDate()}
                  </div>
                </div>

                <div
                  style={{ minHeight: ALTURA_DIA_COMPLETO }}
                  className="border-b border-[var(--border)] px-1 py-1 flex flex-wrap gap-1 content-start cursor-pointer"
                  onClick={() => onAgregar(k)}
                  title="Crear actividad en este día"
                >
                  {sinHora.map((i) => (
                    <button
                      key={i.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditar(i);
                      }}
                      className={`text-[10px] px-1.5 py-0.5 rounded truncate max-w-full hover:opacity-85 ${
                        i.color ? 'text-white' : estadoClase(i)
                      }`}
                      style={i.color ? { backgroundColor: i.color } : undefined}
                      title={`${i.titulo}${i.lugar ? ` - ${i.lugar}` : ''}`}
                    >
                      {i.titulo}
                    </button>
                  ))}
                </div>

                <div
                  className="relative flex-1 cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const idx = Math.floor(y / HORA_PX);
                    let hh = HORA_INICIO + idx;
                    let mm = Math.round(((y % HORA_PX) / HORA_PX) * 60 / 30) * 30;
                    if (mm === 60) {
                      hh += 1;
                      mm = 0;
                    }
                    if (hh >= HORA_FIN) hh = HORA_FIN - 1;
                    onAgregar(k, `${pad(hh)}:${pad(mm)}:00`);
                  }}
                  title="Hacé clic para crear una actividad a esa hora"
                >
                  {Array.from({ length: HORA_FIN - HORA_INICIO + 1 }, (_, i) => (
                    <div
                      key={i}
                      className="absolute left-0 right-0 border-t border-[var(--blue-header)]"
                      style={{ top: i * HORA_PX }}
                    />
                  ))}
                  {timed.map((e) => {
                    const top = ((e.inicio - HORA_INICIO * 60) / 60) * HORA_PX;
                    const alto = Math.max(((e.fin - e.inicio) / 60) * HORA_PX, 26);
                    const ancho = 100 / e.total;
                    return (
                      <button
                        key={e.item.id}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onEditar(e.item);
                        }}
                        className={`absolute rounded-md text-left px-1.5 py-1 text-[10px] leading-tight overflow-hidden z-[5] hover:opacity-90 ${
                          e.item.color
                            ? 'text-white'
                            : 'bg-[var(--primary-soft)] text-[var(--primary-deep)] border border-[var(--primary)]/30'
                        }`}
                        style={{
                          top,
                          left: `${e.col * ancho}%`,
                          width: `calc(${ancho}% - 2px)`,
                          height: alto - 1,
                          backgroundColor: e.item.color,
                        }}
                        title={`${e.item.titulo}${e.item.lugar ? ` - ${e.item.lugar}` : ''}${e.item.prioridad === 'alta' ? ' - Prioridad alta' : ''}`}
                      >
                        <span className="font-semibold">{e.item.hora ? e.item.hora.slice(0, 5) : ''}</span>
                        <span className="block truncate">{e.item.titulo}</span>
                      </button>
                    );
                  })}
                  {esHoy && mostrarAhora && (
                    <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: ahoraTop }}>
                      <div className="h-[2px] bg-[var(--danger)]" />
                      <div className="absolute -left-1 -top-[3px] w-2 h-2 rounded-full bg-[var(--danger)]" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}