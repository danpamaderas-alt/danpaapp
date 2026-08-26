import { Modal } from './Modal';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { dinero, hoyISO, getErrorMessage } from '../lib/format';
import {
  fetchContratos,
  crearContrato,
  actualizarContrato,
  eliminarContrato,
  ESTADOS_CONTRATO,
  etiquetaEstadoContrato,
  claseEstadoContrato,
  LIMITE_CONTRATOS,
  type Contrato,
  type EstadoContrato,
  type TipoContrato,
} from '../lib/contratos';
import { generarPDFContrato } from '../lib/contratoPdf';
import { fetchTrabajos, type TrabajoContratista } from '../lib/contratistas';
import {
  FileText,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  ScrollText,
  User,
  UsersRound,
  Wallet,
  CheckCircle2,
  Clock,
} from 'lucide-react';

type Tab = 'cliente' | 'subcontratista';

const TAB_OPTIONS: { id: Tab; label: string; icon: typeof ScrollText }[] = [
  { id: 'cliente', label: 'Cliente', icon: User },
  { id: 'subcontratista', label: 'Subcontratistas', icon: UsersRound },
];

interface ContratoForm {
  tipo: TipoContrato;
  nro_contrato: string;
  titulo: string;
  contraparte: string;
  descripcion: string;
  lugar: string;
  fecha: string;
  fecha_fin: string;
  monto: string;
  forma_pago: string;
  estado: EstadoContrato;
  notas: string;
}

const emptyContratoForm = (tipo: TipoContrato): ContratoForm => ({
  tipo,
  nro_contrato: '',
  titulo: '',
  contraparte: '',
  descripcion: '',
  lugar: '',
  fecha: hoyISO(),
  fecha_fin: '',
  monto: '',
  forma_pago: '',
  estado: 'activo',
  notas: '',
});

export default function ContratosView({ corredorId }: { corredorId: string }) {
  const [tab, setTab] = useState<Tab>(() => {
    try {
      const guardada = localStorage.getItem('danpa_contratos_tab');
      if (guardada === 'cliente' || guardada === 'subcontratista') return guardada;
    } catch {
      // ignore
    }
    return 'cliente';
  });

  useEffect(() => {
    try {
      localStorage.setItem('danpa_contratos_tab', tab);
    } catch {
      // ignore
    }
  }, [tab]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [trabajos, setTrabajos] = useState<TrabajoContratista[]>([]);

  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState<{ id: string; titulo: string } | null>(null);
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);

  const [form, setForm] = useState<ContratoForm>(emptyContratoForm('cliente'));

  const cargarTodo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [ctros, trabs] = await Promise.all([
        fetchContratos(corredorId),
        fetchTrabajos(corredorId),
      ]);
      setContratos(ctros);
      setTrabajos(trabs);
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err, 'Error al cargar Contratos.'));
    } finally {
      setLoading(false);
    }
  }, [corredorId]);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  const abrirNuevo = () => {
    setEditando(null);
    setForm(emptyContratoForm(tab === 'subcontratista' ? 'subcontratista' : 'cliente'));
    setModal(true);
  };

  const abrirEditar = (c: Contrato) => {
    setEditando(c.id);
    setForm({
      tipo: c.tipo,
      nro_contrato: c.nro_contrato || '',
      titulo: c.titulo,
      contraparte: c.contraparte || '',
      descripcion: c.descripcion || '',
      lugar: c.lugar || '',
      fecha: c.fecha,
      fecha_fin: c.fecha_fin || '',
      monto: String(c.monto ?? ''),
      forma_pago: c.forma_pago || '',
      estado: c.estado,
      notas: c.notas || '',
    });
    setModal(true);
  };

  const guardar = async () => {
    if (!form.titulo.trim()) {
      alert('Escribí el título del contrato.');
      return;
    }
    if (!form.fecha) {
      alert('Elegí la fecha del contrato.');
      return;
    }
    const monto = Math.max(0, Number(form.monto) || 0);
    if (!editando && monto <= 0) {
      alert('El monto debe ser mayor a 0.');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const payload = {
        tipo: form.tipo,
        nro_contrato: form.nro_contrato.trim() || undefined,
        titulo: form.titulo.trim(),
        contraparte: form.contraparte.trim() || undefined,
        descripcion: form.descripcion.trim() || undefined,
        lugar: form.lugar.trim() || undefined,
        fecha: form.fecha,
        fecha_fin: form.fecha_fin || undefined,
        monto,
        forma_pago: form.forma_pago.trim() || undefined,
        estado: form.estado,
        notas: form.notas.trim() || undefined,
      };

      if (editando) {
        await actualizarContrato(editando, payload);
      } else {
        await crearContrato({ corredor_id: corredorId, ...payload });
      }

      setModal(false);
      await cargarTodo();
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err, 'Error al guardar el contrato.'));
    } finally {
      setGuardando(false);
    }
  };

  const confirmarBorrado = async () => {
    if (!confirmarEliminar) return;
    setOcupadoId(confirmarEliminar.id);
    setError(null);
    try {
      await eliminarContrato(confirmarEliminar.id);
      setConfirmarEliminar(null);
      await cargarTodo();
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err, 'Error al eliminar el contrato.'));
    } finally {
      setOcupadoId(null);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Derivados                                                         */
  /* ------------------------------------------------------------------ */

  const filtrados = useMemo(
    () => contratos.filter((c) => c.tipo === tab),
    [contratos, tab],
  );

  const trabajosPorNroContrato = useMemo(() => {
    const mapa: Record<string, TrabajoContratista[]> = {};
    for (const t of trabajos) {
      const clave = t.nro_contrato?.trim();
      if (!clave) continue;
      if (!mapa[clave]) mapa[clave] = [];
      mapa[clave].push(t);
    }
    return mapa;
  }, [trabajos]);

  const kpis = useMemo(() => {
    const total = filtrados.length;
    const montoTotal = filtrados.reduce((a, c) => a + (c.monto || 0), 0);
    const activos = filtrados.filter((c) => c.estado === 'activo').length;
    const finalizados = filtrados.filter((c) => c.estado === 'finalizado').length;
    return [
      { label: 'Total contratos', valor: String(total), Icon: ScrollText, fondo: 'bg-[var(--blue-soft)]', iconColor: 'text-[var(--text)]' },
      { label: 'Monto total', valor: dinero(montoTotal), Icon: Wallet, fondo: 'bg-[var(--amber-soft2)]', iconColor: 'text-[var(--amber-text2)]' },
      { label: 'Activos', valor: String(activos), Icon: CheckCircle2, fondo: 'bg-[var(--primary-soft)]', iconColor: 'text-[var(--primary-deep)]' },
      { label: 'Finalizados', valor: String(finalizados), Icon: Clock, fondo: 'bg-[var(--gray-soft)]', iconColor: 'text-[var(--text2)]' },
    ];
  }, [filtrados]);

  const datosTruncados = contratos.length >= LIMITE_CONTRATOS;

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-[1440px] mx-auto w-full">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text)] tracking-tight">Contratos</h2>
          <p className="text-[var(--text2)] mt-1">
            {tab === 'cliente' ? 'Contratos con clientes para servicios de poda y madera.' : 'Contratos con subcontratistas para tareas externas.'}
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-deep)] transition-colors"
        >
          <FileText className="w-4 h-4" />
          Nuevo contrato
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {TAB_OPTIONS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text2)] hover:bg-[var(--blue-header)]'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-[var(--danger-soft)] text-[var(--danger-deep)] p-4 rounded-xl flex items-start gap-4 mb-8">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Límite */}
      {datosTruncados && !loading && (
        <div className="bg-[var(--amber-soft)] text-[var(--amber-text3)] p-4 rounded-xl flex items-start gap-4 mb-8">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <p className="text-sm">
            Hay muchos contratos: se muestran los más recientes (hasta {LIMITE_CONTRATOS.toLocaleString('es-AR')}). Algunos podrían no aparecer.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text2)]">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-[var(--primary)]" />
          <p>Cargando contratos...</p>
        </div>
      ) : (
        <>
          {/* KPIs */}
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

          {/* Lista */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="hidden md:grid gap-4 px-6 py-3 bg-[var(--blue-header)] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wider text-[var(--text2)] grid-cols-[1fr_1fr_140px_120px_170px]">
              <span>Título</span>
              <span>Contraparte</span>
              <span>Fecha</span>
              <span>Monto</span>
              <span className="text-right">Acciones</span>
            </div>

            <div className="divide-y divide-[var(--border)]/60">
              {filtrados.map((c) => {
                const costos = tab === 'cliente' && c.nro_contrato
                  ? (trabajosPorNroContrato[c.nro_contrato.trim()] || [])
                  : [];
                const totalCostos = costos.reduce((a, t) => a + (t.costo || 0), 0);
                const margen = c.monto - totalCostos;
                const tieneCostos = costos.length > 0 && tab === 'cliente';

                return (
                  <div key={c.id} className="px-6 py-4">
                    <div className="grid md:grid-cols-[1fr_1fr_140px_120px_170px] gap-2 md:gap-4 items-center">
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--text)] truncate">{c.titulo}</p>
                        {c.nro_contrato && (
                          <p className="text-xs text-[var(--text2)]">N° {c.nro_contrato}</p>
                        )}
                        {c.lugar && (
                          <p className="text-xs text-[var(--text2)] truncate">{c.lugar}</p>
                        )}
                      </div>
                      <p className="text-[var(--text2)] text-sm hidden md:block truncate">{c.contraparte || '—'}</p>
                      <div className="hidden md:block text-sm text-[var(--text2)]">
                        <p>{c.fecha}</p>
                        {c.fecha_fin && <p className="text-xs">→ {c.fecha_fin}</p>}
                      </div>
                      <p className="text-[var(--text)] text-sm hidden md:block font-medium">{dinero(c.monto)}</p>
                      <div className="flex items-center justify-end gap-2">
                        <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded ${claseEstadoContrato(c.estado)}`}>
                          {etiquetaEstadoContrato(c.estado)}
                        </span>
                        <button
                          onClick={() => abrirEditar(c)}
                          title="Editar"
                          className="p-2 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--blue-header)] transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmarEliminar({ id: c.id, titulo: c.titulo })}
                          title="Eliminar"
                          className="p-2 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:text-[var(--danger-deep)] hover:bg-[var(--danger-soft)] transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => generarPDFContrato(c)}
                          title="Exportar PDF"
                          className="p-2 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--blue-header)] transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Info extra mobile */}
                    <div className="mt-2 md:hidden flex flex-wrap gap-3 text-xs text-[var(--text2)]">
                      {c.contraparte && <span>{c.contraparte}</span>}
                      <span>{c.fecha}{c.fecha_fin ? ` → ${c.fecha_fin}` : ''}</span>
                      <span className="font-medium text-[var(--text)]">{dinero(c.monto)}</span>
                    </div>

                    {/* Costos y margen (solo cliente con nro_contrato) */}
                    {tieneCostos && (
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                        <span className="text-[var(--text2)]">
                          Costos asociados: {dinero(totalCostos)} ({costos.length} {costos.length === 1 ? 'trabajo' : 'trabajos'})
                        </span>
                        <span className={`font-semibold ${margen >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          Margen estimado: {dinero(margen)}
                        </span>
                      </div>
                    )}

                    {c.notas && (
                      <p className="mt-1 text-xs text-[var(--text2)] truncate max-w-prose">{c.notas}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {filtrados.length === 0 && (
              <div className="p-12 text-center text-[var(--text2)]">
                <ScrollText className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
                <p>No hay contratos {tab === 'cliente' ? 'de clientes' : 'de subcontratistas'} registrados. Agregá el primero con el botón superior.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal formulario */}
      {modal && (
        <Modal title={`${editando ? 'Editar' : 'Nuevo'} contrato`} onClose={() => setModal(false)}>
          <div className="bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--field)]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--primary-soft)] rounded-lg">
                  <ScrollText className="w-5 h-5 text-[var(--primary-deep)]" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text)]">
                  {editando ? 'Editar' : 'Nuevo'} contrato
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
              {/* Tipo */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Tipo de contrato</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoContrato })}
                  disabled={!!editando}
                  className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)] disabled:opacity-60"
                >
                  <option value="cliente">Cliente</option>
                  <option value="subcontratista">Subcontratista</option>
                </select>
              </div>

              {/* N° contrato */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">N° de contrato</label>
                <input
                  type="text"
                  value={form.nro_contrato}
                  onChange={(e) => setForm({ ...form, nro_contrato: e.target.value })}
                  placeholder="Ej: CT-2026-001"
                  className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                />
              </div>

              {/* Título */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Título *</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ej: Poda integral parque industrial"
                  className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                />
              </div>

              {/* Contraparte */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Contraparte</label>
                <input
                  type="text"
                  value={form.contraparte}
                  onChange={(e) => setForm({ ...form, contraparte: e.target.value })}
                  placeholder={tab === 'cliente' ? 'Nombre del cliente' : 'Nombre del subcontratista'}
                  className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                />
              </div>

              {/* Descripción */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  rows={2}
                  placeholder="Descripción detallada del contrato..."
                  className="w-full p-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                />
              </div>

              {/* Lugar */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Lugar</label>
                <input
                  type="text"
                  value={form.lugar}
                  onChange={(e) => setForm({ ...form, lugar: e.target.value })}
                  placeholder="Domicilio / zona de trabajo"
                  className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                />
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Fecha *</label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Fecha fin</label>
                  <input
                    type="date"
                    value={form.fecha_fin}
                    onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                    className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  />
                </div>
              </div>

              {/* Monto y forma de pago */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Monto *</label>
                  <input
                    type="number"
                    min={0}
                    value={form.monto}
                    onChange={(e) => setForm({ ...form, monto: e.target.value })}
                    placeholder="0"
                    className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Forma de pago</label>
                  <input
                    type="text"
                    value={form.forma_pago}
                    onChange={(e) => setForm({ ...form, forma_pago: e.target.value })}
                    placeholder="Ej: Transferencia, Efectivo"
                    className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  />
                </div>
              </div>

              {/* Estado */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Estado</label>
                <select
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value as EstadoContrato })}
                  className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                >
                  {ESTADOS_CONTRATO.map((e) => (
                    <option key={e} value={e}>
                      {etiquetaEstadoContrato(e)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notas */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Notas</label>
                <textarea
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  rows={2}
                  placeholder="Observaciones..."
                  className="w-full p-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                />
              </div>

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

      {/* Confirmar eliminación */}
      {confirmarEliminar && (
        <Modal title="¿Eliminar contrato?" onClose={() => setConfirmarEliminar(null)}>
          <div className="bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="p-3 bg-[var(--danger-soft)] rounded-xl w-fit mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-[var(--danger-deep)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text)] mb-2">¿Eliminar contrato?</h3>
            <p className="text-sm text-[var(--text2)] mb-6">
              Vas a eliminar <strong className="text-[var(--text)]">{confirmarEliminar.titulo}</strong>. Esta acción no se puede deshacer.
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
