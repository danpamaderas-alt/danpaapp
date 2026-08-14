import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { parseDateOnly, claveFecha, hoyISO } from '../lib/format';
import { ocurrenciasEnMes, type AgendaItem } from '../lib/agenda';

const DIAS_CORTOS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

interface MiniCalendarioProps {
  fecha: Date;
  items?: AgendaItem[];
  onSelect: (d: Date) => void;
}

export default function MiniCalendario({ fecha, items = [], onSelect }: MiniCalendarioProps) {
  const [mes, setMes] = useState(() => new Date(fecha.getFullYear(), fecha.getMonth(), 1));
  const [seleccionado, setSeleccionado] = useState(() => claveFecha(fecha));

  useEffect(() => {
    setMes(new Date(fecha.getFullYear(), fecha.getMonth(), 1));
    setSeleccionado(claveFecha(fecha));
  }, [fecha]);

  const eventosPorDia = useMemo(() => {
    const mapa: Record<string, string[]> = {};
    const anio = mes.getFullYear();
    const m = mes.getMonth();
    for (const i of items) {
      if (!i.fecha) continue;
      for (const o of ocurrenciasEnMes(parseDateOnly(i.fecha), i.recurrencia, anio, m)) {
        const k = claveFecha(o.fecha);
        if (!mapa[k]) mapa[k] = [];
        const color = i.color || 'default';
        if (!mapa[k].includes(color)) mapa[k].push(color);
      }
    }
    return mapa;
  }, [items, mes]);

  const celdas = useMemo(() => {
    const anio = mes.getFullYear();
    const m = mes.getMonth();
    const offset = (new Date(anio, m, 1).getDay() + 6) % 7;
    const diasEnMes = new Date(anio, m + 1, 0).getDate();
    const c: { d: Date; enMes: boolean }[] = [];
    for (let i = offset - 1; i >= 0; i--) c.push({ d: new Date(anio, m, -i), enMes: false });
    for (let d = 1; d <= diasEnMes; d++) c.push({ d: new Date(anio, m, d), enMes: true });
    let sig = 1;
    while (c.length < 42) {
      c.push({ d: new Date(anio, m + 1, sig), enMes: false });
      sig++;
    }
    return c;
  }, [mes]);

  const hoy = hoyISO();

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-[var(--text)] capitalize">
          {mes.toLocaleDateString('es-AR', { month: 'long' })}{' '}
          <span className="text-[var(--text2)] font-normal">{mes.getFullYear()}</span>
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}
            className="p-1.5 text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--blue-header)] rounded transition-colors"
            title="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMes(new Date())}
            className="px-2 py-1.5 text-xs text-[var(--primary)] font-medium hover:bg-[var(--primary-soft)] rounded transition-colors"
          >
            Hoy
          </button>
          <button
            onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}
            className="p-1.5 text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--blue-header)] rounded transition-colors"
            title="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DIAS_CORTOS.map((d, i) => (
          <div key={i} className="text-center text-[9px] text-[var(--text2)]">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {celdas.map(({ d, enMes }, idx) => {
          const k = claveFecha(d);
          const colores = eventosPorDia[k];
          const esSel = k === seleccionado;
          const esHoy = k === hoy;
          return (
            <button
              key={idx}
              onClick={() => onSelect(new Date(d.getFullYear(), d.getMonth(), d.getDate()))}
              className={`relative rounded py-1 text-xs transition-colors ${!enMes ? 'opacity-35' : ''} ${
                esSel
                  ? 'bg-[var(--primary)] text-white font-semibold'
                  : esHoy
                    ? 'text-[var(--primary)] font-semibold ring-1 ring-[var(--primary)]'
                    : 'text-[var(--text2)] hover:bg-[var(--field)]'
              }`}
              title={enMes ? k : undefined}
            >
              {d.getDate()}
              {colores && colores.length > 0 && (
                <span
                  className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${esSel ? 'bg-white' : ''}`}
                  style={
                    esSel
                      ? undefined
                      : { backgroundColor: colores[0] === 'default' ? 'var(--primary)' : colores[0] }
                  }
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}