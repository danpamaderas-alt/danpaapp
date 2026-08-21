import { useMemo, useState } from 'react';
import {
  FileDown,
  Printer,
  Wallet,
  Clock,
  CheckCircle2,
  HardHat,
  UsersRound,
  History,
  FileText,
  Briefcase,
  Trash2,
  Scissors,
} from 'lucide-react';
import { dinero, hoyISO } from '../lib/format';
import { descargarTexto } from '../lib/informes';
import {
  etiquetaEstadoTrabajo,
  claseEstadoTrabajo,
  etiquetaEvento,
  claseEvento,
  type Contratista,
  type TrabajoContratista,
  type EventoContratista,
  type PagoContratista,
} from '../lib/contratistas';

const CLAVE_CONTRATISTA = 'danpa_informe_contratista_id';
const CLAVE_DESDE = 'danpa_informe_contratista_desde';
const CLAVE_HASTA = 'danpa_informe_contratista_hasta';

const leerPref = (clave: string): string => {
  try {
    return localStorage.getItem(clave) || '';
  } catch {
    return '';
  }
};

const guardarPref = (clave: string, valor: string) => {
  try {
    localStorage.setItem(clave, valor);
  } catch {}
};

const enRango = (fecha: string, desde: string, hasta: string) => {
  if (!desde && !hasta) return true;
  if (desde && fecha < desde) return false;
  if (hasta && fecha > hasta) return false;
  return true;
};

interface ContratistasInformeProps {
  contratistas: Contratista[];
  trabajos: TrabajoContratista[];
  eventos: EventoContratista[];
  pagos: PagoContratista[];
  onAnularPago?: (pago: PagoContratista) => void;
}

export default function ContratistasInforme({ contratistas, trabajos, eventos, pagos, onAnularPago }: ContratistasInformeProps) {
  const [contratistaFiltro, setContratistaFiltro] = useState(() => leerPref(CLAVE_CONTRATISTA));
  const [desde, setDesde] = useState(() => leerPref(CLAVE_DESDE) || `${new Date().getFullYear()}-01-01`);
  const [hasta, setHasta] = useState(() => leerPref(CLAVE_HASTA) || hoyISO());

  const cambiarContratista = (v: string) => {
    setContratistaFiltro(v);
    guardarPref(CLAVE_CONTRATISTA, v);
  };
  const cambiarDesde = (v: string) => {
    setDesde(v);
    guardarPref(CLAVE_DESDE, v);
  };
  const cambiarHasta = (v: string) => {
    setHasta(v);
    guardarPref(CLAVE_HASTA, v);
  };

  const nombreContratista = useMemo(
    () => Object.fromEntries(contratistas.map((c) => [c.id, c.nombre])),
    [contratistas]
  );

  const traFiltrados = useMemo(
    () =>
      trabajos
        .filter((t) => !contratistaFiltro || t.contratista_id === contratistaFiltro)
        .filter((t) => enRango(t.fecha, desde, hasta))
        .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [trabajos, contratistaFiltro, desde, hasta]
  );

  const evFiltrados = useMemo(
    () =>
      eventos
        .filter((e) => !contratistaFiltro || e.contratista_id === contratistaFiltro)
        .filter((e) => enRango(e.fecha, desde, hasta))
        .sort((a, b) => (b.created_at || b.fecha).localeCompare(a.created_at || a.fecha)),
    [eventos, contratistaFiltro, desde, hasta]
  );

  const pagosFiltrados = useMemo(
    () =>
      pagos
        .filter((p) => !contratistaFiltro || p.contratista_id === contratistaFiltro)
        .filter((p) => enRango(p.fecha, desde, hasta))
        .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [pagos, contratistaFiltro, desde, hasta]
  );

  const trabajoPorId = useMemo(
    () => Object.fromEntries(trabajos.map((t) => [t.id, t])),
    [trabajos]
  );

  const pagadoPorTrabajoMap = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const p of pagos) mapa[p.trabajo_id] = (mapa[p.trabajo_id] || 0) + p.monto;
    return mapa;
  }, [pagos]);

  const totalContratado = useMemo(() => traFiltrados.reduce((a, t) => a + t.costo, 0), [traFiltrados]);
  const totalPagado = useMemo(() => pagosFiltrados.reduce((a, p) => a + p.monto, 0), [pagosFiltrados]);
  const totalArboles = useMemo(
    () => traFiltrados.reduce((a, t) => a + (t.cantidad_arboles || 0), 0),
    [traFiltrados]
  );

  const eventosPorTipo = useMemo(() => {
    const conteo = new Map<string, number>();
    for (const e of evFiltrados) conteo.set(e.tipo, (conteo.get(e.tipo) || 0) + 1);
    return [...conteo.entries()].sort((a, b) => b[1] - a[1]);
  }, [evFiltrados]);

  const kpis = useMemo(() => {
    return [
      { label: 'Total contratado', valor: dinero(totalContratado), Icon: HardHat, fondo: 'bg-[var(--blue-soft)]', iconColor: 'text-[var(--text)]' },
      { label: 'Total pagado', valor: dinero(totalPagado), Icon: CheckCircle2, fondo: 'bg-[var(--primary-soft)]', iconColor: 'text-[var(--primary-deep)]' },
      { label: 'Pendiente de pago', valor: dinero(Math.max(0, totalContratado - totalPagado)), Icon: Clock, fondo: 'bg-[var(--amber-soft2)]', iconColor: 'text-[var(--amber-text2)]' },
      { label: 'Árboles podados', valor: String(totalArboles), Icon: Scissors, fondo: 'bg-[var(--amber-soft3)]', iconColor: 'text-[var(--primary-deep)]' },
      { label: 'Trabajos / pagos', valor: `${traFiltrados.length} / ${pagosFiltrados.length}`, Icon: Wallet, fondo: 'bg-[var(--gray-soft)]', iconColor: 'text-[var(--text2)]' },
    ];
  }, [totalContratado, totalPagado, totalArboles, traFiltrados, pagosFiltrados]);

  const resumenPorContratista = useMemo(() => {
    return contratistas
      .filter((c) => !contratistaFiltro || c.id === contratistaFiltro)
      .map((c) => {
        const liqs = traFiltrados.filter((t) => t.contratista_id === c.id);
        const pagado = pagosFiltrados.filter((p) => p.contratista_id === c.id).reduce((a, p) => a + p.monto, 0);
        const contratado = liqs.reduce((a, t) => a + t.costo, 0);
        return {
          contratista: c,
          contratado,
          pagado,
          pendiente: Math.max(0, contratado - pagado),
          cantidadTrabajos: liqs.length,
          cantidadPagos: pagosFiltrados.filter((p) => p.contratista_id === c.id).length,
          arboles: liqs.reduce((a, t) => a + (t.cantidad_arboles || 0), 0),
          eventos: evFiltrados.filter((e) => e.contratista_id === c.id).length,
        };
      })
      .filter((r) => r.cantidadTrabajos > 0 || r.cantidadPagos > 0)
      .sort((a, b) => b.pagado - a.pagado || a.contratista.nombre.localeCompare(b.contratista.nombre));
  }, [contratistas, traFiltrados, pagosFiltrados, evFiltrados, contratistaFiltro]);

  const informeProsa = useMemo(() => {
    if (!traFiltrados.length && !pagosFiltrados.length) {
      return `No se registraron trabajos ni pagos de subcontratados en el período seleccionado${contratistaFiltro ? ` para ${nombreContratista[contratistaFiltro] || 'el contratista'}` : ''}.`;
    }
    let texto = '';
    if (traFiltrados.length > 0) {
      texto += `En el período se contrataron ${traFiltrados.length} ${traFiltrados.length === 1 ? 'trabajo' : 'trabajos'} por un total de ${dinero(totalContratado)}`;
      const conParcial = traFiltrados.filter((t) => t.estado === 'parcial').length;
      if (conParcial > 0) texto += `, de los cuales ${conParcial} tienen pagos parciales`;
      texto += '. ';
      if (totalArboles > 0) {
        texto += `En total se podaron ${totalArboles} ${totalArboles === 1 ? 'árbol' : 'árboles'}`;
        const arbolesPorContratista = new Map<string, number>();
        for (const t of traFiltrados) {
          if (t.cantidad_arboles) arbolesPorContratista.set(t.contratista_id, (arbolesPorContratista.get(t.contratista_id) || 0) + t.cantidad_arboles);
        }
        const ordenArboles = [...arbolesPorContratista.entries()].sort((a, b) => b[1] - a[1]);
        if (ordenArboles.length > 0) {
          texto += `, destacándose ${nombreContratista[ordenArboles[0][0]] || '—'} con ${ordenArboles[0][1]}`;
          if (ordenArboles.length > 1) {
            const resto = ordenArboles.slice(1, 4).map(([id, n]) => `${nombreContratista[id] || '—'} (${n})`);
            texto += `, seguido de ${resto.join(', ')}`;
          }
        }
        texto += '. ';
      }
    }
    if (pagosFiltrados.length > 0) {
      texto += `Se efectuaron ${pagosFiltrados.length} ${pagosFiltrados.length === 1 ? 'pago' : 'pagos'} por ${dinero(totalPagado)}`;
      const porContratista = new Map<string, number>();
      for (const p of pagosFiltrados) porContratista.set(p.contratista_id, (porContratista.get(p.contratista_id) || 0) + p.monto);
      const orden = [...porContratista.entries()].sort((a, b) => b[1] - a[1]);
      texto += `. Quien más cobró fue ${nombreContratista[orden[0][0]] || '—'} con ${dinero(orden[0][1])}`;
      if (orden.length > 1) {
        const resto = orden.slice(1, 4).map(([id, m]) => `${nombreContratista[id] || '—'} (${dinero(m)})`);
        texto += `, seguido de ${resto.join(', ')}`;
      }
      texto += '.';
    }
    const pendiente = Math.max(0, totalContratado - totalPagado);
    if (pendiente > 0) {
      texto += ` Quedan ${dinero(pendiente)} pendientes de pago.`;
    } else if (traFiltrados.length > 0) {
      texto += ' No quedan saldos pendientes de pago.';
    }
    if (evFiltrados.length > 0) {
      texto += ` Se registraron ${evFiltrados.length} eventos en el historial.`;
    }
    return texto;
  }, [traFiltrados, pagosFiltrados, evFiltrados, totalContratado, totalPagado, totalArboles, contratistaFiltro, nombreContratista]);

  const exportarCSV = () => {
    const escapar = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['Contratista', 'Fecha', 'Descripción', 'Lugar', 'N° contrato', 'N° remito', 'Árboles podados', 'Costo', 'Estado', 'Fecha de pago'];
    const filas = traFiltrados.map((t) => [
      nombreContratista[t.contratista_id] || '—',
      t.fecha,
      t.descripcion,
      t.lugar || '',
      t.nro_contrato || '',
      t.nro_remito || '',
      t.cantidad_arboles ?? '',
      t.costo,
      etiquetaEstadoTrabajo(t.estado),
      t.fecha_pago || '',
    ]);
    const headerPagos = ['PAGO: Contratista', 'Fecha', 'Trabajo', 'Remito', 'Medio', 'Monto', 'Notas'];
    const filasPagos = pagosFiltrados.map((p) => {
      const tr = trabajoPorId[p.trabajo_id];
      return [
        nombreContratista[p.contratista_id] || '—',
        p.fecha,
        tr?.descripcion || '',
        tr?.nro_remito || '',
        p.metodo || '',
        p.monto,
        p.notas || '',
      ];
    });
    const headerEventos = ['EVENTO: Contratista', 'Fecha', 'Tipo', 'Descripción', 'Monto'];
    const filasEventos = evFiltrados.map((e) => [
      nombreContratista[e.contratista_id] || '—',
      e.fecha,
      etiquetaEvento(e.tipo),
      e.descripcion,
      e.monto ?? '',
    ]);
    const csv = [header, ...filas, [''], headerPagos, ...filasPagos, [''], headerEventos, ...filasEventos]
      .map((f) => f.map(escapar).join(';'))
      .join('\n');
    const quien = contratistaFiltro ? `_${(nombreContratista[contratistaFiltro] || 'contratista').replace(/\s+/g, '_').toLowerCase()}` : '';
    descargarTexto(`informe_subcontratados${quien}_${desde}_${hasta}.csv`, csv, 'text/csv;charset=utf-8');
  };

  const hayDatos = traFiltrados.length > 0 || evFiltrados.length > 0 || pagosFiltrados.length > 0;

  return (
    <>
      <div className="no-print bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 mb-8 flex flex-col lg:flex-row lg:items-end gap-4">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-2">Contratista</label>
          <select
            value={contratistaFiltro}
            onChange={(e) => cambiarContratista(e.target.value)}
            className="w-full h-11 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)] text-sm"
          >
            <option value="">Todos los contratistas</option>
            {contratistas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}{c.activo ? '' : ' (inactivo)'}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label className="block text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-2">Desde</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => cambiarDesde(e.target.value)}
            className="w-full h-11 px-3 rounded-lg border border-[var(--border)] bg-[var(--field)] text-sm"
          />
        </div>
        <div className="min-w-[160px]">
          <label className="block text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-2">Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => cambiarHasta(e.target.value)}
            className="w-full h-11 px-3 rounded-lg border border-[var(--border)] bg-[var(--field)] text-sm"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportarCSV}
            disabled={!traFiltrados.length}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-[var(--field)] transition-colors disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--primary-deep)] transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </div>

      {!hayDatos ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-12 text-center text-[var(--text2)]">
          <Briefcase className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
          <p>No hay trabajos ni eventos de subcontratados en el período seleccionado.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6 mb-8">
            {kpis.map((k, i) => (
              <div key={i} className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)]">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-[var(--text2)]">{k.label}</p>
                  <div className={`p-2 rounded-lg ${k.fondo}`}>
                    <k.Icon className={`w-5 h-5 ${k.iconColor}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-[var(--text)]">{k.valor}</p>
              </div>
            ))}
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-[var(--text)] mb-2">Resumen del período</h3>
            <p className="text-[var(--text2)] leading-relaxed">{informeProsa}</p>
          </div>

          {resumenPorContratista.length > 0 && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden mb-8">
              <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--border)] bg-[var(--blue-header)]">
                <UsersRound className="w-5 h-5 text-[var(--text2)]" />
                <h3 className="text-lg font-semibold text-[var(--text)]">Pagos por contratista</h3>
              </div>
              <div className="hidden md:grid grid-cols-[1.6fr_1fr_1fr_1fr_0.7fr_0.7fr_0.7fr] gap-4 px-6 py-3 bg-[var(--field)] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wider text-[var(--text2)]">
                <span>Contratista</span>
                <span>Contratado</span>
                <span>Pagado</span>
                <span>Pendiente</span>
                <span>Trabajos</span>
                <span>Pagos</span>
                <span>Árboles</span>
              </div>
              <div className="divide-y divide-[var(--border)]/60">
                {resumenPorContratista.map((r) => (
                  <div key={r.contratista.id} className="grid md:grid-cols-[1.6fr_1fr_1fr_1fr_0.7fr_0.7fr_0.7fr] gap-2 md:gap-4 items-center px-6 py-4">
                    <div>
                      <p className="font-semibold text-[var(--text)] truncate">{r.contratista.nombre}</p>
                      <p className="text-xs text-[var(--text2)] md:hidden">
                        Pagado {dinero(r.pagado)} · Pendiente {dinero(r.pendiente)} · {r.cantidadTrabajos} trabajos{r.arboles > 0 ? ` · ${r.arboles} árboles` : ''}
                      </p>
                    </div>
                    <p className="text-[var(--text)] text-sm hidden md:block font-medium">{dinero(r.contratado)}</p>
                    <p className="text-[var(--primary-deep)] text-sm hidden md:block font-bold">{dinero(r.pagado)}</p>
                    <p className={`text-sm hidden md:block font-medium ${r.pendiente > 0 ? 'text-[var(--amber-text2)]' : 'text-[var(--text2)]'}`}>
                      {dinero(r.pendiente)}
                    </p>
                    <p className="text-[var(--text2)] text-sm hidden md:block">{r.cantidadTrabajos}</p>
                    <p className="text-[var(--text2)] text-sm hidden md:block">{r.cantidadPagos}</p>
                    <p className={`text-sm hidden md:block ${r.arboles > 0 ? 'font-bold text-[var(--primary-deep)]' : 'text-[var(--text2)]'}`}>{r.arboles}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {traFiltrados.length > 0 && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden mb-8">
              <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--border)] bg-[var(--blue-header)]">
                <FileText className="w-5 h-5 text-[var(--text2)]" />
                <h3 className="text-lg font-semibold text-[var(--text)]">Detalle de trabajos (contrato y remito)</h3>
                <span className="ml-auto text-sm text-[var(--text2)]">{traFiltrados.length} registros</span>
              </div>
              <div className="hidden md:grid grid-cols-[1.4fr_1fr_1.6fr_0.9fr_0.9fr_0.9fr_1fr_1fr] gap-4 px-6 py-3 bg-[var(--field)] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wider text-[var(--text2)]">
                <span>Contratista</span>
                <span>Fecha</span>
                <span>Descripción</span>
                <span>Contrato</span>
                <span>Remito</span>
                <span>Costo</span>
                <span>Estado</span>
                <span>Pago</span>
              </div>
              <div className="divide-y divide-[var(--border)]/60 max-h-[520px] overflow-y-auto">
                {traFiltrados.map((t) => (
                  <div key={t.id} className="grid md:grid-cols-[1.4fr_1fr_1.6fr_0.9fr_0.9fr_0.9fr_1fr_1fr] gap-2 md:gap-4 items-center px-6 py-4">
                    <p className="font-semibold text-[var(--text)] truncate">{nombreContratista[t.contratista_id] || '—'}</p>
                    <p className="text-[var(--text2)] text-sm hidden md:block">{t.fecha}</p>
                    <div className="min-w-0">
                      <p className="text-[var(--text)] text-sm truncate">{t.descripcion}</p>
                      {t.lugar && <p className="text-xs text-[var(--text2)] truncate">{t.lugar}</p>}
                      {t.cantidad_arboles != null && t.cantidad_arboles > 0 && (
                        <p className="text-xs text-[var(--primary-deep)] font-semibold flex items-center gap-1">
                          <Scissors className="w-3 h-3 flex-shrink-0" />
                          {t.cantidad_arboles} {t.cantidad_arboles === 1 ? 'árbol podado' : 'árboles podados'}
                        </p>
                      )}
                    </div>
                    <p className="text-[var(--text2)] text-sm hidden md:block truncate">{t.nro_contrato || '—'}</p>
                    <p className="text-[var(--text2)] text-sm hidden md:block truncate">{t.nro_remito || '—'}</p>
                    <div className="min-w-0">
                      <p className="text-[var(--text)] text-sm hidden md:block font-medium">{dinero(t.costo)}</p>
                      {pagadoPorTrabajoMap[t.id] > 0 && pagadoPorTrabajoMap[t.id] < t.costo - 0.009 && (
                        <p className="text-xs text-[var(--primary-deep)] font-semibold">Pagado {dinero(pagadoPorTrabajoMap[t.id])}</p>
                      )}
                    </div>
                    <span className={`justify-self-start text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded ${claseEstadoTrabajo(t.estado)}`}>
                      {etiquetaEstadoTrabajo(t.estado)}
                    </span>
                    <p className="text-[var(--text2)] text-sm hidden md:block">{t.fecha_pago || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pagosFiltrados.length > 0 && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden mb-8">
              <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--border)] bg-[var(--blue-header)]">
                <Wallet className="w-5 h-5 text-[var(--text2)]" />
                <h3 className="text-lg font-semibold text-[var(--text)]">Historial de pagos</h3>
                <span className="ml-auto text-sm font-bold text-[var(--primary-deep)]">{dinero(totalPagado)}</span>
              </div>
              <div className="hidden md:grid grid-cols-[1.4fr_0.9fr_1.8fr_0.9fr_0.9fr_1fr_90px] gap-4 px-6 py-3 bg-[var(--field)] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wider text-[var(--text2)]">
                <span>Contratista</span>
                <span>Fecha</span>
                <span>Trabajo</span>
                <span>Remito</span>
                <span>Medio</span>
                <span>Monto</span>
                <span className="text-right no-print">Acción</span>
              </div>
              <div className="divide-y divide-[var(--border)]/60 max-h-[420px] overflow-y-auto">
                {pagosFiltrados.map((p) => {
                  const tr = trabajoPorId[p.trabajo_id];
                  return (
                    <div key={p.id} className="grid md:grid-cols-[1.4fr_0.9fr_1.8fr_0.9fr_0.9fr_1fr_90px] gap-2 md:gap-4 items-center px-6 py-4">
                      <p className="font-semibold text-[var(--text)] truncate">{nombreContratista[p.contratista_id] || '—'}</p>
                      <p className="text-[var(--text)] text-sm hidden md:block font-medium">{p.fecha}</p>
                      <div className="min-w-0">
                        <p className="text-[var(--text2)] text-sm truncate">{tr?.descripcion || '—'}</p>
                        {p.notas && <p className="text-xs text-[var(--text2)] truncate">{p.notas}</p>}
                      </div>
                      <p className="text-[var(--text2)] text-sm hidden md:block truncate">{tr?.nro_remito || '—'}</p>
                      <p className="text-[var(--text2)] text-sm hidden md:block truncate">{p.metodo || '—'}</p>
                      <p className="text-[var(--primary-deep)] text-sm font-bold">{dinero(p.monto)}</p>
                      {onAnularPago && (
                        <div className="flex justify-end no-print">
                          <button
                            onClick={() => onAnularPago(p)}
                            title="Anular pago"
                            className="p-2 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:text-[var(--danger-deep)] hover:bg-[var(--danger-soft)] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {evFiltrados.length > 0 && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--border)] bg-[var(--blue-header)] flex-wrap">
                <History className="w-5 h-5 text-[var(--text2)]" />
                <h3 className="text-lg font-semibold text-[var(--text)]">Historial de eventos</h3>
                <span className="text-sm text-[var(--text2)]">{evFiltrados.length} eventos</span>
                <div className="ml-auto flex flex-wrap gap-2 no-print">
                  {eventosPorTipo.map(([tipo, n]) => (
                    <span key={tipo} className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded ${claseEvento(tipo)}`}>
                      {etiquetaEvento(tipo)}: {n}
                    </span>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-[var(--border)]/60 max-h-[420px] overflow-y-auto">
                {evFiltrados.map((e) => (
                  <div key={e.id} className="flex items-start gap-4 px-6 py-4">
                    <span className={`flex-shrink-0 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded ${claseEvento(e.tipo)}`}>
                      {etiquetaEvento(e.tipo)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[var(--text)]">{e.descripcion}</p>
                      <p className="text-xs text-[var(--text2)] mt-0.5">
                        {nombreContratista[e.contratista_id] || '—'}
                        {e.monto != null && e.monto > 0 ? ` · ${dinero(e.monto)}` : ''}
                        {' · '}
                        {new Date(e.created_at).toLocaleString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
