import { Modal } from './Modal';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { dinero, hoyISO, getErrorMessage } from '../lib/format';
import {
  fetchEmpleados,
  crearEmpleado,
  actualizarEmpleado,
  eliminarEmpleado,
  fetchAsistencias,
  crearAsistencia,
  actualizarAsistencia,
  eliminarAsistencia,
  upsertAsistencias,
  fetchLicencias,
  crearLicencia,
  actualizarLicencia,
  eliminarLicencia,
  fetchLiquidaciones,
  crearLiquidacion,
  actualizarLiquidacion,
  eliminarLiquidacion,
  TIPOS_LIQUIDACION,
  ESTADOS_ASISTENCIA,
  TIPOS_LICENCIA,
  ESTADOS_LICENCIA,
  ESTADOS_LIQUIDACION,
  etiquetaEstado,
  badgeEstado,
  type Empleado,
  type Asistencia,
  type Licencia,
  type Liquidacion,
} from '../lib/rrhh';
import { crearMovimiento } from '../lib/finanzas';
import {
  Users,
  CalendarCheck2,
  Plane,
  Banknote,
  UserPlus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  CheckCircle2,
  Clock,
  Wallet,
  Ban,
  CalendarDays,
  Briefcase,
} from 'lucide-react';

type Tab = 'empleados' | 'asistencias' | 'licencias' | 'liquidaciones';

type PlanillaRow = { id: string | null; estado: string; hora_entrada: string; hora_salida: string; horas_extra: string; notas: string };

const formatearSalario = (tipo: string, salario: number) => {
  const sufijos: Record<string, string> = {
    fijo: `${dinero(salario)}/mes`,
    por_hora: `${dinero(salario)}/h`,
    por_dia: `${dinero(salario)}/día`,
    por_produccion: `${dinero(salario)}/prod.`,
    por_semana: `${dinero(salario)}/sem`,
    quincenal: `${dinero(salario)}/quincena`,
  };
  return sufijos[tipo] || dinero(salario);
};

const TAB_OPTIONS: { id: Tab; label: string; Icon: typeof Users }[] = [
  { id: 'empleados', label: 'Empleados', Icon: Users },
  { id: 'asistencias', label: 'Asistencias', Icon: CalendarCheck2 },
  { id: 'licencias', label: 'Licencias', Icon: Plane },
  { id: 'liquidaciones', label: 'Liquidaciones', Icon: Banknote },
];

interface EmpleadoForm {
  nombre: string;
  telefono: string;
  dni: string;
  direccion: string;
  puesto: string;
  salario: string;
  fecha_ingreso: string;
  tipo_liquidacion: string;
  activo: boolean;
  notas: string;
}

const emptyEmpleadoForm = (): EmpleadoForm => ({
  nombre: '',
  telefono: '',
  dni: '',
  direccion: '',
  puesto: '',
  salario: '',
  fecha_ingreso: '',
  tipo_liquidacion: 'fijo',
  activo: true,
  notas: '',
});

interface AsistenciaForm {
  empleado_id: string;
  fecha: string;
  hora_entrada: string;
  hora_salida: string;
  estado: string;
  horas_extra: string;
  notas: string;
}

const emptyAsistenciaForm = (): AsistenciaForm => ({
  empleado_id: '',
  fecha: hoyISO(),
  hora_entrada: '',
  hora_salida: '',
  estado: 'presente',
  horas_extra: '',
  notas: '',
});

interface LicenciaForm {
  empleado_id: string;
  tipo: string;
  fecha_desde: string;
  fecha_hasta: string;
  estado: string;
  notas: string;
}

const emptyLicenciaForm = (): LicenciaForm => ({
  empleado_id: '',
  tipo: 'vacaciones',
  fecha_desde: '',
  fecha_hasta: '',
  estado: 'pendiente',
  notas: '',
});

interface LiquidacionForm {
  empleado_id: string;
  periodo: string;
  monto: string;
  estado: string;
  fecha_pago: string;
  notas: string;
}

const emptyLiquidacionForm = (): LiquidacionForm => ({
  empleado_id: '',
  periodo: hoyISO().slice(0, 7),
  monto: '',
  estado: 'pendiente',
  fecha_pago: '',
  notas: '',
});

export default function RrhhView({ corredorId }: { corredorId: string }) {
  const [tab, setTab] = useState<Tab>('empleados');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [licencias, setLicencias] = useState<Licencia[]>([]);
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([]);

  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState<{ tabla: Tab; id: string; nombre: string } | null>(null);
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);

  const [empForm, setEmpForm] = useState<EmpleadoForm>(emptyEmpleadoForm());
  const [asiForm, setAsiForm] = useState<AsistenciaForm>(emptyAsistenciaForm());
  const [licForm, setLicForm] = useState<LicenciaForm>(emptyLicenciaForm());
  const [liqForm, setLiqForm] = useState<LiquidacionForm>(emptyLiquidacionForm());

  const [planillaFecha, setPlanillaFecha] = useState(hoyISO());
  const [planilla, setPlanilla] = useState<Record<string, PlanillaRow>>({});
  const [guardandoPlanilla, setGuardandoPlanilla] = useState(false);
  const [planillaOk, setPlanillaOk] = useState(false);
  const [marcadoRapido, setMarcadoRapido] = useState(false);

  const empleadoPorId = useMemo(() => Object.fromEntries(empleados.map((e) => [e.id, e])), [empleados]);

  const cargarTodo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [emp, asi, lic, liq] = await Promise.all([
        fetchEmpleados(corredorId),
        fetchAsistencias(corredorId),
        fetchLicencias(corredorId),
        fetchLiquidaciones(corredorId),
      ]);
      setEmpleados(emp);
      setAsistencias(asi);
      setLicencias(lic);
      setLiquidaciones(liq);
    } catch (err: any) {
      console.error(err);
      setError(getErrorMessage(err, 'Error al cargar Recursos Humanos.'));
    } finally {
      setLoading(false);
    }
  }, [corredorId]);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  useEffect(() => {
    if (tab === 'asistencias' && !loading && empleados.length) {
      cargarPlanilla(planillaFecha).catch((err: any) => {
        console.error(err);
        setError(getErrorMessage(err, 'Error al cargar la planilla.'));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, loading]);

  const cargarTab = async (t: Tab) => {
    try {
      setError(null);
      if (t === 'empleados') setEmpleados(await fetchEmpleados(corredorId));
      if (t === 'asistencias') setAsistencias(await fetchAsistencias(corredorId));
      if (t === 'licencias') setLicencias(await fetchLicencias(corredorId));
      if (t === 'liquidaciones') setLiquidaciones(await fetchLiquidaciones(corredorId));
    } catch (err: any) {
      console.error(err);
      setError(getErrorMessage(err, 'Error al actualizar.'));
    }
  };

  const cargarPlanilla = async (fecha: string) => {
    const activos = empleados.filter((e) => e.activo);
    const existentes = await fetchAsistencias(corredorId, { desde: fecha, hasta: fecha });
    const mapa: Record<string, PlanillaRow> = {};
    for (const e of activos) {
      const a = existentes.find((x) => x.empleado_id === e.id);
      mapa[e.id] = {
        id: a?.id || null,
        estado: a?.estado || '',
        hora_entrada: a?.hora_entrada || '',
        hora_salida: a?.hora_salida || '',
        horas_extra: a && a.horas_extra ? String(a.horas_extra) : '',
        notas: a?.notas || '',
      };
    }
    setPlanilla(mapa);
    setPlanillaOk(false);
    setMarcadoRapido(false);
  };

  const marcarTodos = (estado: string, horaEntrada = '') => {
    setPlanilla((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        next[id] = { ...next[id], estado, hora_entrada: horaEntrada || next[id].hora_entrada };
      }
      return next;
    });
    setMarcadoRapido(true);
  };

  const marcarHoraAhora = (empleadoId: string, campo: 'hora_entrada' | 'hora_salida') => {
    const ahora = new Date();
    const hh = String(ahora.getHours()).padStart(2, '0');
    const mm = String(ahora.getMinutes()).padStart(2, '0');
    setPlanilla((prev) => ({ ...prev, [empleadoId]: { ...prev[empleadoId], [campo]: `${hh}:${mm}` } }));
    setPlanillaOk(false);
  };

  const guardarPlanilla = async () => {
    const filas = Object.entries(planilla)
      .filter(([, r]) => (r as PlanillaRow).estado)
      .map(([empleado_id, r]) => {
        const row = r as PlanillaRow;
        return {
          empleado_id,
          fecha: planillaFecha,
          estado: row.estado,
          hora_entrada: row.hora_entrada || null,
          hora_salida: row.hora_salida || null,
          horas_extra: row.horas_extra ? Number(row.horas_extra) || 0 : 0,
          notas: row.notas.trim() || null,
        };
      });
    if (!filas.length) {
      alert('Marcá al menos un empleado (estado) antes de guardar.');
      return;
    }
    setGuardandoPlanilla(true);
    setError(null);
    try {
      await upsertAsistencias(corredorId, filas);
      setPlanillaOk(true);
      await cargarTab('asistencias');
    } catch (err: any) {
      console.error(err);
      setError(getErrorMessage(err, 'Error al guardar la planilla.'));
    } finally {
      setGuardandoPlanilla(false);
    }
  };

  const abrirNuevo = () => {
    setEditando(null);
    setEmpForm(emptyEmpleadoForm());
    setAsiForm(emptyAsistenciaForm());
    setLicForm(emptyLicenciaForm());
    setLiqForm(emptyLiquidacionForm());
    setModal(true);
  };

  const abrirEditar = (t: Tab, id: string) => {
    setEditando(id);
    if (t === 'empleados') {
      const e = empleadoPorId[id];
      if (!e) return;
      setEmpForm({
        nombre: e.nombre,
        telefono: e.telefono || '',
        dni: e.dni || '',
        direccion: e.direccion || '',
        puesto: e.puesto || '',
        salario: String(e.salario ?? 0),
        fecha_ingreso: e.fecha_ingreso || '',
        tipo_liquidacion: e.tipo_liquidacion,
        activo: e.activo,
        notas: e.notas || '',
      });
    }
    if (t === 'asistencias') {
      const a = asistencias.find((x) => x.id === id);
      if (!a) return;
      setAsiForm({
        empleado_id: a.empleado_id,
        fecha: a.fecha,
        hora_entrada: a.hora_entrada || '',
        hora_salida: a.hora_salida || '',
        estado: a.estado,
        horas_extra: a.horas_extra ? String(a.horas_extra) : '',
        notas: a.notas || '',
      });
    }
    if (t === 'licencias') {
      const l = licencias.find((x) => x.id === id);
      if (!l) return;
      setLicForm({
        empleado_id: l.empleado_id,
        tipo: l.tipo,
        fecha_desde: l.fecha_desde,
        fecha_hasta: l.fecha_hasta,
        estado: l.estado,
        notas: l.notas || '',
      });
    }
    if (t === 'liquidaciones') {
      const l = liquidaciones.find((x) => x.id === id);
      if (!l) return;
      setLiqForm({
        empleado_id: l.empleado_id,
        periodo: l.periodo,
        monto: String(l.monto ?? 0),
        estado: l.estado,
        fecha_pago: l.fecha_pago || '',
        notas: l.notas || '',
      });
    }
    setModal(true);
  };

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    try {
      if (tab === 'empleados') {
        if (!empForm.nombre.trim()) {
          alert('Escribí el nombre del empleado.');
          setGuardando(false);
          return;
        }
        const payload = {
          nombre: empForm.nombre.trim(),
          telefono: empForm.telefono.trim() || undefined,
          dni: empForm.dni.trim() || undefined,
          direccion: empForm.direccion.trim() || undefined,
          puesto: empForm.puesto.trim() || undefined,
          salario: Math.max(0, Number(empForm.salario) || 0),
          fecha_ingreso: empForm.fecha_ingreso || undefined,
          tipo_liquidacion: empForm.tipo_liquidacion,
          activo: empForm.activo,
          notas: empForm.notas.trim() || undefined,
        };
        if (editando) {
          await actualizarEmpleado(editando, payload);
        } else {
          await crearEmpleado({ corredor_id: corredorId, ...payload });
        }
      }

      if (tab === 'asistencias') {
        if (!asiForm.empleado_id) {
          alert('Elegí el empleado.');
          setGuardando(false);
          return;
        }
        if (!asiForm.fecha) {
          alert('Elegí la fecha.');
          setGuardando(false);
          return;
        }
        const payload = {
          empleado_id: asiForm.empleado_id,
          fecha: asiForm.fecha,
          hora_entrada: asiForm.hora_entrada || undefined,
          hora_salida: asiForm.hora_salida || undefined,
          estado: asiForm.estado,
          horas_extra: Number(asiForm.horas_extra) || 0,
          notas: asiForm.notas.trim() || undefined,
        };
        if (editando) {
          await actualizarAsistencia(editando, payload);
        } else {
          await crearAsistencia({ corredor_id: corredorId, ...payload });
        }
      }

      if (tab === 'licencias') {
        if (!licForm.empleado_id) {
          alert('Elegí el empleado.');
          setGuardando(false);
          return;
        }
        if (!licForm.fecha_desde || !licForm.fecha_hasta) {
          alert('Completá las fechas de la licencia.');
          setGuardando(false);
          return;
        }
        if (licForm.fecha_hasta < licForm.fecha_desde) {
          alert('La fecha de fin no puede ser anterior al inicio.');
          setGuardando(false);
          return;
        }
        const payload = {
          empleado_id: licForm.empleado_id,
          tipo: licForm.tipo,
          fecha_desde: licForm.fecha_desde,
          fecha_hasta: licForm.fecha_hasta,
          estado: licForm.estado,
          notas: licForm.notas.trim() || undefined,
        };
        if (editando) {
          await actualizarLicencia(editando, payload);
        } else {
          await crearLicencia({ corredor_id: corredorId, ...payload });
        }
      }

      if (tab === 'liquidaciones') {
        if (!liqForm.empleado_id) {
          alert('Elegí el empleado.');
          setGuardando(false);
          return;
        }
        if (!liqForm.periodo) {
          alert('Completá el período.');
          setGuardando(false);
          return;
        }
        const monto = Math.max(0, Number(liqForm.monto) || 0);
        if (monto <= 0) {
          alert('El monto debe ser mayor a 0.');
          setGuardando(false);
          return;
        }
        const payload = {
          empleado_id: liqForm.empleado_id,
          periodo: liqForm.periodo,
          monto,
          estado: liqForm.estado,
          fecha_pago: liqForm.fecha_pago || undefined,
          notas: liqForm.notas.trim() || undefined,
        };
        if (editando) {
          await actualizarLiquidacion(editando, payload);
        } else {
          await crearLiquidacion({ corredor_id: corredorId, ...payload });
        }
      }

      setModal(false);
      await cargarTab(tab);
    } catch (err: any) {
      console.error(err);
      setError(getErrorMessage(err, 'Error al guardar.'));
    } finally {
      setGuardando(false);
    }
  };

  const confirmarBorrado = async () => {
    if (!confirmarEliminar) return;
    setOcupadoId(confirmarEliminar.id);
    setError(null);
    try {
      if (confirmarEliminar.tab === 'empleados') await eliminarEmpleado(confirmarEliminar.id);
      if (confirmarEliminar.tab === 'asistencias') await eliminarAsistencia(confirmarEliminar.id);
      if (confirmarEliminar.tab === 'licencias') await eliminarLicencia(confirmarEliminar.id);
      if (confirmarEliminar.tab === 'liquidaciones') await eliminarLiquidacion(confirmarEliminar.id);
      setConfirmarEliminar(null);
      await cargarTab(confirmarEliminar.tab);
    } catch (err: any) {
      console.error(err);
      setError(getErrorMessage(err, 'Error al eliminar.'));
    } finally {
      setOcupadoId(null);
    }
  };

  const marcarLiquidacionPagada = async (liq: Liquidacion) => {
    setOcupadoId(liq.id);
    setError(null);
    try {
      const fecha = hoyISO();
      await actualizarLiquidacion(liq.id, { estado: 'pagado', fecha_pago: fecha });
      const emp = empleadoPorId[liq.empleado_id];
      try {
        await crearMovimiento({
          corredor_id: corredorId,
          tipo: 'egreso',
          concepto: `Sueldo ${emp?.nombre || 'empleado'} ${liq.periodo}`,
          monto: liq.monto,
          categoria: 'sueldos',
          fecha,
          notas: 'Liquidación de sueldo (RRHH)',
        });
      } catch (mErr: any) {
        console.error('No se pudo registrar el egreso:', mErr);
      }
      await cargarTab('liquidaciones');
    } catch (err: any) {
      console.error(err);
      setError(getErrorMessage(err, 'Error al marcar como pagado.'));
    } finally {
      setOcupadoId(null);
    }
  };

  const setEstaLicencia = async (lic: Licencia, estado: string) => {
    setOcupadoId(lic.id);
    setError(null);
    try {
      await actualizarLicencia(lic.id, { estado });
      await cargarTab('licencias');
    } catch (err: any) {
      console.error(err);
      setError(getErrorMessage(err, 'Error al cambiar el estado.'));
    } finally {
      setOcupadoId(null);
    }
  };

  const kpisEmpleados = useMemo(() => {
    const activos = empleados.filter((e) => e.activo);
    const nominaMensual = activos.reduce((acc, e) => acc + (e.tipo_liquidacion === 'fijo' ? e.salario : 0), 0);
    const variable = activos.filter((e) => e.tipo_liquidacion !== 'fijo');
    return [
      { label: 'Total empleados', valor: String(empleados.length), Icon: Users, fondo: 'bg-[var(--blue-soft)]', iconColor: 'text-[var(--text)]' },
      { label: 'Activos', valor: String(activos.length), Icon: CheckCircle2, fondo: 'bg-[var(--primary-soft)]', iconColor: 'text-[var(--primary-deep)]' },
      { label: 'Nómina mensual', valor: dinero(nominaMensual), Icon: Wallet, fondo: 'bg-[var(--amber-soft2)]', iconColor: 'text-[var(--amber-text2)]' },
      { label: 'Liquidación variable', valor: String(variable.length), Icon: Clock, fondo: 'bg-[var(--gray-soft)]', iconColor: 'text-[var(--text2)]' },
    ];
  }, [empleados]);

  const kpisAsistencias = useMemo(() => {
    const hoy = hoyISO();
    const deHoy = asistencias.filter((a) => a.fecha === hoy);
    const presentes = deHoy.filter((a) => a.estado === 'presente');
    const ausentes = deHoy.filter((a) => a.estado === 'ausente');
    const licencia = deHoy.filter((a) => a.estado === 'licencia');
    return [
      { label: 'Registros hoy', valor: String(deHoy.length), Icon: CalendarDays, fondo: 'bg-[var(--blue-soft)]', iconColor: 'text-[var(--text)]' },
      { label: 'Presentes hoy', valor: String(presentes.length), Icon: CheckCircle2, fondo: 'bg-[var(--primary-soft)]', iconColor: 'text-[var(--primary-deep)]' },
      { label: 'Ausentes hoy', valor: String(ausentes.length), Icon: Ban, fondo: 'bg-[var(--danger-soft)]', iconColor: 'text-[var(--danger-deep)]' },
      { label: 'Con licencia hoy', valor: String(licencia.length), Icon: Plane, fondo: 'bg-[var(--amber-soft2)]', iconColor: 'text-[var(--amber-text2)]' },
    ];
  }, [asistencias]);

  const kpisLicencias = useMemo(() => {
    const pendientes = licencias.filter((l) => l.estado === 'pendiente');
    const aprobadas = licencias.filter((l) => l.estado === 'aprobada');
    const rechazadas = licencias.filter((l) => l.estado === 'rechazada');
    const hoy = hoyISO();
    const enCurso = licencias.filter(
      (l) => l.estado === 'aprobada' && l.fecha_desde <= hoy && l.fecha_hasta >= hoy
    );
    return [
      { label: 'Pendientes', valor: String(pendientes.length), Icon: Clock, fondo: 'bg-[var(--amber-soft2)]', iconColor: 'text-[var(--amber-text2)]' },
      { label: 'Aprobadas', valor: String(aprobadas.length), Icon: CheckCircle2, fondo: 'bg-[var(--primary-soft)]', iconColor: 'text-[var(--primary-deep)]' },
      { label: 'Rechazadas', valor: String(rechazadas.length), Icon: Ban, fondo: 'bg-[var(--danger-soft)]', iconColor: 'text-[var(--danger-deep)]' },
      { label: 'En curso', valor: String(enCurso.length), Icon: Plane, fondo: 'bg-[var(--blue-soft)]', iconColor: 'text-[var(--text)]' },
    ];
  }, [licencias]);

  const kpisLiquidaciones = useMemo(() => {
    const pendientes = liquidaciones.filter((l) => l.estado === 'pendiente');
    const pagadas = liquidaciones.filter((l) => l.estado === 'pagado');
    return [
      { label: 'Liquidaciones', valor: String(liquidaciones.length), Icon: Banknote, fondo: 'bg-[var(--blue-soft)]', iconColor: 'text-[var(--text)]' },
      { label: 'Pendientes', valor: String(pendientes.length), Icon: Clock, fondo: 'bg-[var(--amber-soft2)]', iconColor: 'text-[var(--amber-text2)]' },
      { label: 'Pendiente $', valor: dinero(pendientes.reduce((a, l) => a + l.monto, 0)), Icon: Wallet, fondo: 'bg-[var(--amber-soft)]', iconColor: 'text-[var(--amber-text3)]' },
      { label: 'Pagado $', valor: dinero(pagadas.reduce((a, l) => a + l.monto, 0)), Icon: CheckCircle2, fondo: 'bg-[var(--primary-soft)]', iconColor: 'text-[var(--primary-deep)]' },
    ];
  }, [liquidaciones]);

  const kpis = tab === 'empleados' ? kpisEmpleados : tab === 'asistencias' ? kpisAsistencias : tab === 'licencias' ? kpisLicencias : kpisLiquidaciones;

  const tituloTab =
    tab === 'empleados'
      ? 'Empleados'
      : tab === 'asistencias'
        ? 'Asistencias'
        : tab === 'licencias'
          ? 'Licencias y vacaciones'
          : 'Liquidaciones de sueldo';

  const descripcionTab =
    tab === 'empleados'
      ? 'Fichas de empleados, puestos y salarios.'
      : tab === 'asistencias'
        ? 'Registro diario de entrada, salida y estado.'
        : tab === 'licencias'
          ? 'Vacaciones, licencias y faltas justificadas.'
          : 'Sueldos por período y registro del pago.';

  const nombreEmpleado = (id: string) => empleadoPorId[id]?.nombre || '—';

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-[1440px] mx-auto w-full">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text)] tracking-tight">Recursos Humanos</h2>
          <p className="text-[var(--text2)] mt-1">{descripcionTab}</p>
        </div>
        <button
          onClick={() => abrirNuevo()}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-deep)] transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo {tab === 'empleados' ? 'empleado' : tab === 'asistencias' ? 'registro' : tab === 'licencias' ? 'licencia' : 'liquidación'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {TAB_OPTIONS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              cargarTab(t.id);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text2)] hover:bg-[var(--blue-header)]'
            }`}
          >
            <t.Icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-[var(--danger-soft)] text-[var(--danger-deep)] p-4 rounded-xl flex items-start gap-4 mb-8">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text2)]">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-[var(--primary)]" />
          <p>Cargando Recursos Humanos...</p>
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

          {tab === 'asistencias' && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden mb-8">
              <div className="px-6 py-5 border-b border-[var(--border)] bg-[var(--blue-header)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text)]">Planilla del día</h3>
                    <p className="text-sm text-[var(--text2)] mt-0.5">
                      {empleados.filter((e) => e.activo).length} empleados activos · marcá el estado de cada uno y guardá todo junto.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={planillaFecha}
                        onChange={(e) => {
                          setPlanillaFecha(e.target.value);
                          setPlanilla({});
                          cargarPlanilla(e.target.value).catch((err: any) => {
                            console.error(err);
                            setError(getErrorMessage(err, 'Error al cargar la planilla.'));
                          });
                        }}
                        className="h-11 px-3 rounded-lg border border-[var(--border)] bg-[var(--field)] text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const h = hoyISO();
                          setPlanillaFecha(h);
                          cargarPlanilla(h).catch(() => {});
                        }}
                        className="h-11 px-4 rounded-lg border border-[var(--border)] text-[var(--text2)] text-sm font-medium hover:bg-[var(--field)] transition-colors"
                      >
                        Hoy
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => marcarTodos('presente')}
                      className="h-11 px-4 rounded-lg border border-[var(--primary)] text-[var(--primary)] text-sm font-medium hover:bg-[var(--primary-soft)] transition-colors"
                    >
                      Todos presentes
                    </button>
                    <button
                      type="button"
                      onClick={() => marcarTodos('ausente')}
                      className="h-11 px-4 rounded-lg border border-[var(--danger)] text-[var(--danger)] text-sm font-medium hover:bg-[var(--danger-soft)] transition-colors"
                    >
                      Todos ausentes
                    </button>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-[var(--border)]/60">
                {empleados
                  .filter((e) => e.activo)
                  .map((e) => {
                    const r = planilla[e.id];
                    return (
                      <div key={e.id} className="px-6 py-4 flex flex-col gap-3">
                        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                          <div className="md:w-56 flex-shrink-0">
                            <p className="font-semibold text-[var(--text)] truncate">{e.nombre}</p>
                            <p className="text-xs text-[var(--text2)] truncate">
                              {e.puesto || 'Sin puesto'}
                              <span className="ml-2">{formatearSalario(e.tipo_liquidacion, e.salario)}</span>
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 flex-1">
                            {ESTADOS_ASISTENCIA.map((s) => {
                              const activo = r?.estado === s.valor;
                              return (
                                <button
                                  key={s.valor}
                                  type="button"
                                  onClick={() => {
                                    setPlanilla((prev) => ({
                                      ...prev,
                                      [e.id]: {
                                        ...prev[e.id],
                                        id: prev[e.id]?.id || null,
                                        estado: activo ? '' : s.valor,
                                        hora_entrada: prev[e.id]?.hora_entrada || '',
                                        hora_salida: prev[e.id]?.hora_salida || '',
                                        horas_extra: prev[e.id]?.horas_extra || '',
                                        notas: prev[e.id]?.notas || '',
                                      },
                                    }));
                                    setPlanillaOk(false);
                                  }}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                    activo ? s.clase + ' border-transparent' : 'border-[var(--border)] text-[var(--text2)] hover:bg-[var(--blue-header)]'
                                  }`}
                                >
                                  {s.etiqueta}
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex items-end gap-2 flex-shrink-0">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] uppercase tracking-wider text-[var(--text2)] font-semibold">Entrada</span>
                              <input
                                type="time"
                                value={r?.hora_entrada || ''}
                                onChange={(e) => {
                                  setPlanilla((prev) => ({ ...prev, [e.id]: { ...prev[e.id], hora_entrada: e.target.value } }));
                                  setPlanillaOk(false);
                                }}
                                className="h-10 px-2 rounded-lg border border-[var(--border)] bg-[var(--field)] text-sm w-28"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] uppercase tracking-wider text-[var(--text2)] font-semibold">Salida</span>
                              <input
                                type="time"
                                value={r?.hora_salida || ''}
                                onChange={(e) => {
                                  setPlanilla((prev) => ({ ...prev, [e.id]: { ...prev[e.id], hora_salida: e.target.value } }));
                                  setPlanillaOk(false);
                                }}
                                className="h-10 px-2 rounded-lg border border-[var(--border)] bg-[var(--field)] text-sm w-28"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] uppercase tracking-wider text-[var(--text2)] font-semibold">Extras</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min={0}
                                  step={0.5}
                                  value={r?.horas_extra || ''}
                                  onChange={(e) => {
                                    setPlanilla((prev) => ({ ...prev, [e.id]: { ...prev[e.id], horas_extra: e.target.value } }));
                                    setPlanillaOk(false);
                                  }}
                                  placeholder="0"
                                  className="h-10 w-16 px-2 rounded-lg border border-[var(--border)] bg-[var(--field)] text-sm text-right"
                                />
                                <span className="text-xs text-[var(--text2)]">hs</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => marcarHoraAhora(e.id, 'hora_entrada')}
                              title="Marcar entrada con la hora actual"
                              className="h-10 px-2.5 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:bg-[var(--field)] hover:text-[var(--text)] transition-colors"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <input
                          type="text"
                          value={r?.notas || ''}
                          onChange={(e) => {
                            setPlanilla((prev) => ({ ...prev, [e.id]: { ...prev[e.id], notas: e.target.value } }));
                            setPlanillaOk(false);
                          }}
                          placeholder={`Notas de ${e.nombre}...`}
                          className="w-full h-10 px-4 rounded-lg border border-[var(--border)] bg-[var(--field)] text-sm"
                        />
                      </div>
                    );
                  })}
              </div>

              <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--blue-header)]">
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <span className="flex items-center gap-1.5 font-medium text-[var(--text)]">
                    <CheckCircle2 className="w-4 h-4 text-[var(--primary-deep)]" />
                    Presentes: {Object.values(planilla).filter((r) => (r as PlanillaRow).estado === 'presente').length}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-[var(--text)]">
                    <Ban className="w-4 h-4 text-[var(--danger-deep)]" />
                    Ausentes: {Object.values(planilla).filter((r) => (r as PlanillaRow).estado === 'ausente').length}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-[var(--text)]">
                    <Plane className="w-4 h-4 text-[var(--amber-text2)]" />
                    Licencia: {Object.values(planilla).filter((r) => (r as PlanillaRow).estado === 'licencia').length}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-[var(--text)]">
                    <Clock className="w-4 h-4 text-[var(--text2)]" />
                    Media jornada: {Object.values(planilla).filter((r) => (r as PlanillaRow).estado === 'media_jornada').length}
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-[var(--primary-deep)]">
                    <CalendarDays className="w-4 h-4" />
                    Extras: {Object.values(planilla).reduce((acc: number, r) => acc + (Number((r as PlanillaRow).horas_extra) || 0), 0)} hs
                  </span>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--blue-header)] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-sm text-[var(--text2)]">
                  {planillaOk ? (
                    <span className="flex items-center gap-1.5 font-medium text-[var(--primary-deep)]">
                      <CheckCircle2 className="w-4 h-4" /> Planilla guardada
                    </span>
                  ) : (
                    <span>
                      {Object.values(planilla).filter((r) => (r as PlanillaRow).estado).length} de {Object.keys(planilla).length} empleados marcados
                    </span>
                  )}
                  {marcadoRapido && !planillaOk && <span className="hidden sm:inline text-xs">· revisá y ajustá lo que haga falta</span>}
                </div>
                <button
                  type="button"
                  onClick={guardarPlanilla}
                  disabled={guardandoPlanilla}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-deep)] transition-colors disabled:opacity-60"
                >
                  {guardandoPlanilla ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Guardar planilla
                </button>
              </div>
            </div>
          )}

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div
              className={`hidden md:grid gap-4 px-6 py-3 bg-[var(--blue-header)] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wider text-[var(--text2)] ${
                tab === 'asistencias' ? 'grid-cols-[1.6fr_1fr_1fr_1fr_0.7fr_1fr_170px]' : 'grid-cols-[1.6fr_1fr_1fr_1fr_1fr_170px]'
              }`}
            >
              {tab === 'empleados' && (
                <>
                  <span>Empleado</span>
                  <span>Puesto</span>
                  <span>Teléfono</span>
                  <span>Salario</span>
                  <span>Estado</span>
                  <span className="text-right">Acciones</span>
                </>
              )}
              {tab === 'asistencias' && (
                <>
                  <span>Empleado</span>
                  <span>Fecha</span>
                  <span>Entrada</span>
                  <span>Salida</span>
                  <span>Extras</span>
                  <span>Estado</span>
                  <span className="text-right">Acciones</span>
                </>
              )}
              {tab === 'licencias' && (
                <>
                  <span>Empleado</span>
                  <span>Tipo</span>
                  <span>Desde</span>
                  <span>Hasta</span>
                  <span>Estado</span>
                  <span className="text-right">Acciones</span>
                </>
              )}
              {tab === 'liquidaciones' && (
                <>
                  <span>Empleado</span>
                  <span>Período</span>
                  <span>Monto</span>
                  <span>Estado</span>
                  <span>Pago</span>
                  <span className="text-right">Acciones</span>
                </>
              )}
            </div>

            <div className="divide-y divide-[var(--border)]/60">
              {tab === 'empleados' &&
                empleados.map((e) => (
                  <div key={e.id} className="grid md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_170px] gap-2 md:gap-4 items-center px-6 py-4">
                    <div>
                      <p className="font-semibold text-[var(--text)] truncate">{e.nombre}</p>
                      <p className="text-xs text-[var(--text2)] md:hidden">{e.puesto || 'Sin puesto'}</p>
                    </div>
                    <p className="text-[var(--text2)] text-sm hidden md:block truncate">{e.puesto || '—'}</p>
                    <p className="text-[var(--text2)] text-sm hidden md:block truncate">{e.telefono || '—'}</p>
                    <p className="text-[var(--text)] text-sm hidden md:block font-medium">{formatearSalario(e.tipo_liquidacion, e.salario)}</p>
                    <span
                      className={`justify-self-start text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded ${
                        e.activo ? 'bg-[var(--primary-soft)] text-[var(--primary-deep)]' : 'bg-[var(--gray-soft)] text-[var(--text2)]'
                      }`}
                    >
                      {e.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => abrirEditar('empleados', e.id)}
                        title="Editar"
                        className="p-2 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--blue-header)] transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmarEliminar({ tabla: 'empleados', id: e.id, nombre: e.nombre })}
                        title="Eliminar"
                        className="p-2 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:text-[var(--danger-deep)] hover:bg-[var(--danger-soft)] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

              {tab === 'asistencias' &&
                asistencias.map((a) => (
                  <div key={a.id} className="grid md:grid-cols-[1.6fr_1fr_1fr_1fr_0.7fr_1fr_170px] gap-2 md:gap-4 items-center px-6 py-4">
                    <p className="font-semibold text-[var(--text)] truncate">{nombreEmpleado(a.empleado_id)}</p>
                    <p className="text-[var(--text2)] text-sm hidden md:block">{a.fecha}</p>
                    <p className="text-[var(--text2)] text-sm hidden md:block">{a.hora_entrada || '—'}</p>
                    <p className="text-[var(--text2)] text-sm hidden md:block">{a.hora_salida || '—'}</p>
                    <p className="text-[var(--text)] text-sm hidden md:block font-medium">{a.horas_extra ? `${a.horas_extra} hs` : '—'}</p>
                    <span className={`justify-self-start text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded ${badgeEstado(ESTADOS_ASISTENCIA, a.estado)}`}>
                      {etiquetaEstado(ESTADOS_ASISTENCIA, a.estado)}
                    </span>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => abrirEditar('asistencias', a.id)}
                        title="Editar"
                        className="p-2 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--blue-header)] transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmarEliminar({ tabla: 'asistencias', id: a.id, nombre: nombreEmpleado(a.empleado_id) })}
                        title="Eliminar"
                        className="p-2 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:text-[var(--danger-deep)] hover:bg-[var(--danger-soft)] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

              {tab === 'licencias' &&
                licencias.map((l) => (
                  <div key={l.id} className="grid md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_170px] gap-2 md:gap-4 items-center px-6 py-4">
                    <p className="font-semibold text-[var(--text)] truncate">{nombreEmpleado(l.empleado_id)}</p>
                    <p className="text-[var(--text2)] text-sm hidden md:block">{etiquetaEstado(TIPOS_LICENCIA, l.tipo)}</p>
                    <p className="text-[var(--text2)] text-sm hidden md:block">{l.fecha_desde}</p>
                    <p className="text-[var(--text2)] text-sm hidden md:block">{l.fecha_hasta}</p>
                    <span className={`justify-self-start text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded ${badgeEstado(ESTADOS_LICENCIA, l.estado)}`}>
                      {etiquetaEstado(ESTADOS_LICENCIA, l.estado)}
                    </span>
                    <div className="flex items-center justify-end gap-2">
                      {l.estado === 'pendiente' && (
                        <>
                          <button
                            onClick={() => setEstaLicencia(l, 'aprobada')}
                            disabled={ocupadoId === l.id}
                            title="Aprobar"
                            className="p-2 rounded-lg border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary-soft)] transition-colors disabled:opacity-50"
                          >
                            {ocupadoId === l.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setEstaLicencia(l, 'rechazada')}
                            disabled={ocupadoId === l.id}
                            title="Rechazar"
                            className="p-2 rounded-lg border border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors disabled:opacity-50"
                          >
                            {ocupadoId === l.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => abrirEditar('licencias', l.id)}
                        title="Editar"
                        className="p-2 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--blue-header)] transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmarEliminar({ tabla: 'licencias', id: l.id, nombre: nombreEmpleado(l.empleado_id) })}
                        title="Eliminar"
                        className="p-2 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:text-[var(--danger-deep)] hover:bg-[var(--danger-soft)] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

              {tab === 'liquidaciones' &&
                liquidaciones.map((l) => (
                  <div key={l.id} className="grid md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_170px] gap-2 md:gap-4 items-center px-6 py-4">
                    <p className="font-semibold text-[var(--text)] truncate">{nombreEmpleado(l.empleado_id)}</p>
                    <p className="text-[var(--text2)] text-sm hidden md:block">{l.periodo}</p>
                    <p className="text-[var(--text)] text-sm hidden md:block font-medium">{dinero(l.monto)}</p>
                    <span className={`justify-self-start text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded ${badgeEstado(ESTADOS_LIQUIDACION, l.estado)}`}>
                      {etiquetaEstado(ESTADOS_LIQUIDACION, l.estado)}
                    </span>
                    <p className="text-[var(--text2)] text-sm hidden md:block">{l.fecha_pago || '—'}</p>
                    <div className="flex items-center justify-end gap-2">
                      {l.estado === 'pendiente' && (
                        <button
                          onClick={() => marcarLiquidacionPagada(l)}
                          disabled={ocupadoId === l.id}
                          title="Marcar pagado y registrar egreso"
                          className="p-2 rounded-lg border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary-soft)] transition-colors disabled:opacity-50"
                        >
                          {ocupadoId === l.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
                        </button>
                      )}
                      <button
                        onClick={() => abrirEditar('liquidaciones', l.id)}
                        title="Editar"
                        className="p-2 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--blue-header)] transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmarEliminar({ tabla: 'liquidaciones', id: l.id, nombre: nombreEmpleado(l.empleado_id) })}
                        title="Eliminar"
                        className="p-2 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:text-[var(--danger-deep)] hover:bg-[var(--danger-soft)] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {((tab === 'empleados' && empleados.length === 0) ||
              (tab === 'asistencias' && asistencias.length === 0) ||
              (tab === 'licencias' && licencias.length === 0) ||
              (tab === 'liquidaciones' && liquidaciones.length === 0)) && (
              <div className="p-12 text-center text-[var(--text2)]">
                <Briefcase className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
                <p>No hay registros en {tituloTab.toLowerCase()}. Agregá el primero con el botón superior.</p>
              </div>
            )}
          </div>
        </>
      )}

      {modal && (
        <Modal title={`${editando ? 'Editar' : 'Nuevo'} ${tab === 'empleados' ? 'empleado' : tab === 'asistencias' ? 'registro' : tab === 'licencias' ? 'licencia' : 'liquidación'}`} onClose={() => setModal(false)}>
          <div className="bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--field)]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--primary-soft)] rounded-lg">
                  <UserPlus className="w-5 h-5 text-[var(--primary-deep)]" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text)]">
                  {editando ? 'Editar' : 'Nuevo'} {tab === 'empleados' ? 'empleado' : tab === 'asistencias' ? 'registro' : tab === 'licencias' ? 'licencia' : 'liquidación'}
                </h3>
              </div>
              <button
                onClick={() => setModal(false)}
                className="text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--hover)] p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {tab === 'empleados' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Nombre *</label>
                    <input
                      type="text"
                      value={empForm.nombre}
                      onChange={(e) => setEmpForm({ ...empForm, nombre: e.target.value })}
                      placeholder="Nombre y apellido"
                      className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Teléfono</label>
                      <input
                        type="text"
                        value={empForm.telefono}
                        onChange={(e) => setEmpForm({ ...empForm, telefono: e.target.value })}
                        placeholder="+54 221..."
                        className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">DNI</label>
                      <input
                        type="text"
                        value={empForm.dni}
                        onChange={(e) => setEmpForm({ ...empForm, dni: e.target.value })}
                        placeholder="12345678"
                        className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Dirección</label>
                    <input
                      type="text"
                      value={empForm.direccion}
                      onChange={(e) => setEmpForm({ ...empForm, direccion: e.target.value })}
                      placeholder="Calle y número, localidad"
                      className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Puesto</label>
                      <input
                        type="text"
                        value={empForm.puesto}
                        onChange={(e) => setEmpForm({ ...empForm, puesto: e.target.value })}
                        placeholder="Ej: Carpintero, Vendedor"
                        className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Salario</label>
                      <input
                        type="number"
                        min={0}
                        value={empForm.salario}
                        onChange={(e) => setEmpForm({ ...empForm, salario: e.target.value })}
                        placeholder="0"
                        className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Ingreso</label>
                      <input
                        type="date"
                        value={empForm.fecha_ingreso}
                        onChange={(e) => setEmpForm({ ...empForm, fecha_ingreso: e.target.value })}
                        className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Liquidación</label>
                      <select
                        value={empForm.tipo_liquidacion}
                        onChange={(e) => setEmpForm({ ...empForm, tipo_liquidacion: e.target.value })}
                        className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      >
                        {TIPOS_LIQUIDACION.map((t) => (
                          <option key={t.valor} value={t.valor}>
                            {t.etiqueta}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1 flex items-end">
                      <button
                        type="button"
                        onClick={() => setEmpForm({ ...empForm, activo: !empForm.activo })}
                        className={`w-full h-12 px-4 rounded-lg border font-medium transition-colors ${
                          empForm.activo
                            ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--primary-soft)]'
                            : 'border-[var(--border)] text-[var(--text2)] bg-[var(--field)]'
                        }`}
                      >
                        {empForm.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Notas</label>
                    <textarea
                      value={empForm.notas}
                      onChange={(e) => setEmpForm({ ...empForm, notas: e.target.value })}
                      rows={2}
                      placeholder="Observaciones..."
                      className="w-full p-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                    />
                  </div>
                </>
              )}

              {tab === 'asistencias' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Empleado *</label>
                    <select
                      value={asiForm.empleado_id}
                      onChange={(e) => setAsiForm({ ...asiForm, empleado_id: e.target.value })}
                      className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                    >
                      <option value="">Seleccionar...</option>
                      {empleados
                        .filter((e) => e.activo)
                        .map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.nombre}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Fecha *</label>
                      <input
                        type="date"
                        value={asiForm.fecha}
                        onChange={(e) => setAsiForm({ ...asiForm, fecha: e.target.value })}
                        className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Entrada</label>
                      <input
                        type="time"
                        value={asiForm.hora_entrada}
                        onChange={(e) => setAsiForm({ ...asiForm, hora_entrada: e.target.value })}
                        className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Salida</label>
                      <input
                        type="time"
                        value={asiForm.hora_salida}
                        onChange={(e) => setAsiForm({ ...asiForm, hora_salida: e.target.value })}
                        className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Horas extra</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={asiForm.horas_extra}
                        onChange={(e) => setAsiForm({ ...asiForm, horas_extra: e.target.value })}
                        placeholder="0"
                        className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      />
                      <span className="text-sm text-[var(--text2)]">hs</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Estado</label>
                    <select
                      value={asiForm.estado}
                      onChange={(e) => setAsiForm({ ...asiForm, estado: e.target.value })}
                      className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                    >
                      {ESTADOS_ASISTENCIA.map((s) => (
                        <option key={s.valor} value={s.valor}>
                          {s.etiqueta}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Notas</label>
                    <textarea
                      value={asiForm.notas}
                      onChange={(e) => setAsiForm({ ...asiForm, notas: e.target.value })}
                      rows={2}
                      placeholder="Observaciones..."
                      className="w-full p-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                    />
                  </div>
                </>
              )}

              {tab === 'licencias' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Empleado *</label>
                    <select
                      value={licForm.empleado_id}
                      onChange={(e) => setLicForm({ ...licForm, empleado_id: e.target.value })}
                      className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                    >
                      <option value="">Seleccionar...</option>
                      {empleados.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Tipo</label>
                    <select
                      value={licForm.tipo}
                      onChange={(e) => setLicForm({ ...licForm, tipo: e.target.value })}
                      className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                    >
                      {TIPOS_LICENCIA.map((t) => (
                        <option key={t.valor} value={t.valor}>
                          {t.etiqueta}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Desde *</label>
                      <input
                        type="date"
                        value={licForm.fecha_desde}
                        onChange={(e) => setLicForm({ ...licForm, fecha_desde: e.target.value })}
                        className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Hasta *</label>
                      <input
                        type="date"
                        value={licForm.fecha_hasta}
                        onChange={(e) => setLicForm({ ...licForm, fecha_hasta: e.target.value })}
                        className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Estado</label>
                    <select
                      value={licForm.estado}
                      onChange={(e) => setLicForm({ ...licForm, estado: e.target.value })}
                      className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                    >
                      {ESTADOS_LICENCIA.map((s) => (
                        <option key={s.valor} value={s.valor}>
                          {s.etiqueta}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Notas</label>
                    <textarea
                      value={licForm.notas}
                      onChange={(e) => setLicForm({ ...licForm, notas: e.target.value })}
                      rows={2}
                      placeholder="Motivo, observaciones..."
                      className="w-full p-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                    />
                  </div>
                </>
              )}

              {tab === 'liquidaciones' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Empleado *</label>
                    <select
                      value={liqForm.empleado_id}
                      onChange={(e) => {
                        const emp = empleadoPorId[e.target.value];
                        setLiqForm({
                          ...liqForm,
                          empleado_id: e.target.value,
                          monto: emp ? String(emp.salario ?? 0) : liqForm.monto,
                        });
                      }}
                      className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                    >
                      <option value="">Seleccionar...</option>
                      {empleados.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Período *</label>
                      <input
                        type="month"
                        value={liqForm.periodo}
                        onChange={(e) => setLiqForm({ ...liqForm, periodo: e.target.value })}
                        className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Monto *</label>
                      <input
                        type="number"
                        min={0}
                        value={liqForm.monto}
                        onChange={(e) => setLiqForm({ ...liqForm, monto: e.target.value })}
                        placeholder="0"
                        className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Estado</label>
                      <select
                        value={liqForm.estado}
                        onChange={(e) => setLiqForm({ ...liqForm, estado: e.target.value })}
                        className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      >
                        {ESTADOS_LIQUIDACION.map((s) => (
                          <option key={s.valor} value={s.valor}>
                            {s.etiqueta}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Fecha de pago</label>
                      <input
                        type="date"
                        value={liqForm.fecha_pago}
                        onChange={(e) => setLiqForm({ ...liqForm, fecha_pago: e.target.value })}
                        className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Notas</label>
                    <textarea
                      value={liqForm.notas}
                      onChange={(e) => setLiqForm({ ...liqForm, notas: e.target.value })}
                      rows={2}
                      placeholder="Observaciones..."
                      className="w-full p-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                    />
                  </div>
                </>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="px-5 py-2.5 text-[var(--text2)] font-medium hover:bg-[var(--blue-header)] rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardar}
                  disabled={guardando}
                  className="px-5 py-2.5 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-deep)] transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {confirmarEliminar && (
        <Modal title="¿Eliminar registro?" onClose={() => setConfirmarEliminar(null)}>
          <div className="bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="p-3 bg-[var(--danger-soft)] rounded-xl w-fit mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-[var(--danger-deep)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text)] mb-2">¿Eliminar registro?</h3>
            <p className="text-sm text-[var(--text2)] mb-6">
              Vas a eliminar <strong className="text-[var(--text)]">{confirmarEliminar.nombre}</strong>. Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setConfirmarEliminar(null)}
                className="px-5 py-2.5 text-[var(--text2)] font-medium hover:bg-[var(--blue-header)] rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarBorrado}
                disabled={ocupadoId === confirmarEliminar.id}
                className="px-5 py-2.5 bg-[var(--danger)] text-white font-medium rounded-lg hover:bg-[var(--danger-deep)] transition-colors flex items-center gap-2 disabled:opacity-60"
              >
                {ocupadoId === confirmarEliminar.id && <Loader2 className="w-4 h-4 animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
