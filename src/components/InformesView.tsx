import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchMovimientos, desglosePorCategoria, calcularSaldo, type Movimiento } from '../lib/finanzas';
import { fetchPodas, TIPOS_PODA, type Poda } from '../lib/podas';
import { rangoDeMes, movimientosCSV, podasCSV, descargarTexto, informeEscrito } from '../lib/informes';
import { generarPDFInforme, TODAS_SECCIONES, type SeccionesInforme } from '../lib/pdf';
import { dinero, hoyISO, getErrorMessage } from '../lib/format';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  Trees,
  Loader2,
  AlertCircle,
  Printer,
  Download,
  Calendar,
  Scissors,
  FileText,
  ListChecks,
} from 'lucide-react';

const OPCIONES_SECCION: { id: keyof SeccionesInforme; label: string }[] = [
  { id: 'resumen', label: 'Resumen del mes' },
  { id: 'escrito', label: 'Informe escrito' },
  { id: 'finanzas', label: 'Finanzas por categoría' },
  { id: 'movimientos', label: 'Movimientos del mes' },
  { id: 'podas', label: 'Podas por tipo' },
];

interface InformesViewProps {
  corredorId: string;
}

const etiquetaCategoria = (c: string) =>
  c.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

const CLAVE_MES = 'danpa_informes_mes';
const CLAVE_SECCIONES = 'danpa_informes_seleccion';

const cargarMes = (): string => {
  try {
    return localStorage.getItem(CLAVE_MES) ?? hoyISO().slice(0, 7);
  } catch {
    return hoyISO().slice(0, 7);
  }
};

const cargarSeleccion = (): SeccionesInforme => {
  try {
    const raw = localStorage.getItem(CLAVE_SECCIONES);
    if (!raw) return { ...TODAS_SECCIONES };
    const parsed = JSON.parse(raw) as Partial<SeccionesInforme>;
    const base = { ...TODAS_SECCIONES };
    (Object.keys(base) as (keyof SeccionesInforme)[]).forEach((k) => {
      if (typeof parsed[k] === 'boolean') base[k] = parsed[k] as boolean;
    });
    return base;
  } catch {
    return { ...TODAS_SECCIONES };
  }
};

export default function InformesView({ corredorId }: InformesViewProps) {
  const [mes, setMes] = useState(cargarMes);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [podas, setPodas] = useState<Poda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seleccion, setSeleccion] = useState<SeccionesInforme>(cargarSeleccion);

  const guardarSeleccion = (next: SeccionesInforme) => {
    setSeleccion(next);
    try {
      localStorage.setItem(CLAVE_SECCIONES, JSON.stringify(next));
    } catch {
      /* sin almacenamiento */
    }
  };

  const cambiarMes = (m: string) => {
    setMes(m);
    try {
      localStorage.setItem(CLAVE_MES, m);
    } catch {
      /* sin almacenamiento */
    }
  };

  const toggleSeccion = (k: keyof SeccionesInforme) => guardarSeleccion({ ...seleccion, [k]: !seleccion[k] });

  const rango = useMemo(() => rangoDeMes(mes), [mes]);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [mv, pd] = await Promise.all([
        fetchMovimientos({ corredorId, desde: rango.desde, hasta: rango.hasta }),
        fetchPodas(corredorId, { desde: rango.desde, hasta: rango.hasta }),
      ]);
      setMovimientos(mv);
      setPodas(pd);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, 'Error al cargar el informe.'));
    } finally {
      setLoading(false);
    }
  }, [corredorId, rango]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const ingresos = useMemo(
    () => movimientos.filter((m) => m.monto >= 0).reduce((a, m) => a + m.monto, 0),
    [movimientos]
  );
  const egresos = useMemo(
    () => movimientos.filter((m) => m.monto < 0).reduce((a, m) => a + Math.abs(m.monto), 0),
    [movimientos]
  );
  const saldo = useMemo(() => calcularSaldo(movimientos), [movimientos]);
  const totalArboles = useMemo(() => podas.reduce((a, p) => a + (p.cantidad_arboles || 0), 0), [podas]);
  const desglose = useMemo(() => desglosePorCategoria(movimientos), [movimientos]);
  const maxDesglose = Math.max(1, ...desglose.map((d) => d.egreso));

  const podasPorTipo = useMemo(
    () =>
      TIPOS_PODA.map((t) => {
        const lista = podas.filter((p) => p.tipo_poda === t.valor);
        return {
          ...t,
          trabajos: lista.length,
          arboles: lista.reduce((a, p) => a + (p.cantidad_arboles || 0), 0),
        };
      }),
    [podas]
  );
  const podasSinTipo = useMemo(() => podas.filter((p) => !p.tipo_poda), [podas]);

  const datosInforme = useMemo(
    () => ({
      rango,
      movimientos,
      podas,
      ingresos,
      egresos,
      saldo,
      desglose,
      podasPorTipo,
      podasSinTipo: podasSinTipo.length,
      totalArboles,
    }),
    [rango, movimientos, podas, ingresos, egresos, saldo, desglose, podasPorTipo, podasSinTipo, totalArboles]
  );

  const escrito = useMemo(() => informeEscrito(datosInforme), [datosInforme]);

  const kpi = [
    {
      label: 'Ingresos',
      valor: dinero(ingresos),
      clase: 'text-[var(--primary)]',
      Icon: TrendingUp,
      fondo: 'bg-[var(--primary-soft)]',
      iconColor: 'text-[var(--primary-green)]',
    },
    {
      label: 'Egresos / Gastos',
      valor: dinero(egresos),
      clase: 'text-[var(--danger)]',
      Icon: TrendingDown,
      fondo: 'bg-[var(--danger-soft)]',
      iconColor: 'text-[var(--danger)]',
    },
    {
      label: 'Saldo del mes',
      valor: dinero(saldo),
      clase: saldo >= 0 ? 'text-[var(--primary)]' : 'text-[var(--danger)]',
      Icon: Wallet,
      fondo: 'bg-[var(--blue-soft)]',
      iconColor: 'text-[var(--text)]',
    },
    {
      label: 'Árboles podados',
      valor: `${totalArboles} (${podas.length} trabajos)`,
      clase: 'text-[var(--text)]',
      Icon: Trees,
      fondo: 'bg-[var(--gray-soft)]',
      iconColor: 'text-[var(--text)]',
    },
  ];

  const exportarMovimientosCSV = () => {
    descargarTexto(`movimientos_${mes}.csv`, movimientosCSV(movimientos), 'text/csv;charset=utf-8');
  };
  const exportarPodasCSV = () => {
    descargarTexto(`podas_${mes}.csv`, podasCSV(podas), 'text/csv;charset=utf-8');
  };

  const exportarPDF = async () => {
    await generarPDFInforme(datosInforme, seleccion);
  };

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-[1440px] mx-auto w-full">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text)] tracking-tight">Informes</h2>
          <p className="text-[var(--text2)] mt-1">Resumen mensual de finanzas y podas.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--text2)]" />
            <input
              type="month"
              value={mes}
              onChange={(e) => cambiarMes(e.target.value)}
              className="h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)] text-[var(--text)]"
            />
          </div>
          <button
            onClick={exportarPDF}
            className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors bg-[var(--primary)] text-white hover:bg-[var(--primary-deep)] flex items-center justify-center gap-2 shadow-sm"
          >
            <FileText className="w-4 h-4" />
            Descargar PDF
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--blue-header)] flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </div>

      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 mb-8 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h3 className="font-semibold text-[var(--text)] flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-[var(--text2)]" />
            Qué incluir en el informe
          </h3>
          <div className="flex gap-3 text-sm">
            <button
              onClick={() => guardarSeleccion({ ...TODAS_SECCIONES })}
              className="text-[var(--primary)] font-medium hover:underline"
            >
              Marcar todas
            </button>
            <button
              onClick={() =>
                guardarSeleccion({ resumen: false, escrito: false, finanzas: false, movimientos: false, podas: false })
              }
              className="text-[var(--text2)] font-medium hover:underline"
            >
              Quitar todas
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2.5">
          {OPCIONES_SECCION.map((o) => (
            <label key={o.id} className="flex items-center gap-2 text-sm text-[var(--text)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={seleccion[o.id]}
                onChange={() => toggleSeccion(o.id)}
                className="w-4 h-4 accent-[var(--primary)]"
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-[var(--danger-soft)] text-[var(--danger-deep)] p-4 rounded-xl flex items-start gap-4 mb-8 no-print">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-[var(--text2)]">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-[var(--primary)]" />
          <p>Cargando informe...</p>
        </div>
      ) : (
        <div id="contenido-informe">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[var(--text)] capitalize">{rango.etiqueta}</h3>
            <p className="text-sm text-[var(--text2)]">
              {movimientos.length} movimientos · {podas.length} trabajos de poda
            </p>
          </div>

          {seleccion.resumen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              {kpi.map((k) => (
                <div key={k.label} className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)]">
                  <div className={`p-2 rounded-lg w-fit mb-4 ${k.fondo}`}>
                    <k.Icon className={`w-5 h-5 ${k.iconColor}`} />
                  </div>
                  <h3 className="text-[var(--text2)] text-xs font-semibold uppercase tracking-wider mb-1">{k.label}</h3>
                  <div className={`text-2xl font-bold ${k.clase}`}>{k.valor}</div>
                </div>
              ))}
            </div>
          )}

          {seleccion.escrito && (
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 mb-8">
              <h3 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[var(--text2)]" />
                Informe escrito
              </h3>
              <div className="space-y-4">
                {escrito.map((p, i) => (
                  <p key={i} className={`text-sm leading-relaxed text-[var(--text)] ${i === escrito.length - 1 ? 'font-medium' : ''}`}>
                    {p}
                  </p>
                ))}
              </div>
            </div>
          )}

          {(seleccion.finanzas || seleccion.podas) && (
            <div className={`grid gap-6 mb-8 ${seleccion.finanzas && seleccion.podas ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              {seleccion.finanzas && (
                <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-semibold text-[var(--text)]">Finanzas por Categoría</h3>
                <button
                  onClick={exportarMovimientosCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary-soft)] transition-colors"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
              </div>
              {desglose.length === 0 ? (
                <p className="text-sm text-[var(--text2)]">Sin movimientos en el mes.</p>
              ) : (
                <div className="space-y-4">
                  {desglose.map((d) => (
                    <div key={d.categoria}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-[var(--text)]">{etiquetaCategoria(d.categoria)}</span>
                        <span className="text-[var(--danger)] font-semibold">-{dinero(d.egreso)}</span>
                      </div>
                      <div className="h-2 bg-[var(--blue-header)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--primary)] rounded-full transition-all"
                          style={{ width: `${(d.egreso / maxDesglose) * 100}%` }}
                        />
                      </div>
                      {d.ingreso > 0 && (
                        <p className="text-xs text-[var(--primary)] mt-1">+{dinero(d.ingreso)} de ingresos</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}

            {seleccion.podas && (
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-semibold text-[var(--text)]">Podas por Tipo</h3>
                <button
                  onClick={exportarPodasCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary-soft)] transition-colors"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
              </div>
              {podas.length === 0 ? (
                <p className="text-sm text-[var(--text2)]">Sin podas en el mes.</p>
              ) : (
                <div className="space-y-4">
                  {podasPorTipo.map((t) => (
                    <div key={t.valor}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-[var(--text)]">{t.etiqueta}</span>
                        <span className="text-[var(--text2)]">{t.arboles} árboles · {t.trabajos} trabajos</span>
                      </div>
                      <div className="h-2 bg-[var(--blue-header)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--primary)] rounded-full transition-all"
                          style={{ width: `${(t.arboles / Math.max(1, ...podasPorTipo.map((x) => x.arboles))) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {podasSinTipo.length > 0 && (
                    <p className="text-xs text-[var(--text2)]">
                      {podasSinTipo.length} {podasSinTipo.length === 1 ? 'trabajo tiene' : 'trabajos tienen'} tipo sin especificar.
                    </p>
                  )}
                </div>
              )}
            </div>
            )}
          </div>
          )}

          {seleccion.movimientos && (
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden no-print">
            <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="text-lg font-semibold text-[var(--text)] flex items-center gap-2">
                {movimientos.some((m) => m.monto >= 0) ? <Scissors className="w-4 h-4 text-[var(--text2)]" /> : <BarChart3 className="w-4 h-4 text-[var(--text2)]" />}
                Movimientos del mes
              </h3>
              <span className="text-sm text-[var(--text2)]">{movimientos.length}</span>
            </div>
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead className="sticky top-0 bg-[var(--blue-header)]">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Fecha</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Concepto</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Categoría</th>
                    <th className="px-6 py-3 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)] text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {movimientos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-[var(--text2)]">
                        <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">Sin movimientos</p>
                      </td>
                    </tr>
                  ) : (
                    movimientos.map((m) => (
                      <tr key={m.id} className="hover:bg-[var(--field)] transition-colors">
                        <td className="px-6 py-3 text-[var(--text2)] text-sm whitespace-nowrap">{m.fecha}</td>
                        <td className="px-6 py-3 font-medium text-[var(--text)]">{m.concepto}</td>
                        <td className="px-6 py-3 text-sm text-[var(--text2)]">{etiquetaCategoria(m.categoria)}</td>
                        <td className={`px-6 py-3 text-right font-semibold whitespace-nowrap ${m.monto >= 0 ? 'text-[var(--primary)]' : 'text-[var(--danger)]'}`}>
                          {m.monto >= 0 ? '+' : '-'}{dinero(Math.abs(m.monto))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {Object.values(seleccion).every((v) => !v) && (
            <div className="bg-[var(--surface)] rounded-xl border border-dashed border-[var(--border)] p-10 text-center text-[var(--text2)]">
              <p className="text-sm">No seleccionaste ninguna sección para incluir en el informe.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}