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
  TIPOS_TARIFA,
  ESTADOS_TRABAJO,
  etiquetaEstadoTrabajo,
  claseEstadoTrabajo,
  type Contratista,
  type TrabajoContratista,
} from '../lib/contratistas';
import { crearMovimiento } from '../lib/finanzas';
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
  Banknote,
  Clock,
  MapPin,
  Briefcase,
} from 'lucide-react';

type Tab = 'contratistas' | 'trabajos';

const TAB_OPTIONS: { id: Tab; label: string; Icon: typeof UsersRound }[] = [
  { id: 'contratistas', label: 'Contratistas', Icon: UsersRound },
  { id: 'trabajos', label: 'Trabajos', Icon: HardHat },
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
  const [tab, setTab] = useState<Tab>('contratistas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [contratistas, setContratistas] = useState<Contratista[]>([]);
  const [trabajos, setTrabajos] = useState<TrabajoContratista[]>([]);

  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState<{ tabla: Tab; id: string; nombre: string } | null>(null);
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);

  const [conForm, setConForm] = useState<ContratistaForm>(emptyContratistaForm());
  const [traForm, setTraForm] = useState<TrabajoForm>(emptyTrabajoForm());

  const contratistaPorId = useMemo(() => Object.fromEntries(contratistas.map((c) => [c.id, c])), [contratistas]);

  const cargarTodo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [cons, trabs] = await Promise.all([
        fetchContratistas(corredorId),
        fetchTrabajos(corredorId),
      ]);
      setContratistas(cons);
      setTrabajos(trabs);
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
      if (t === 'trabajos') setTrabajos(await fetchTrabajos(corredorId));
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
        } else {
          await crearContratista({ corredor_id: corredorId, ...payload });
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
        const payload = {
          contratista_id: traForm.contratista_id,
          descripcion: traForm.descripcion.trim(),
          lugar: traForm.lugar.trim() || undefined,
          fecha: traForm.fecha,
          costo,
          estado: traForm.estado,
          fecha_pago: traForm.fecha_pago || undefined,
          notas: traForm.notas.trim() || undefined,
        };
        if (editando) {
          await actualizarTrabajo(editando, payload);
        } else {
          await crearTrabajo({ corredor_id: corredorId, ...payload });
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
      if (confirmarEliminar.tab === 'contratistas') await eliminarContratista(confirmarEliminar.id);
      if (confirmarEliminar.tab === 'trabajos') await eliminarTrabajo(confirmarEliminar.id);
      setConfirmarEliminar(null);
      await cargarTodo();
    } catch (err: any) {
      console.error(err);
      setError(getErrorMessage(err, 'Error al eliminar.'));
    } finally {
      setOcupadoId(null);
    }
  };

  const marcarTrabajoPagado = async (tr: TrabajoContratista) => {
    setOcupadoId(tr.id);
    setError(null);
    try {
      const fecha = hoyISO();
      await actualizarTrabajo(tr.id, { estado: 'pagado', fecha_pago: fecha });
      const con = contratistaPorId[tr.contratista_id];
      try {
        await crearMovimiento({
          corredor_id: corredorId,
          tipo: 'egreso',
          concepto: `Subcontratado: ${con?.nombre || 'contratista'} - ${tr.descripcion}`,
          monto: tr.costo,
          categoria: 'otros',
          fecha,
          notas: 'Trabajo de contratista',
        });
      } catch (mErr: any) {
        console.error('No se pudo registrar el egreso:', mErr);
      }
      await cargarTab('trabajos');
    } catch (err: any) {
      console.error(err);
      setError(getErrorMessage(err, 'Error al marcar como pagado.'));
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
    const pendientes = trabajos.filter((t) => t.estado === 'pendiente');
    const pagados = trabajos.filter((t) => t.estado === 'pagado');
    return [
      { label: 'Trabajos', valor: String(trabajos.length), Icon: HardHat, fondo: 'bg-[var(--blue-soft)]', iconColor: 'text-[var(--text)]' },
      { label: 'Pendientes', valor: String(pendientes.length), Icon: Clock, fondo: 'bg-[var(--amber-soft2)]', iconColor: 'text-[var(--amber-text2)]' },
      { label: 'Pendiente $', valor: dinero(pendientes.reduce((a, t) => a + t.costo, 0)), Icon: Wallet, fondo: 'bg-[var(--amber-soft)]', iconColor: 'text-[var(--amber-text3)]' },
      { label: 'Pagado $', valor: dinero(pagados.reduce((a, t) => a + t.costo, 0)), Icon: CheckCircle2, fondo: 'bg-[var(--primary-soft)]', iconColor: 'text-[var(--primary-deep)]' },
    ];
  }, [trabajos]);

  const kpis = tab === 'contratistas' ? kpisContratistas : kpisTrabajos;

  const tituloTab = tab === 'contratistas' ? 'Contratistas' : 'Trabajos';

  const descripcionTab =
    tab === 'contratistas'
      ? 'Personal subcontratado para tareas específicas.'
      : 'Tareas puntuales realizadas por contratistas y su pago.';

  const nombreContratista = (id: string) => contratistaPorId[id]?.nombre || '—';

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-[1440px] mx-auto w-full">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text)] tracking-tight">Subcontratados</h2>
          <p className="text-[var(--text2)] mt-1">{descripcionTab}</p>
        </div>
        <button
          onClick={() => abrirNuevo()}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-deep)] transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo {tab === 'contratistas' ? 'contratista' : 'trabajo'}
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
          <p>Cargando Subcontratados...</p>
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
                    </div>
                    <p className="text-[var(--text2)] text-sm hidden md:block">{t.fecha}</p>
                    <p className="text-[var(--text)] text-sm font-medium">{dinero(t.costo)}</p>
                    <span className={`justify-self-start text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded ${claseEstadoTrabajo(t.estado)}`}>
                      {etiquetaEstadoTrabajo(t.estado)}
                    </span>
                    <p className="text-[var(--text2)] text-sm hidden md:block">{t.fecha_pago || '—'}</p>
                    <div className="flex items-center justify-end gap-2">
                      {t.estado === 'pendiente' && (
                        <button
                          onClick={() => marcarTrabajoPagado(t)}
                          disabled={ocupadoId === t.id}
                          title="Marcar como pagado"
                          className="p-2 rounded-lg border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary-soft)] transition-colors disabled:opacity-60"
                        >
                          {ocupadoId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
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
        <div className="fixed inset-0 bg-[var(--overlay)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
        </div>
      )}

      {confirmarEliminar && (
        <div className="fixed inset-0 bg-[var(--overlay)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
        </div>
      )}
    </div>
  );
}
