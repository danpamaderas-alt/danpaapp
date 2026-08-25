import { useMemo } from 'react';
import { dinero, parseDateOnly } from '../lib/format';
import { desglosePorCategoria, type Movimiento } from '../lib/finanzas';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const etiquetaCategoria = (c: string) =>
  c.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

export function BarrasMensuales({ movimientos }: { movimientos: Movimiento[] }) {
  const meses = useMemo(() => {
    const hoy = new Date();
    const lista: { key: string; label: string; ingreso: number; egreso: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      lista.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: MESES[d.getMonth()],
        ingreso: 0,
        egreso: 0,
      });
    }
    for (const m of movimientos) {
      const f = parseDateOnly(m.fecha);
      const key = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`;
      const mes = lista.find((x) => x.key === key);
      if (!mes) continue;
      if (m.monto >= 0) mes.ingreso += m.monto;
      else mes.egreso += Math.abs(m.monto);
    }
    return lista;
  }, [movimientos]);

  const max = meses.length > 0
  ? Math.max(1, ...meses.map((m) => Math.max(m.ingreso, m.egreso)))
  : 1;

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
      <div className="flex items-center justify-between mb-5">
        <h4 className="font-semibold text-[var(--text)] flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
          Evolución últimos 6 meses
        </h4>
        <div className="flex items-center gap-3 text-xs text-[var(--text2)]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--primary)]" /> Ingresos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--danger)]" /> Egresos
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between gap-2 h-44">
        {meses.map((m) => (
          <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            <div className="w-full flex items-end justify-center gap-1" style={{ height: 160 }}>
              <div
                className="w-1/3 max-w-[22px] bg-[var(--primary)] rounded-t-sm transition-all duration-300"
                style={{ height: m.ingreso > 0 ? `${(m.ingreso / max) * 160}px` : '2px' }}
                title={`${m.label}: ingresos ${dinero(m.ingreso)}`}
              />
              <div
                className="w-1/3 max-w-[22px] bg-[var(--danger)] rounded-t-sm transition-all duration-300"
                style={{ height: m.egreso > 0 ? `${(m.egreso / max) * 160}px` : '2px' }}
                title={`${m.label}: egresos ${dinero(m.egreso)}`}
              />
            </div>
            <span className="text-[10px] font-medium text-[var(--text2)]">{m.label}</span>
          </div>
        ))}
      </div>

      {meses.every((m) => m.ingreso === 0 && m.egreso === 0) && (
        <p className="text-center text-xs text-[var(--text2)] mt-3">Sin movimientos en los últimos 6 meses.</p>
      )}
    </div>
  );
}

export function DonutIngresosEgresos({ movimientos }: { movimientos: Movimiento[] }) {
  const { ingresos, egresos, saldo } = useMemo(() => {
    let ing = 0;
    let egr = 0;
    for (const m of movimientos) {
      if (m.monto >= 0) ing += m.monto;
      else egr += Math.abs(m.monto);
    }
    return { ingresos: ing, egresos: egr, saldo: ing - egr };
  }, [movimientos]);

  const total = ingresos + egresos;
  const R = 42;
  const C = 2 * Math.PI * R;
  const pctIng = total > 0 ? ingresos / total : 0.5;
  const ingLen = C * pctIng;
  const egrLen = C - ingLen;

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 flex flex-col items-center">
      <h4 className="font-semibold text-[var(--text)] mb-5 self-start flex items-center gap-2">
        <Wallet className="w-4 h-4 text-[var(--primary)]" />
        Ingresos vs Egresos
      </h4>

      <div className="relative w-36 h-36">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={R} fill="none" stroke="var(--gray-soft)" strokeWidth="14" />
          {ingresos > 0 && (
            <circle
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${ingLen} ${C - ingLen}`}
              strokeDashoffset="0"
            />
          )}
          {egresos > 0 && (
            <circle
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke="var(--danger)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${egrLen} ${C - egrLen}`}
              strokeDashoffset={-ingLen}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase tracking-wider text-[var(--text2)]">Saldo</span>
          <span className={`text-sm font-bold ${saldo >= 0 ? 'text-[var(--primary)]' : 'text-[var(--danger)]'}`}>
            {dinero(saldo)}
          </span>
        </div>
      </div>

      <div className="w-full mt-5 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-[var(--text2)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]" /> Ingresos
          </span>
          <span className="font-semibold text-[var(--primary)]">{dinero(ingresos)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-[var(--text2)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--danger)]" /> Egresos
          </span>
          <span className="font-semibold text-[var(--danger)]">{dinero(egresos)}</span>
        </div>
      </div>
    </div>
  );
}

export function DesgloseCategorias({ movimientos }: { movimientos: Movimiento[] }) {
  const categorias = useMemo(() => {
    return desglosePorCategoria(movimientos)
      .map((d) => ({ ...d, total: d.ingreso + d.egreso }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [movimientos]);

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
      <div className="flex items-center justify-between mb-5">
        <h4 className="font-semibold text-[var(--text)] flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-[var(--primary)]" />
          Distribución por categoría
        </h4>
        <div className="flex items-center gap-3 text-xs text-[var(--text2)]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--primary)]" /> Ingresos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--danger)]" /> Egresos
          </span>
        </div>
      </div>

      {categorias.length === 0 ? (
        <p className="text-center text-xs text-[var(--text2)] py-8">Sin movimientos cargados.</p>
      ) : (
        <div className="space-y-4">
          {categorias.map((c) => {
            const pctIngreso = c.total > 0 ? (c.ingreso / c.total) * 100 : 0;
            return (
              <div key={c.categoria}>
                <div className="flex items-center justify-between mb-1.5 text-sm">
                  <span className="font-medium text-[var(--text)] truncate">{etiquetaCategoria(c.categoria)}</span>
                  <span className="text-[var(--text2)]">{dinero(c.total)}</span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden bg-[var(--gray-soft)]">
                  {c.ingreso > 0 && (
                    <div
                      className="bg-[var(--primary)]"
                      style={{ width: `${pctIngreso}%` }}
                      title={`Ingresos ${dinero(c.ingreso)}`}
                    />
                  )}
                  {c.egreso > 0 && (
                    <div
                      className="bg-[var(--danger)]"
                      style={{ width: `${100 - pctIngreso}%` }}
                      title={`Egresos ${dinero(c.egreso)}`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
