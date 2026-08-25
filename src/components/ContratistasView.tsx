import { Modal } from './Modal';
import ContratistasInforme from './ContratistasInforme';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { dinero, hoyISO, getErrorMessage } from '../lib/format';
import {
  fetchContratistas,
  crearContratista,
  actualizarContratista,
  eliminarContratista,
  fetchTrabajos,
  crearTrabajo,
  actualizarTrabajo,
  eliminarTrabajo,
  fetchEventos,
  registrarEvento,
  fetchPagos,
  crearPago,
  eliminarPago,
  LIMITES,
  revertirEgresoDePago,
  eliminarEventosDeContratista,
  TIPOS_TARIFA,
  ESTADOS_TRABAJO,
  etiquetaEstadoTrabajo,
  claseEstadoTrabajo,
  type Contratista,
  type TrabajoContratista,
  type EventoContratista,
  type PagoContratista,
} from '../lib/contratistas';
import { crearMovimiento, OPCIONES_CUENTA } from '../lib/finanzas';
import {
  UsersRound,
  HardHat,
  UserPlus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  CheckCircle2,
  Wallet,
  Clock,
  MapPin,
  Briefcase,
  FileBarChart2,
  HandCoins,
  Scissors,
} from 'lucide-react';

type Tab = 'contratistas' | 'trabajos' | 'informe';

const TAB_OPTIONS: { id: Tab; label: string; Icon: typeof UsersRound }[] = [
  { id: 'contratistas', label: 'Contratistas', Icon: UsersRound },
  { id: 'trabajos', label: 'Trabajos', Icon: HardHat },
  { id: 'informe', label: 'Informe y historial', Icon: FileBarChart2 },
];

interface ContratistaForm {
  nombre: string;
  telefono: string;
  dni: string;
  especialidad: string;
  tarifa: string;
  tipo_tarifa: string;
  activo: boolean;
  notas: string;
}

const emptyContratistaForm = (): ContratistaForm => ({
  nombre: '',
  telefono: '',
  dni: '',
  especialidad: '',
  tarifa: '',
  tipo_tarifa: 'por_trabajo',
  activo: true,
  notas: '',
});

interface TrabajoForm {
  contratista_id: string;
  descripcion: string;
  lugar: string;
  fecha: string;
  costo: string;
  estado: string;
  fecha_pago: string;
  nro_contrato: string;
  nro_remito: string;
  cantidad_arboles: string;
  notas: string;
}

const emptyTrabajoForm = (): TrabajoForm => ({
  contratista_id: '',
  descripcion: '',
  lugar: '',
  fecha: hoyISO(),
  costo: '',
  estado: 'pendiente',
  fecha_pago: '',
  nro_contrato: '',
  nro_remito: '',
  cantidad_arboles: '',
  notas: '',
});

const formatearTarifa = (tipo: string, tarifa: number) => {
  const sufijos: Record<string, string> = {
    por_trabajo: `${dinero(tarifa)}/trabajo`,
    por_hora: `${dinero(tarifa)}/h`,
    por_dia: `${dinero(tarifa)}/día`,
  };
  return sufijos[tipo] || dinero(tarifa);
};

export default function ContratistasView({ corredorId }: { corredorId: string }) {
  const [tab, setTab] = useState<Tab>(() => {
    try {
      const guardada = localStorage.getItem('danpa_contratistas_tab');
      if (guardada === 'trabajos' || guardada === 'informe') return guardada;
    } catch {
      // ignore
    }
    return 'contratistas';
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('danpa_contratistas_tab', tab);
    } catch {
      // ignore
    }
  }, [tab]);

  const [contratistas, setContratistas] = useState<Contratista[]>([]);
  const [trabajos, setTrabajos] = useState<TrabajoContratista[]>([]);
  const [eventos, setEventos] = useState<EventoContratista[]>([]);
  const [pagos, setPagos] = useState<PagoContratista[]>([]);

  const [modalPago, setModalPago] = useState<TrabajoContratista | null>(null);
  const [pagoForm, setPagoForm] = useState({ monto: '', fecha: hoyISO(), metodo: '', notas: '' });
  const [guardandoPago, setGuardandoPago] = useState(false);

  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState<{ tabla: Tab; id: string; nombre: string } | null>(null);
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);

  const [conForm, setConForm] = useState<ContratistaForm>(emptyContratistaForm());
  const [traForm, setTraForm] = useState<TrabajoForm>(emptyTrabajoForm());

  const contratistaPorId = useMemo(() => Object.fromEntries(contratistas.map((c) => [c.id, c])), [contratistas]);

  const pagadoPorTrabajo = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const p of pagos) mapa[p.trabajo_id] = (mapa[p.trabajo_id] || 0) + p.monto;
    return mapa;
  }, [pagos]);

  const cargarTodo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [cons, trabs, evs, pgs] = await Promise.all([
        fetchContratistas(corredorId),
        fetchTrabajos(corredorId),
        fetchEventos(corredorId),
        fetchPagos(corredorId),
      ]);
      setContratistas(cons);
      setTrabajos(trabs);
      setEventos(evs);
      setPagos(pgs);
    } catch (err: any) {
      console.error(err);
      setError(getErrorMessage(err, 'Error al cargar Subcontratados.'));
    } finally {
      setLoading(false);
    }
  }, [corredorId]);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  const cargarTab = async (t: Tab) => {
    try {
      setError(null);
      if (t === 'contratistas') setContratistas(await fetchContratistas(corredorId));
      if (t === 'trabajos') {
        const [trabs, pgs] = await Promise.all([fetchTrabajos(corredorId), fetchPagos(corredorId)]);
        setTrabajos(trabs);
        setPagos(pgs);
      }
      if (t === 'informe') {
        const [cons, trabs, evs, pgs] = await Promise.all([
          fetchContratistas(corredorId),
          fetchTrabajos(corredorId),
          fetchEventos(corredorId),
          fetchPagos(corredorId),
        ]);
        setContratistas(cons);
        setTrabajos(trabs);
        setEventos(evs);
        setPagos(pgs);
      }
    } catch (err: any) {
      console.error(err);
      setError(getErrorMessage(err, 'Error al actualizar.'));
    }
  };

  const abrirNuevo = () => {
    setEditando(null);
    setConForm(emptyContratistaForm());
    setTraForm(emptyTrabajoForm());
    setModal(true);
  };

  const abrirEditar = (t: Tab, id: string) => {
    setEditando(id);
    if (t === 'contratistas') {
      const c = contratistaPorId[id];
      if (!c) return;
      setConForm({
        nombre: c.nombre,
        telefono: c.telefono || '',
        dni: c.dni || '',
        especialidad: c.especialidad || '',
        tarifa: String(c.tarifa ?? 0),
        tipo_tarifa: c.tipo_tarifa,
        activo: c.activo,
        notas: c.notas || '',
      });
    }
    if (t === 'trabajos') {
      const tr = trabajos.find((x) => x.id === id);
      if (!tr) return;
      setTraForm({
        contratista_id: tr.contratista_id,
        descripcion: tr.descripcion,
        lugar: tr.lugar || '',
        fecha: tr.fecha,
        costo: String(tr.costo ?? 0),
        estado: tr.estado,
        fecha_pago: tr.fecha_pago || '',
        nro_contrato: tr.nro_contrato || '',
        nro_remito: tr.nro_remito || '',
        cantidad_arboles: tr.cantidad_arboles != null ? String(tr.cantidad_arboles) : '',
        notas: tr.notas || '',
      });
    }
    setModal(true);
  };

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    try {
      if (tab === 'contratistas') {
        if (!conForm.nombre.trim()) {
          alert('Escribí el nombre del contratista.');
          setGuardando(false);
          return;
        }
        const payload = {
          nombre: conForm.nombre.trim(),
          telefono: conForm.telefono.trim() || undefined,
          dni: conForm.dni.trim() || undefined,
          especialidad: conForm.especialidad.trim() || undefined,
          tarifa: Math.max(0, Number(conForm.tarifa) || 0),
          tipo_tarifa: conForm.tipo_tarifa,
          activo: conForm.activo,
          notas: conForm.notas.trim() || undefined,
        };
        if (editando) {
          await actualizarContratista(editando, payload);
          await registrarEvento({
            corredor_id: corredorId,
            contratista_id: editando,
            tipo: 'edicion',
            descripcion: `Se actualizaron los datos de ${payload.nombre}.`,
          });
        } else {
          const creado = await crearContratista({ corredor_id: corredorId, ...payload });
          await registrarEvento({
            corredor_id: corredorId,
            contratista_id: creado.id,
            tipo: 'creacion',
            descripcion: `Se registró al contratista ${creado.nombre}${creado.especialidad ? ` (${creado.especialidad})` : ''}.`,
          });
        }
      }

      if (tab === 'trabajos') {
        if (!traForm.contratista_id) {
          alert('Elegí el contratista.');
          setGuardando(false);
          return;
        }
        if (!traForm.descripcion.trim()) {
          alert('Escribí la descripción del trabajo.');
          setGuardando(false);
          return;
        }
        if (!traForm.fecha) {
          alert('Elegí la fecha.');
          setGuardando(false);
          return;
        }
        const costo = Math.max(0, Number(traForm.costo) || 0);
        if (costo <= 0) {
          alert('El costo debe ser mayor a 0.');
          setGuardando(false);
          return;
        }
        const arboles = traForm.cantidad_arboles.trim() ? Math.max(0, Math.floor(Number(traForm.cantidad_arboles) || 0)) : null;
        const payload = {
          contratista_id: traForm.contratista_id,
          descripcion: traForm.descripcion.trim(),
          lugar: traForm.lugar.trim() || undefined,
          fecha: traForm.fecha,
          costo,
          estado: traForm.estado,
          fecha_pago: traForm.fecha_pago || undefined,
          nro_contrato: traForm.nro_contrato.trim() || undefined,
          nro_remito: traForm.nro_remito.trim() || undefined,
          cantidad_arboles: arboles,
          notas: traForm.notas.trim() || undefined,
        };
        if (editando) {
          const previo = trabajos.find((x) => x.id === editando);
          if (
            previo &&
            payload.contratista_id !== previo.contratista_id &&
            (pagadoPorTrabajo[editando] || 0) > 0.009
          ) {
            const ok = window.confirm(
              'Este trabajo tiene pagos registrados. Al cambiarle el contratista, los pagos existentes seguirán figurando a nombre del contratista anterior en los informes históricos. ¿Continuar igual?'
            );
            if (!ok) {
              setGuardando(false);
              return;
            }
          }
          await actualizarTrabajo(editando, payload);
          await registrarEvento({
            corredor_id: corredorId,
            contratista_id: payload.contratista_id,
            trabajo_id: editando,
            tipo: 'edicion',
            descripcion: `Se editó el trabajo "${payload.descripcion}" (${dinero(costo)}).`,
          });
          if (payload.estado === 'pagado') {
            const existente = trabajos.find((x) => x.id === editando);
            const pagado = pagadoPorTrabajo[editando] || 0;
            const saldo = costo - pagado;
            if (existente && saldo > 0.009) {
              await registrarPagoEfectuado({ ...existente, costo }, saldo, payload.fecha_pago || hoyISO(), '', '', pagos);
            }
          }
        } else {
          const creado = await crearTrabajo({ corredor_id: corredorId, ...payload });
          await registrarEvento({
            corredor_id: corredorId,
            contratista_id: creado.contratista_id,
            trabajo_id: creado.id,
            tipo: 'creacion',
            descripcion: `Nuevo trabajo "${creado.descripcion}" por ${dinero(creado.costo)}${creado.nro_contrato ? `, contrato ${creado.nro_contrato}` : ''}${creado.nro_remito ? `, remito ${creado.nro_remito}` : ''}${creado.cantidad_arboles ? `, ${creado.cantidad_arboles} ${creado.cantidad_arboles === 1 ? 'árbol podado' : 'árboles podados'}` : ''}.`,
          });
          if (creado.estado === 'pagado') {
            await registrarPagoEfectuado(creado, costo, payload.fecha_pago || hoyISO(), '', '', pagos);
          }
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
    const revertirPagos = async (lista: PagoContratista[]) => {
      for (const pg of lista) {
        await eliminarPago(pg.id);
        try {
          await revertirEgresoDePago(corredorId, pg, conceptosEgresoDePago(pg));
        } catch (revErr: any) {
          console.error('No se pudo revertir el egreso del pago:', revErr);
        }
      }
    };
    try {
      if (confirmarEliminar.tab === 'contratistas') {
        const con = contratistas.find((c) => c.id === confirmarEliminar.id);
        const trs = trabajos.filter((t) => t.contratista_id === confirmarEliminar.id);
        const pgs = pagos.filter((p) => p.contratista_id === confirmarEliminar.id);
        if (trs.length > 0 || pgs.length > 0) {
          const totalPgs = pgs.reduce((a, p) => a + p.monto, 0);
          const ok = window.confirm(
            `${con?.nombre || 'Este contratista'} tiene ${trs.length} trabajo(s) y ${pgs.length} pago(s) por ${dinero(totalPgs)}.\n\nSe eliminarán junto con su historial y se revertirán los egresos de los pagos en Centro financiero. Esta acción no se puede deshacer. ¿Continuar?`
          );
          if (!ok) {
            setOcupadoId(null);
            return;
          }
          await revertirPagos(pgs);
          for (const t of trs) await eliminarTrabajo(t.id);
        }
        try {
          await eliminarEventosDeContratista(corredorId, confirmarEliminar.id);
        } catch (evErr: any) {
          console.error('No se pudieron eliminar los eventos del contratista:', evErr);
        }
        await eliminarContratista(confirmarEliminar.id);
      }
      if (confirmarEliminar.tab === 'trabajos') {
        const tr = trabajos.find((x) => x.id === confirmarEliminar.id);
        const pagosDelTrabajo = pagos.filter((p) => p.trabajo_id === confirmarEliminar.id);
        if (pagosDelTrabajo.length > 0) {
          const totalPgs = pagosDelTrabajo.reduce((a, p) => a + p.monto, 0);
          const ok = window.confirm(
            `Este trabajo tiene ${pagosDelTrabajo.length} pago(s) por ${dinero(totalPgs)}. Al eliminarlo se anulan esos pagos y se revierten sus egresos en Centro financiero. ¿Continuar?`
          );
          if (!ok) {
            setOcupadoId(null);
            return;
          }
          await revertirPagos(pagosDelTrabajo);
        }
        await eliminarTrabajo(confirmarEliminar.id);
        if (tr) {
          await registrarEvento({
            corredor_id: corredorId,
            contratista_id: tr.contratista_id,
            tipo: 'eliminado',
            descripcion: `Se eliminó el trabajo "${tr.descripcion}" (${dinero(tr.costo)})${
              pagosDelTrabajo.length ? `, anulando sus ${pagosDelTrabajo.length} pago(s)` : ''
            }.`,
          });
        }
      }
      setConfirmarEliminar(null);
      await cargarTodo();
    } catch (err: any) {
      console.error(err);
      setError(getErrorMessage(err, 'Error al eliminar.'));
    } finally {
      setOcupadoId(null);
    }
  };

  const recalcularEstado = async (trabajoId: string, listaPagos: PagoContratista[]) => {
    const tr = trabajos.find((x) => x.id === trabajoId);
    if (!tr) return;
    const pagosDelTrabajo = listaPagos.filter((p) => p.trabajo_id === trabajoId);
    const pagado = pagosDelTrabajo.reduce((a, p) => a + p.monto, 0);
    let estado = 'pendiente';
    if (tr.costo > 0 && pagado >= tr.costo - 0.009) estado = 'pagado';
    else if (pagado > 0) estado = 'parcial';
    const ultimaFechaPago = pagosDelTrabajo.map((p) => p.fecha).sort().slice(-1)[0];
    await actualizarTrabajo(trabajoId, { estado, fecha_pago: estado === 'pagado' ? ultimaFechaPago || hoyISO() : null });
  };

  /** Conceptos posibles del egreso creado para un pago (fallback sin marcador). */
  const conceptosEgresoDePago = (pago: PagoContratista): string[] => {
    const tr = trabajos.find((x) => x.id === pago.trabajo_id);
    if (!tr) return [];
    const con = contratistaPorId[tr.contratista_id];
    const base = `${con?.nombre || 'contratista'} - ${tr.descripcion}`;
    return [`Subcontratado: ${base}`, `Subcontratado: ${base} (pago parcial)`];
  };

  const registrarPagoEfectuado = async (
    tr: TrabajoContratista,
    monto: number,
    fecha: string,
    metodo: string,
    notas: string,
    listaPagosActual: PagoContratista[]
  ) => {
    const con = contratistaPorId[tr.contratista_id];
    const pagadoAntes = listaPagosActual.filter((p) => p.trabajo_id === tr.id).reduce((a, p) => a + p.monto, 0);
    const quedaSaldo = pagadoAntes + monto < tr.costo - 0.009;
    const nuevoPago = await crearPago({
      corredor_id: corredorId,
      contratista_id: tr.contratista_id,
      trabajo_id: tr.id,
      monto,
      fecha,
      metodo: metodo || undefined,
      notas: notas || undefined,
    });
    try {
      await crearMovimiento({
        corredor_id: corredorId,
        concepto: `Subcontratado: ${con?.nombre || 'contratista'} - ${tr.descripcion}${quedaSaldo ? ' (pago parcial)' : ''}`,
        monto: -Math.abs(monto),
        categoria: 'Contratistas',
        fecha,
        notas: `${notas || ''}${metodo ? ` · Medio: ${metodo}` : ''}${tr.nro_remito ? ` · Remito ${tr.nro_remito}` : ''}${tr.nro_contrato ? ` · Contrato ${tr.nro_contrato}` : ''} [pago:${nuevoPago.id}]`.trim(),
      });
    } catch (mErr: any) {
      console.error('No se pudo registrar el egreso:', mErr);
      setError(`El pago se registró, pero no se pudo crear el egreso en Centro financiero: ${getErrorMessage(mErr)}`);
    }
    await registrarEvento({
      corredor_id: corredorId,
      contratista_id: tr.contratista_id,
      trabajo_id: tr.id,
      tipo: 'pago',
      descripcion: `${quedaSaldo ? 'Pago parcial' : 'Pago final'} de "${tr.descripcion}"${tr.nro_remito ? ` (remito ${tr.nro_remito})` : ''}.`,
      monto,
    });
    await recalcularEstado(tr.id, [...listaPagosActual, nuevoPago]);
  };

  const abrirModalPago = (tr: TrabajoContratista) => {
    const saldo = Math.max(0, tr.costo - (pagadoPorTrabajo[tr.id] || 0));
    setPagoForm({ monto: saldo ? String(saldo) : '', fecha: hoyISO(), metodo: '', notas: '' });
    setModalPago(tr);
  };

  const guardarPago = async () => {
    if (!modalPago) return;
    const saldo = Math.max(0, modalPago.costo - (pagadoPorTrabajo[modalPago.id] || 0));
    const monto = Number(pagoForm.monto) || 0;
    if (monto <= 0) {
      alert('El monto debe ser mayor a 0.');
      return;
    }
    if (monto > saldo + 0.009) {
      alert(`El monto supera el saldo pendiente (${dinero(saldo)}).`);
      return;
    }
    if (!pagoForm.fecha) {
      alert('Elegí la fecha del pago.');
      return;
    }
    setGuardandoPago(true);
    setError(null);
    try {
      const pagosFrescos = await fetchPagos(corredorId, { trabajoId: modalPago.id });
      const pagadoFresco = pagosFrescos.reduce((a, p) => a + p.monto, 0);
      const saldoFresco = Math.max(0, modalPago.costo - pagadoFresco);
      if (monto > saldoFresco + 0.009) {
        alert(`El saldo cambió: quedan ${dinero(saldoFresco)} pendientes para este trabajo.`);
        return;
      }
      await registrarPagoEfectuado(modalPago, monto, pagoForm.fecha, pagoForm.metodo.trim(), pagoForm.notas.trim(), pagosFrescos);
      setModalPago(null);
      await cargarTab('trabajos');
    } catch (err: any) {
      console.error(err);
      setError(getErrorMessage(err, 'Error al registrar el pago.'));
    } finally {
      setGuardandoPago(false);
    }
  };

  const anularPago = async (pago: PagoContratista) => {
    if (
      !window.confirm(
        `¿Anular el pago de ${dinero(pago.monto)} del ${pago.fecha}? Se recalcula el estado del trabajo y se revierte el egreso en Centro financiero.`
      )
    )
      return;
    setOcupadoId(pago.id);
    setError(null);
    try {
      const restantes = pagos.filter((p) => p.id !== pago.id);
      await eliminarPago(pago.id);
      let egresoRevertido = false;
      try {
        egresoRevertido = await revertirEgresoDePago(corredorId, pago, conceptosEgresoDePago(pago));
      } catch (revErr: any) {
        console.error('No se pudo revertir el egreso:', revErr);
      }
      const tr = trabajos.find((x) => x.id === pago.trabajo_id);
      await registrarEvento({
        corredor_id: corredorId,
        contratista_id: pago.contratista_id,
        trabajo_id: pago.trabajo_id,
        tipo: 'nota',
        descripcion: `Se anuló un pago de ${dinero(pago.monto)}${tr ? ` del trabajo "${tr.descripcion}"` : ''}.${
          egresoRevertido
            ? ' Se revirtió el egreso asociado en Centro financiero.'
            : ' No se encontró el egreso asociado en Centro financiero; revisar manualmente.'
        }`,
      });
      setPagos(restantes);
      if (tr) await recalcularEstado(tr.id, restantes);
      await cargarTab('trabajos');
    } catch (err: any) {
      console.error(err);
      setError(getErrorMessage(err, 'Error al anular el pago.'));
    } finally {
      setOcupadoId(null);
    }
  };

  const kpisContratistas = useMemo(() => {
    const activos = contratistas.filter((c) => c.activo);
    const porTrabajo = contratistas.filter((c) => c.tipo_tarifa === 'por_trabajo');
    const porHora = contratistas.filter((c) => c.tipo_tarifa === 'por_hora' || c.tipo_tarifa === 'por_dia');
    return [
      { label: 'Contratistas', valor: String(contratistas.length), Icon: UsersRound, fondo: 'bg-[var(--blue-soft)]', iconColor: 'text-[var(--text)]' },
      { label: 'Activos', valor: String(activos.length), Icon: CheckCircle2, fondo: 'bg-[var(--primary-soft)]', iconColor: 'text-[var(--primary-deep)]' },
      { label: 'Por trabajo', valor: String(porTrabajo.length), Icon: Briefcase, fondo: 'bg-[var(--amber-soft2)]', iconColor: 'text-[var(--amber-text2)]' },
      { label: 'Por hora/día', valor: String(porHora.length), Icon: Clock, fondo: 'bg-[var(--gray-soft)]', iconColor: 'text-[var(--text2)]' },
    ];
  }, [contratistas]);

  const kpisTrabajos = useMemo(() => {
    const conSaldo = trabajos.filter((t) => t.estado !== 'pagado');
    const totalPagado = trabajos.reduce((a, t) => a + Math.min(pagadoPorTrabajo[t.id] || 0, t.costo), 0);
    const totalPendiente = trabajos.reduce((a, t) => a + Math.max(0, t.costo - (pagadoPorTrabajo[t.id] || 0)), 0);
    return [
      { label: 'Trabajos', valor: String(trabajos.length), Icon: HardHat, fondo: 'bg-[var(--blue-soft)]', iconColor: 'text-[var(--text)]' },
      { label: 'Con saldo pendiente', valor: String(conSaldo.length), Icon: Clock, fondo: 'bg-[var(--amber-soft2)]', iconColor: 'text-[var(--amber-text2)]' },
      { label: 'Pendiente $', valor: dinero(totalPendiente), Icon: Wallet, fondo: 'bg-[var(--amber-soft)]', iconColor: 'text-[var(--amber-text3)]' },
      { label: 'Pagado $', valor: dinero(totalPagado), Icon: CheckCircle2, fondo: 'bg-[var(--primary-soft)]', iconColor: 'text-[var(--primary-deep)]' },
    ];
  }, [trabajos, pagadoPorTrabajo]);

  const datosTruncados = trabajos.length >= LIMITES.trabajos || pagos.length >= LIMITES.pagos;

  const kpis = tab === 'contratistas' ? kpisContratistas : tab === 'trabajos' ? kpisTrabajos : [];

  const tituloTab = tab === 'contratistas' ? 'Contratistas' : tab === 'trabajos' ? 'Trabajos' : 'Informe y historial';

  const descripcionTab =
    tab === 'contratistas'
      ? 'Personal subcontratado para tareas específicas.'
      : tab === 'trabajos'
        ? 'Tareas puntuales realizadas por contratistas y su pago.'
        : 'Pagos por contratista, contratos, remitos e historial de eventos.';

  const nombreContratista = (id: string) => contratistaPorId[id]?.nombre || '—';

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-[1440px] mx-auto w-full">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text)] tracking-tight">Subcontratados</h2>
          <p className="text-[var(--text2)] mt-1">{descripcionTab}</p>
        </div>
        {tab !== 'informe' && (
          <button
            onClick={() => abrirNuevo()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-deep)] transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo {tab === 'contratistas' ? 'contratista' : 'trabajo'}
          </button>
        )}
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

      {datosTruncados && !loading && (
        <div className="bg-[var(--amber-soft)] text-[var(--amber-text3)] p-4 rounded-xl flex items-start gap-4 mb-8">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <p className="text-sm">
            Hay muchos registros: se muestran los más recientes (hasta {LIMITES.trabajos.toLocaleString('es-AR')} trabajos y{' '}
            {LIMITES.pagos.toLocaleString('es-AR')} pagos). Los saldos e informes podrían estar incompletos.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text2)]">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-[var(--primary)]" />
          <p>Cargando Subcontratados...</p>
        </div>
      ) : tab === 'informe' ? (
        <ContratistasInforme
          contratistas={contratistas}
          trabajos={trabajos}
          eventos={eventos}
          pagos={pagos}
          onAnularPago={anularPago}
        />
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

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div
              className={`hidden md:grid gap-4 px-6 py-3 bg-[var(--blue-header)] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wider text-[var(--text2)] ${
                tab === 'contratistas' ? 'grid-cols-[1.6fr_1fr_1fr_1fr_1fr_170px]' : 'grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1fr_170px]'
              }`}
            >
              {tab === 'contratistas' && (
                <>
                  <span>Contratista</span>
                  <span>Especialidad</span>
                  <span>Teléfono</span>
                  <span>Tarifa</span>
                  <span>Estado</span>
                  <span className="text-right">Acciones</span>
                </>
              )}
              {tab === 'trabajos' && (
                <>
                  <span>Contratista</span>
                  <span>Descripción</span>
                  <span>Fecha</span>
                  <span>Costo</span>
                  <span>Estado</span>
                  <span>Pago</span>
                  <span className="text-right">Acciones</span>
                </>
              )}
            </div>

            <div className="divide-y divide-[var(--border)]/60">
              {tab === 'contratistas' &&
                contratistas.map((c) => (
                  <div key={c.id} className="grid md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_170px] gap-2 md:gap-4 items-center px-6 py-4">
                    <div>
                      <p className="font-semibold text-[var(--text)] truncate">{c.nombre}</p>
                      <p className="text-xs text-[var(--text2)] md:hidden">{c.especialidad || 'Sin especialidad'}</p>
                    </div>
                    <p className="text-[var(--text2)] text-sm hidden md:block truncate">{c.especialidad || '—'}</p>
                    <p className="text-[var(--text2)] text-sm hidden md:block truncate">{c.telefono || '—'}</p>
                    <p className="text-[var(--text)] text-sm hidden md:block font-medium">{formatearTarifa(c.tipo_tarifa, c.tarifa)}</p>
                    <span
                      className={`justify-self-start text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded ${
                        c.activo ? 'bg-[var(--primary-soft)] text-[var(--primary-deep)]' : 'bg-[var(--gray-soft)] text-[var(--text2)]'
                      }`}
                    >
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => abrirEditar('contratistas', c.id)}
                        title="Editar"
                        className="p-2 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--blue-header)] transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmarEliminar({ tabla: 'contratistas', id: c.id, nombre: c.nombre })}
                        title="Eliminar"
                        className="p-2 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:text-[var(--danger-deep)] hover:bg-[var(--danger-soft)] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

              {tab === 'trabajos' &&
                trabajos.map((t) => (
                  <div key={t.id} className="grid md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1fr_170px] gap-2 md:gap-4 items-center px-6 py-4">
                    <p className="font-semibold text-[var(--text)] truncate">{nombreContratista(t.contratista_id)}</p>
                    <div className="min-w-0">
                      <p className="text-[var(--text)] text-sm truncate">{t.descripcion}</p>
                      {t.lugar && (
                        <p className="text-xs text-[var(--text2)] flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {t.lugar}
                        </p>
                      )}
                      {(t.nro_contrato || t.nro_remito) && (
                        <p className="text-xs text-[var(--text2)] truncate">
                          {t.nro_contrato ? `Contrato ${t.nro_contrato}` : ''}{t.nro_contrato && t.nro_remito ? ' · ' : ''}{t.nro_remito ? `Remito ${t.nro_remito}` : ''}
                        </p>
                      )}
                      {t.cantidad_arboles != null && t.cantidad_arboles > 0 && (
                        <p className="text-xs text-[var(--primary-deep)] font-semibold flex items-center gap-1">
                          <Scissors className="w-3 h-3" />
                          {t.cantidad_arboles} {t.cantidad_arboles === 1 ? 'árbol podado' : 'árboles podados'}
                        </p>
                      )}
                    </div>
                    <p className="text-[var(--text2)] text-sm hidden md:block">{t.fecha}</p>
                    <div>
                      <p className="text-[var(--text)] text-sm font-medium">{dinero(t.costo)}</p>
                      {(pagadoPorTrabajo[t.id] || 0) > 0 && (
                        <p className="text-xs text-[var(--primary-deep)] font-semibold">
                          Pagado {dinero(Math.min(pagadoPorTrabajo[t.id] || 0, t.costo))}
                        </p>
                      )}
                    </div>
                    <span className={`justify-self-start text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded ${claseEstadoTrabajo(t.estado)}`}>
                      {etiquetaEstadoTrabajo(t.estado)}
                    </span>
                    <p className="text-[var(--text2)] text-sm hidden md:block">{t.fecha_pago || '—'}</p>
                    <div className="flex items-center justify-end gap-2">
                      {t.estado !== 'pagado' && (
                        <button
                          onClick={() => abrirModalPago(t)}
                          disabled={ocupadoId === t.id}
                          title="Registrar pago (total o parcial)"
                          className="p-2 rounded-lg border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary-soft)] transition-colors disabled:opacity-60"
                        >
                          {ocupadoId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <HandCoins className="w-4 h-4" />}
                        </button>
                      )}
                      <button
                        onClick={() => abrirEditar('trabajos', t.id)}
                        title="Editar"
                        className="p-2 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--blue-header)] transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmarEliminar({ tabla: 'trabajos', id: t.id, nombre: t.descripcion })}
                        title="Eliminar"
                        className="p-2 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:text-[var(--danger-deep)] hover:bg-[var(--danger-soft)] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {((tab === 'contratistas' && contratistas.length === 0) || (tab === 'trabajos' && trabajos.length === 0)) && (
              <div className="p-12 text-center text-[var(--text2)]">
                <Briefcase className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
                <p>No hay {tituloTab.toLowerCase()} registrados. Agregá el primero con el botón superior.</p>
              </div>
            )}
          </div>
        </>
      )}

      {modal && (
        <Modal title={`${editando ? 'Editar' : 'Nuevo'} ${tab === 'contratistas' ? 'contratista' : 'trabajo'}`} onClose={() => setModal(false)}>
          <div className="bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--field)]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--primary-soft)] rounded-lg">
                  <UserPlus className="w-5 h-5 text-[var(--primary-deep)]" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text)]">
                  {editando ? 'Editar' : 'Nuevo'} {tab === 'contratistas' ? 'contratista' : 'trabajo'}
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
              {tab === 'contratistas' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Nombre *</label>
                    <input
                      type="text"
                      value={conForm.nombre}
                      onChange={(e) => setConForm({ ...conForm, nombre: e.target.value })}
                      placeholder="Nombre y apellido o empresa"
                      className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Teléfono</label>
                      <input
                        type="text"
                        value={conForm.telefono}
                        onChange={(e) => setConForm({ ...conForm, telefono: e.target.value })}
                        placeholder="+54 221..."
                        className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">DNI / CUIT</label>
                      <input
                        type="text"
                        value={conForm.dni}
                        onChange={(e) => setConForm({ ...conForm, dni: e.target.value })}
                        placeholder="20-12345678-9"
                        className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Especialidad</label>
                    <input
                      type="text"
                      value={conForm.especialidad}
                      onChange={(e) => setConForm({ ...conForm, especialidad: e.target.value })}
                      placeholder="Ej: Poda, Fletes, Electricidad"
                      className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Tarifa</label>
                      <input
                        type="number"
                        min={0}
                        value={conForm.tarifa}
                        onChange={(e) => setConForm({ ...conForm, tarifa: e.target.value })}
                        placeholder="0"
                        className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Tipo de tarifa</label>
                      <select
                        value={conForm.tipo_tarifa}
                        onChange={(e) => setConForm({ ...conForm, tipo_tarifa: e.target.value })}
                        className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      >
                        {TIPOS_TARIFA.map((t) => (
                          <option key={t.valor} value={t.valor}>
                            {t.etiqueta}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setConForm({ ...conForm, activo: !conForm.activo })}
                      className={`w-full h-12 px-4 rounded-lg border font-medium transition-colors ${
                        conForm.activo
                          ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--primary-soft)]'
                          : 'border-[var(--border)] text-[var(--text2)] bg-[var(--field)]'
                      }`}
                    >
                      {conForm.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Notas</label>
                    <textarea
                      value={conForm.notas}
                      onChange={(e) => setConForm({ ...conForm, notas: e.target.value })}
                      rows={2}
                      placeholder="Observaciones..."
                      className="w-full p-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                    />
                  </div>
                </>
              )}

              {tab === 'trabajos' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Contratista *</label>
                    <select
                      value={traForm.contratista_id}
                      onChange={(e) => setTraForm({ ...traForm, contratista_id: e.target.value })}
                      className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                    >
                      <option value="">Seleccionar...</option>
                      {contratistas
                        .filter((c) => c.activo)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Descripción del trabajo *</label>
                    <input
                      type="text"
                      value={traForm.descripcion}
                      onChange={(e) => setTraForm({ ...traForm, descripcion: e.target.value })}
                      placeholder="Ej: Poda de 3 árboles en Avenida 7"
                      className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Lugar</label>
                      <input
                        type="text"
                        value={traForm.lugar}
                        onChange={(e) => setTraForm({ ...traForm, lugar: e.target.value })}
                        placeholder="Domicilio / obra"
                        className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Fecha *</label>
                      <input
                        type="date"
                        value={traForm.fecha}
                        onChange={(e) => setTraForm({ ...traForm, fecha: e.target.value })}
                        className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">N° de contrato</label>
                      <input
                        type="text"
                        value={traForm.nro_contrato}
                        onChange={(e) => setTraForm({ ...traForm, nro_contrato: e.target.value })}
                        placeholder="Ej: CT-2026-014"
                        className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">N° de remito</label>
                      <input
                        type="text"
                        value={traForm.nro_remito}
                        onChange={(e) => setTraForm({ ...traForm, nro_remito: e.target.value })}
                        placeholder="Ej: R-0001-00012345"
                        className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Árboles podados</label>
                      <input
                        type="number"
                        min={0}
                        value={traForm.cantidad_arboles}
                        onChange={(e) => setTraForm({ ...traForm, cantidad_arboles: e.target.value })}
                        placeholder="0"
                        className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Costo *</label>
                      <input
                        type="number"
                        min={0}
                        value={traForm.costo}
                        onChange={(e) => setTraForm({ ...traForm, costo: e.target.value })}
                        placeholder="0"
                        className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Estado</label>
                      <select
                        value={traForm.estado}
                        onChange={(e) => setTraForm({ ...traForm, estado: e.target.value })}
                        className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      >
                        {ESTADOS_TRABAJO.map((s) => (
                          <option key={s.valor} value={s.valor}>
                            {s.etiqueta}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Fecha de pago</label>
                    <input
                      type="date"
                      value={traForm.fecha_pago}
                      onChange={(e) => setTraForm({ ...traForm, fecha_pago: e.target.value })}
                      className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Notas</label>
                    <textarea
                      value={traForm.notas}
                      onChange={(e) => setTraForm({ ...traForm, notas: e.target.value })}
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

      {modalPago && (
        <Modal title="Registrar pago" onClose={() => setModalPago(null)}>
          <div className="bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--field)]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--primary-soft)] rounded-lg">
                  <HandCoins className="w-5 h-5 text-[var(--primary-deep)]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[var(--text)]">Registrar pago</h3>
                  <p className="text-xs text-[var(--text2)] truncate max-w-[240px]">
                    {nombreContratista(modalPago.contratista_id)} · {modalPago.descripcion}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalPago(null)}
                className="text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--hover)] p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 pt-5 pb-1 grid grid-cols-3 gap-3 text-center">
              <div className="bg-[var(--field)] rounded-lg p-3">
                <p className="text-[10px] font-semibold text-[var(--text2)] uppercase tracking-wider">Costo</p>
                <p className="text-sm font-bold text-[var(--text)] mt-1">{dinero(modalPago.costo)}</p>
              </div>
              <div className="bg-[var(--field)] rounded-lg p-3">
                <p className="text-[10px] font-semibold text-[var(--text2)] uppercase tracking-wider">Pagado</p>
                <p className="text-sm font-bold text-[var(--primary-deep)] mt-1">{dinero(Math.min(pagadoPorTrabajo[modalPago.id] || 0, modalPago.costo))}</p>
              </div>
              <div className="bg-[var(--amber-soft2)] rounded-lg p-3">
                <p className="text-[10px] font-semibold text-[var(--amber-text2)] uppercase tracking-wider">Saldo</p>
                <p className="text-sm font-bold text-[var(--amber-text2)] mt-1">
                  {dinero(Math.max(0, modalPago.costo - (pagadoPorTrabajo[modalPago.id] || 0)))}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Monto a pagar *</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={pagoForm.monto}
                    onChange={(e) => setPagoForm({ ...pagoForm, monto: e.target.value })}
                    placeholder="0"
                    className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  />
                  <p className="text-xs text-[var(--text2)]">Podés pagar todo o una parte (pago parcial).</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Fecha del pago *</label>
                  <input
                    type="date"
                    value={pagoForm.fecha}
                    onChange={(e) => setPagoForm({ ...pagoForm, fecha: e.target.value })}
                    className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Medio de pago</label>
                <select
                  value={pagoForm.metodo}
                  onChange={(e) => setPagoForm({ ...pagoForm, metodo: e.target.value })}
                  className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                >
                  <option value="">Sin especificar</option>
                  {OPCIONES_CUENTA.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Notas</label>
                <textarea
                  value={pagoForm.notas}
                  onChange={(e) => setPagoForm({ ...pagoForm, notas: e.target.value })}
                  rows={2}
                  placeholder="Observaciones del pago..."
                  className="w-full p-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setModalPago(null)}
                  className="px-5 py-2.5 text-[var(--text2)] font-medium hover:bg-[var(--blue-header)] rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardarPago}
                  disabled={guardandoPago}
                  className="px-5 py-2.5 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-deep)] transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  {guardandoPago && <Loader2 className="w-4 h-4 animate-spin" />}
                  Registrar pago
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
