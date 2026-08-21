import { useMemo, useState } from 'react';
import {
  FileDown,
  Printer,
  Wallet,
  Clock,
  CheckCircle2,
  Banknote,
  Users,
  CalendarCheck2,
  Plane,
  Briefcase,
} from 'lucide-react';
import { dinero, hoyISO } from '../lib/format';
import { descargarTexto } from '../lib/informes';
import {
  ESTADOS_ASISTENCIA,
  ESTADOS_LICENCIA,
  ESTADOS_LIQUIDACION,
  TIPOS_LIQUIDACION,
  TIPOS_LICENCIA,
  etiquetaEstado,
  badgeEstado,
  type Empleado,
  type Asistencia,
  type Licencia,
  type Liquidacion,
} from '../lib/rrhh';

const CLAVE_EMPLEADO = 'danpa_informe_sueldos_empleado';
const CLAVE_DESDE = 'danpa_informe_sueldos_desde';
const CLAVE_HASTA = 'danpa_informe_sueldos_hasta';

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

const etiquetaRegimen = (tipo: string) =>
  TIPOS_LIQUIDACION.find((t) => t.valor === tipo)?.etiqueta || tipo;

const enRango = (fecha: string, desde: string, hasta: string) => {
  if (!desde && !hasta) return true;
  if (desde && fecha < desde) return false;
  if (hasta && fecha > hasta) return false;
  return true;
};

interface SueldosInformeProps {
  empleados: Empleado[];
  asistencias: Asistencia[];
  licencias: Licencia[];
  liquidaciones: Liquidacion[];
}

export default function SueldosInforme({ empleados, asistencias, licencias, liquidaciones }: SueldosInformeProps) {
  const [empleadoFiltro, setEmpleadoFiltro] = useState(() => leerPref(CLAVE_EMPLEADO));
  const [desde, setDesde] = useState(() => leerPref(CLAVE_DESDE) || `${new Date().getFullYear()}-01-01`);
  const [hasta, setHasta] = useState(() => leerPref(CLAVE_HASTA) || hoyISO());

  const cambiarEmpleado = (v: string) => {
    setEmpleadoFiltro(v);
    guardarPref(CLAVE_EMPLEADO, v);
  };
  const cambiarDesde = (v: string) => {
    setDesde(v);
    guardarPref(CLAVE_DESDE, v);
  };
  const cambiarHasta = (v: string) => {
    setHasta(v);
    guardarPref(CLAVE_HASTA, v);
  };

  const nombreEmpleado = useMemo(
    () => Object.fromEntries(empleados.map((e) => [e.id, e.nombre])),
    [empleados]
  );

  const liqFiltradas = useMemo(() => {
    const fechaReferencia = (l: Liquidacion) => l.fecha_pago || `${l.periodo.slice(0, 7)}-01`;
    return liquidaciones
      .filter((l) => (!empleadoFiltro || l.empleado_id === empleadoFiltro))
      .filter((l) => enRango(fechaReferencia(l), desde, hasta))
      .sort((a, b) => (b.fecha_pago || b.periodo).localeCompare(a.fecha_pago || a.periodo));
  }, [liquidaciones, empleadoFiltro, desde, hasta]);

  const asisFiltradas = useMemo(
    () =>
      asistencias
        .filter((a) => !empleadoFiltro || a.empleado_id === empleadoFiltro)
        .filter((a) => enRango(a.fecha, desde, hasta)),
    [asistencias, empleadoFiltro, desde, hasta]
  );

  const licFiltradas = useMemo(
    () =>
      licencias
        .filter((l) => !empleadoFiltro || l.empleado_id === empleadoFiltro)
        .filter((l) => l.fecha_desde <= (hasta || '9999') && l.fecha_hasta >= (desde || '0000')),
    [licencias, empleadoFiltro, desde, hasta]
  );

  const kpis = useMemo(() => {
    const pagadas = liqFiltradas.filter((l) => l.estado === 'pagado');
    const pendientes = liqFiltradas.filter((l) => l.estado === 'pendiente');
    const totalPagado = pagadas.reduce((a, l) => a + l.monto, 0);
    const totalPendiente = pendientes.reduce((a, l) => a + l.monto, 0);
    const horasExtra = asisFiltradas.reduce((a, x) => a + (x.horas_extra || 0), 0);
    return [
      { label: 'Total pagado', valor: dinero(totalPagado), Icon: CheckCircle2, fondo: 'bg-[var(--primary-soft)]', iconColor: 'text-[var(--primary-deep)]' },
      { label: 'Pendiente de pago', valor: dinero(totalPendiente), Icon: Clock, fondo: 'bg-[var(--amber-soft2)]', iconColor: 'text-[var(--amber-text2)]' },
      { label: 'Pagos realizados', valor: String(pagadas.length), Icon: Banknote, fondo: 'bg-[var(--blue-soft)]', iconColor: 'text-[var(--text)]' },
      { label: 'Horas extra', valor: `${horasExtra % 1 === 0 ? horasExtra : horasExtra.toFixed(1)} hs`, Icon: Wallet, fondo: 'bg-[var(--gray-soft)]', iconColor: 'text-[var(--text2)]' },
    ];
  }, [liqFiltradas, asisFiltradas]);

  const resumenPorEmpleado = useMemo(() => {
    return empleados
      .filter((e) => !empleadoFiltro || e.id === empleadoFiltro)
      .map((e) => {
        const liqs = liqFiltradas.filter((l) => l.empleado_id === e.id);
        const pagadas = liqs.filter((l) => l.estado === 'pagado');
        const pendientes = liqs.filter((l) => l.estado === 'pendiente');
        const asis = asisFiltradas.filter((a) => a.empleado_id === e.id);
        const contar = (estado: string) => asis.filter((a) => a.estado === estado).length;
        return {
          empleado: e,
          pagado: pagadas.reduce((a, l) => a + l.monto, 0),
          pendiente: pendientes.reduce((a, l) => a + l.monto, 0),
          cantidadPagos: pagadas.length,
          presentes: contar('presente'),
          ausentes: contar('ausente'),
          conLicencia: contar('licencia'),
          mediaJornada: contar('media_jornada'),
          horasExtra: asis.reduce((a, x) => a + (x.horas_extra || 0), 0),
          diasRegistrados: asis.length,
        };
      })
      .sort((a, b) => b.pagado - a.pagado || a.empleado.nombre.localeCompare(b.empleado.nombre));
  }, [empleados, liqFiltradas, asisFiltradas, empleadoFiltro]);

  const resumenAsistencias = useMemo(() => {
    const porEstado = ESTADOS_ASISTENCIA.map((ea) => ({
      ...ea,
      cantidad: asisFiltradas.filter((a) => a.estado === ea.valor).length,
    }));
    return porEstado;
  }, [asisFiltradas]);

  const informeProsa = useMemo(() => {
    const pagadas = liqFiltradas.filter((l) => l.estado === 'pagado');
    const pendientes = liqFiltradas.filter((l) => l.estado === 'pendiente');
    if (!pagadas.length && !pendientes.length) {
      return `No se registraron liquidaciones de sueldo en el período seleccionado${empleadoFiltro ? ` para ${nombreEmpleado[empleadoFiltro] || 'el empleado'}` : ''}.`;
    }
    const totalPagado = pagadas.reduce((a, l) => a + l.monto, 0);
    const totalPendiente = pendientes.reduce((a, l) => a + l.monto, 0);
    let texto = `En el período se pagaron ${pagadas.length} sueldos por un total de ${dinero(totalPagado)}`;
    if (pagadas.length > 0) {
      const porEmpleado = new Map<string, number>();
      for (const l of pagadas) porEmpleado.set(l.empleado_id, (porEmpleado.get(l.empleado_id) || 0) + l.monto);
      const orden = [...porEmpleado.entries()].sort((a, b) => b[1] - a[1]);
      texto += `, correspondientes a ${orden.length} ${orden.length === 1 ? 'empleado' : 'empleados'}. Quien más recibió fue ${nombreEmpleado[orden[0][0]] || '—'} con ${dinero(orden[0][1])}`;
      if (orden.length > 1) {
        const resto = orden.slice(1, 4).map(([id, m]) => `${nombreEmpleado[id] || '—'} (${dinero(m)})`);
        texto += `, seguido de ${resto.join(', ')}`;
      }
      texto += '.';
    }
    if (totalPendiente > 0) {
      texto += ` Quedan ${pendientes.length} ${pendientes.length === 1 ? 'liquidación pendiente' : 'liquidaciones pendientes'} por ${dinero(totalPendiente)}.`;
    } else {
      texto += ' No quedan liquidaciones pendientes de pago.';
    }
    const extras = asisFiltradas.reduce((a, x) => a + (x.horas_extra || 0), 0);
    if (extras > 0) {
      texto += ` Además se registraron ${extras % 1 === 0 ? extras : extras.toFixed(1)} horas extra en el período.`;
    }
    return texto;
  }, [liqFiltradas, asisFiltradas, empleadoFiltro, nombreEmpleado]);

  const exportarCSV = () => {
    const escapar = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['Empleado', 'Período', 'Monto', 'Estado', 'Fecha de pago', 'Notas'];
    const filas = liqFiltradas.map((l) => [
      nombreEmpleado[l.empleado_id] || '—',
      l.periodo,
      l.monto,
      etiquetaEstado(ESTADOS_LIQUIDACION, l.estado),
      l.fecha_pago || '',
      l.notas || '',
    ]);
    const csv = [header, ...filas].map((f) => f.map(escapar).join(';')).join('\n');
    const quien = empleadoFiltro ? `_${(nombreEmpleado[empleadoFiltro] || 'empleado').replace(/\s+/g, '_').toLowerCase()}` : '';
    descargarTexto(`informe_sueldos${quien}_${desde}_${hasta}.csv`, csv, 'text/csv;charset=utf-8');
  };

  const hayDatos = liqFiltradas.length > 0 || asisFiltradas.length > 0 || licFiltradas.length > 0;

  return (
    <>
      <div className="no-print bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 mb-8 flex flex-col lg:flex-row lg:items-end gap-4">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-2">Empleado</label>
          <select
            value={empleadoFiltro}
            onChange={(e) => cambiarEmpleado(e.target.value)}
            className="w-full h-11 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)] text-sm"
          >
            <option value="">Todos los empleados</option>
            {empleados.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}{e.activo ? '' : ' (inactivo)'}
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
            disabled={!liqFiltradas.length}
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
          <p>No hay registros de sueldos, asistencias ni licencias en el período seleccionado.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
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

          {resumenPorEmpleado.length > 0 && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden mb-8">
              <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--border)] bg-[var(--blue-header)]">
                <Users className="w-5 h-5 text-[var(--text2)]" />
                <h3 className="text-lg font-semibold text-[var(--text)]">Sueldos por empleado</h3>
              </div>
              <div className="hidden md:grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-3 bg-[var(--field)] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wider text-[var(--text2)]">
                <span>Empleado</span>
                <span>Régimen</span>
                <span>Pagado</span>
                <span>Pendiente</span>
                <span>Pagos</span>
              </div>
              <div className="divide-y divide-[var(--border)]/60">
                {resumenPorEmpleado.map((r) => (
                  <div key={r.empleado.id} className="grid md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr] gap-2 md:gap-4 items-center px-6 py-4">
                    <div>
                      <p className="font-semibold text-[var(--text)] truncate">{r.empleado.nombre}</p>
                      <p className="text-xs text-[var(--text2)] md:hidden">
                        Pagado {dinero(r.pagado)} · Pendiente {dinero(r.pendiente)}
                      </p>
                    </div>
                    <p className="text-[var(--text2)] text-sm hidden md:block truncate">{etiquetaRegimen(r.empleado.tipo_liquidacion)}</p>
                    <p className="text-[var(--primary-deep)] text-sm hidden md:block font-bold">{dinero(r.pagado)}</p>
                    <p className={`text-sm hidden md:block font-medium ${r.pendiente > 0 ? 'text-[var(--amber-text2)]' : 'text-[var(--text2)]'}`}>
                      {dinero(r.pendiente)}
                    </p>
                    <p className="text-[var(--text)] text-sm hidden md:block font-medium">{r.cantidadPagos}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {liqFiltradas.length > 0 && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden mb-8">
              <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--border)] bg-[var(--blue-header)]">
                <Banknote className="w-5 h-5 text-[var(--text2)]" />
                <h3 className="text-lg font-semibold text-[var(--text)]">Detalle de liquidaciones</h3>
                <span className="ml-auto text-sm text-[var(--text2)]">{liqFiltradas.length} registros</span>
              </div>
              <div className="hidden md:grid grid-cols-[1.6fr_0.9fr_1fr_1fr_1fr_1.6fr] gap-4 px-6 py-3 bg-[var(--field)] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wider text-[var(--text2)]">
                <span>Empleado</span>
                <span>Período</span>
                <span>Monto</span>
                <span>Estado</span>
                <span>Fecha de pago</span>
                <span>Notas</span>
              </div>
              <div className="divide-y divide-[var(--border)]/60 max-h-[520px] overflow-y-auto">
                {liqFiltradas.map((l) => (
                  <div key={l.id} className="grid md:grid-cols-[1.6fr_0.9fr_1fr_1fr_1fr_1.6fr] gap-2 md:gap-4 items-center px-6 py-4">
                    <p className="font-semibold text-[var(--text)] truncate">{nombreEmpleado[l.empleado_id] || '—'}</p>
                    <p className="text-[var(--text2)] text-sm hidden md:block">{l.periodo}</p>
                    <p className="text-[var(--text)] text-sm hidden md:block font-medium">{dinero(l.monto)}</p>
                    <span className={`justify-self-start text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded ${badgeEstado(ESTADOS_LIQUIDACION, l.estado)}`}>
                      {etiquetaEstado(ESTADOS_LIQUIDACION, l.estado)}
                    </span>
                    <p className="text-[var(--text2)] text-sm hidden md:block">{l.fecha_pago || '—'}</p>
                    <p className="text-[var(--text2)] text-sm hidden md:block truncate" title={l.notas || ''}>{l.notas || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {asisFiltradas.length > 0 && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden mb-8">
              <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--border)] bg-[var(--blue-header)]">
                <CalendarCheck2 className="w-5 h-5 text-[var(--text2)]" />
                <h3 className="text-lg font-semibold text-[var(--text)]">Asistencias del período</h3>
              </div>
              <div className="px-6 py-4 border-b border-[var(--border)] flex flex-wrap gap-3">
                {resumenAsistencias.map((ea) => (
                  <span key={ea.valor} className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded ${ea.clase}`}>
                    {ea.etiqueta}: {ea.cantidad}
                  </span>
                ))}
              </div>
              <div className="hidden md:grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-3 bg-[var(--field)] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wider text-[var(--text2)]">
                <span>Empleado</span>
                <span>Presentes</span>
                <span>Ausentes</span>
                <span>Licencia</span>
                <span>Media jor.</span>
                <span>Horas extra</span>
              </div>
              <div className="divide-y divide-[var(--border)]/60 max-h-[420px] overflow-y-auto">
                {resumenPorEmpleado
                  .filter((r) => r.diasRegistrados > 0)
                  .map((r) => (
                    <div key={r.empleado.id} className="grid md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1fr] gap-2 md:gap-4 items-center px-6 py-4">
                      <p className="font-semibold text-[var(--text)] truncate">{r.empleado.nombre}</p>
                      <p className="text-[var(--text)] text-sm hidden md:block font-medium">{r.presentes}</p>
                      <p className={`text-sm hidden md:block font-medium ${r.ausentes > 0 ? 'text-[var(--danger-deep)]' : 'text-[var(--text2)]'}`}>{r.ausentes}</p>
                      <p className="text-[var(--text2)] text-sm hidden md:block">{r.conLicencia}</p>
                      <p className="text-[var(--text2)] text-sm hidden md:block">{r.mediaJornada}</p>
                      <p className={`text-sm hidden md:block font-medium ${r.horasExtra > 0 ? 'text-[var(--text)]' : 'text-[var(--text2)]'}`}>
                        {r.horasExtra ? `${r.horasExtra % 1 === 0 ? r.horasExtra : r.horasExtra.toFixed(1)} hs` : '—'}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {licFiltradas.length > 0 && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--border)] bg-[var(--blue-header)]">
                <Plane className="w-5 h-5 text-[var(--text2)]" />
                <h3 className="text-lg font-semibold text-[var(--text)]">Licencias del período</h3>
              </div>
              <div className="hidden md:grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-3 bg-[var(--field)] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wider text-[var(--text2)]">
                <span>Empleado</span>
                <span>Tipo</span>
                <span>Desde</span>
                <span>Hasta</span>
                <span>Estado</span>
              </div>
              <div className="divide-y divide-[var(--border)]/60 max-h-[420px] overflow-y-auto">
                {licFiltradas.map((l) => (
                  <div key={l.id} className="grid md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr] gap-2 md:gap-4 items-center px-6 py-4">
                    <p className="font-semibold text-[var(--text)] truncate">{nombreEmpleado[l.empleado_id] || '—'}</p>
                    <p className="text-[var(--text2)] text-sm hidden md:block">{etiquetaEstado(TIPOS_LICENCIA, l.tipo)}</p>
                    <p className="text-[var(--text2)] text-sm hidden md:block">{l.fecha_desde}</p>
                    <p className="text-[var(--text2)] text-sm hidden md:block">{l.fecha_hasta}</p>
                    <span className={`justify-self-start text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded ${badgeEstado(ESTADOS_LICENCIA, l.estado)}`}>
                      {etiquetaEstado(ESTADOS_LICENCIA, l.estado)}
                    </span>
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
