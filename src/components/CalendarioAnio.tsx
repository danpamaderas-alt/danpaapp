import { useMemo } from 'react';
import { parseDateOnly, claveFecha, hoyISO } from '../lib/format';
import { ocurrenciasEnMes, type AgendaItem } from '../lib/agenda';

const DIAS_CORTOS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

interface CalendarioAnioProps {
  items: AgendaItem[];
  fecha: Date;
  onIrMes: (d: Date) => void;
}

export default function CalendarioAnio({ items, fecha, onIrMes }: CalendarioAnioProps) {
  const anio = fecha.getFullYear();
  const hoy = hoyISO();

  const eventosPorDia = useMemo(() => {
    const porMes: Record<number, Record<string, string[]>> = {};
    for (let m = 0; m < 12; m++) {
      const mapa: Record<string, string[]> = {};
      for (const i of items) {
        if (!i.fecha) continue;
        for (const o of ocurrenciasEnMes(parseDateOnly(i.fecha), i.recurrencia, anio, m)) {
          const k = claveFecha(o.fecha);
          if (!mapa[k]) mapa[k] = [];
          const color = i.color || 'default';
          if (!mapa[k].includes(color)) mapa[k].push(color);
        }
      }
      porMes[m] = mapa;
    }
    return porMes;
  }, [items, anio]);

  const celdasPorMes = useMemo(() => {
    const res: { m: number; celdas: { d: Date; enMes: boolean }[] }[] = [];
    for (let m = 0; m < 12; m++) {
      const offset = (new Date(anio, m, 1).getDay() + 6) % 7;
      const diasEnMes = new Date(anio, m + 1, 0).getDate();
      const celdas: { d: Date; enMes: boolean }[] = [];
      for (let i = offset - 1; i >= 0; i--) celdas.push({ d: new Date(anio, m, -i), enMes: false });
      for (let d = 1; d <= diasEnMes; d++) celdas.push({ d: new Date(anio, m, d), enMes: true });
      let sig = 1;
      while (celdas.length < 42) {
        celdas.push({ d: new Date(anio, m + 1, sig), enMes: false });
        sig++;
      }
      res.push({ m, celdas });
    }
    return res;
  }, [anio]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {celdasPorMes.map(({ m, celdas }) => (
        <div key={m} className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-3">
          <div className="text-sm font-semibold text-[var(--text)] capitalize mb-2">
            {new Date(anio, m, 1).toLocaleDateString('es-AR', { month: 'long' })}
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
              const colores = eventosPorDia[m][k];
              const esHoy = k === hoy;
              return (
                <button
                  key={idx}
                  onClick={() => onIrMes(new Date(d.getFullYear(), d.getMonth(), d.getDate()))}
                  className={`relative aspect-square rounded text-[10px] transition-colors ${
                    !enMes ? 'opacity-30' : ''
                  } ${esHoy ? 'text-[var(--primary)] font-bold' : 'text-[var(--text2)] hover:bg-[var(--field)]'}`}
                  title={enMes ? k : undefined}
                >
                  {d.getDate()}
                  {colores && colores.length > 0 && (
                    <span
                      className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{
                        backgroundColor: colores[0] === 'default' ? 'var(--primary)' : colores[0],
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}