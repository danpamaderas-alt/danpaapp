import { Modal } from './Modal';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { dinero, hoyISO, getErrorMessage, formatDate } from '../lib/format';
import {
  fetchRecibos,
  crearRecibo,
  actualizarRecibo,
  eliminarRecibo,
  siguienteNroRecibo,
  ESTADOS_RECIBO,
  etiquetaEstadoRecibo,
  claseEstadoRecibo,
  FORMAS_PAGO,
  type Recibo,
  type EstadoRecibo,
} from '../lib/recibos';
import { generarPDFRecibo } from '../lib/reciboPdf';
import {
  Search,
  Plus,
  X,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  Calendar,
  DollarSign,
  FileText,
  CreditCard,
} from 'lucide-react';

interface RecibosViewProps {
  corredorId: string;
}

interface FormState {
  nro_recibo: string;
  fecha: string;
  cliente_nombre: string;
  cliente_domicilio: string;
  cliente_cuit: string;
  concepto: string;
  monto: string;
  forma_pago: string;
  estado: EstadoRecibo;
  notas: string;
}

const emptyForm = (): FormState => ({
  nro_recibo: '',
  fecha: hoyISO(),
  cliente_nombre: '',
  cliente_domicilio: '',
  cliente_cuit: '',
  concepto: '',
  monto: '',
  forma_pago: '',
  estado: 'borrador',
  notas: '',
});

const LS_KEY = 'danpa_recibos_busqueda';

const inputCls =
  'w-full h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)] text-[var(--text)]';

const labelCls = 'text-xs font-semibold text-[var(--text2)] uppercase tracking-wider';

export default function RecibosView({ corredorId }: RecibosViewProps) {
  const [recibos, setRecibos] = useState<Recibo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState<string>(() => {
    try {
      return localStorage.getItem(LS_KEY) || '';
    } catch {
      return '';
    }
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Recibo | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, busqueda);
    } catch {
      //
    }
  }, [busqueda]);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchRecibos(corredorId);
      setRecibos(data);
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err, 'Error al cargar los recibos.'));
    } finally {
      setLoading(false);
    }
  }, [corredorId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const kpis = useMemo(() => {
    const emitidos = recibos.filter((r) => r.estado === 'emitido');
    const emitidosMes = emitidos.filter((r) => {
      const d = new Date(r.fecha);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const borradores = recibos.filter((r) => r.estado === 'borrador');

    const totalEmitidosCount = emitidos.length;
    const totalEmitidosMonto = emitidos.reduce((a, r) => a + (r.monto || 0), 0);
    const emitidosMesCount = emitidosMes.length;
    const emitidosMesMonto = emitidosMes.reduce((a, r) => a + (r.monto || 0), 0);
    const borradoresCount = borradores.length;

    return [
      {
        label: 'Total Emitidos',
        valor: `${totalEmitidosCount} · ${dinero(totalEmitidosMonto)}`,
        Icon: FileText,
        fondo: 'bg-[var(--primary-soft)]',
        iconColor: 'text-[var(--primary-deep)]',
      },
      {
        label: 'Emitidos Este Mes',
        valor: `${emitidosMesCount} · ${dinero(emitidosMesMonto)}`,
        Icon: Calendar,
        fondo: 'bg-[var(--gray-soft)]',
        iconColor: 'text-[var(--text2)]',
      },
      {
        label: 'Borradores',
        valor: String(borradoresCount),
        Icon: CreditCard,
        fondo: 'bg-[var(--amber-soft)]',
        iconColor: 'text-[var(--amber-text)]',
      },
    ];
  }, [recibos]);

  const filtrados = useMemo(() => {
    if (!busqueda.trim()) return recibos;
    const q = busqueda.toLowerCase().trim();
    return recibos.filter(
      (r) =>
        r.nro_recibo?.toLowerCase().includes(q) ||
        r.cliente_nombre.toLowerCase().includes(q) ||
        r.concepto.toLowerCase().includes(q) ||
        r.cliente_cuit?.toLowerCase().includes(q),
    );
  }, [recibos, busqueda]);

  const truncar = useCallback((s: string, max = 40) => {
    if (s.length <= max) return s;
    return s.slice(0, max) + '…';
  }, []);

  const abrirNuevo = () => {
    const nro = siguienteNroRecibo(recibos);
    setEditando(null);
    const f = emptyForm();
    f.nro_recibo = nro;
    setForm(f);
    setModalOpen(true);
  };

  const abrirEditar = (r: Recibo) => {
    setEditando(r);
    setForm({
      nro_recibo: r.nro_recibo || '',
      fecha: r.fecha,
      cliente_nombre: r.cliente_nombre,
      cliente_domicilio: r.cliente_domicilio || '',
      cliente_cuit: r.cliente_cuit || '',
      concepto: r.concepto,
      monto: String(r.monto ?? ''),
      forma_pago: r.forma_pago || '',
      estado: r.estado,
      notas: r.notas || '',
    });
    setModalOpen(true);
  };

  const guardar = async () => {
    if (!form.cliente_nombre.trim()) {
      alert('Escribí el nombre del cliente.');
      return;
    }
    if (!form.concepto.trim()) {
      alert('Escribí el concepto del recibo.');
      return;
    }
    if (!form.fecha) {
      alert('Elegí la fecha del recibo.');
      return;
    }
    const monto = Math.max(0, Number(form.monto) || 0);

    setSaving(true);
    setError(null);
    try {
      const payload = {
        nro_recibo: form.nro_recibo.trim() || undefined,
        fecha: form.fecha,
        cliente_nombre: form.cliente_nombre.trim(),
        cliente_domicilio: form.cliente_domicilio.trim() || undefined,
        cliente_cuit: form.cliente_cuit.trim() || undefined,
        concepto: form.concepto.trim(),
        monto,
        forma_pago: form.forma_pago || undefined,
        estado: form.estado,
        notas: form.notas.trim() || undefined,
      };

      if (editando) {
        await actualizarRecibo(editando.id, payload);
      } else {
        await crearRecibo({ corredor_id: corredorId, ...payload });
      }

      setModalOpen(false);
      await cargar();
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err, 'Error al guardar el recibo.'));
    } finally {
      setSaving(false);
    }
  };

  const borrar = async (r: Recibo) => {
    const ok = window.confirm(
      `¿Eliminar el recibo ${r.nro_recibo || 'sin número'} de ${r.cliente_nombre}? Esta acción no se puede deshacer.`,
    );
    if (!ok) return;
    setError(null);
    try {
      await eliminarRecibo(r.id);
      await cargar();
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err, 'Error al eliminar el recibo.'));
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-[1440px] mx-auto w-full">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text)] tracking-tight">Recibos</h2>
          <p className="text-[var(--text2)] mt-1">
            Gestioná los recibos de tus clientes: madera, podas y servicios.
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-deep)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Recibo
        </button>
      </div>

      {error && (
        <div className="bg-[var(--danger-soft)] text-[var(--danger-deep)] p-4 rounded-xl flex items-start gap-4 mb-8">
          <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text2)]">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-[var(--primary)]" />
          <p>Cargando recibos...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {kpis.map((k, i) => (
              <div key={i} className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)]">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-[var(--text2)]">{k.label}</p>
                  <div className={`p-2 rounded-lg ${k.fondo}`}>
                    <k.Icon className={`w-5 h-5 ${k.iconColor}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[var(--text)]">{k.valor}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text2)]" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por cliente, concepto, CUIT o nro…"
                className="w-full h-11 pl-10 pr-10 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)] text-[var(--text)]"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text2)] hover:text-[var(--text)]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="hidden lg:grid gap-4 px-6 py-3 bg-[var(--field)] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wider text-[var(--text2)] grid-cols-[80px_100px_1fr_1fr_110px_110px_100px_130px]">
              <span>Nro</span>
              <span>Fecha</span>
              <span>Cliente</span>
              <span>Concepto</span>
              <span>Monto</span>
              <span>Forma Pago</span>
              <span>Estado</span>
              <span className="text-right">Acciones</span>
            </div>

            <div className="divide-y divide-[var(--border)]/60">
              {filtrados.map((r) => (
                <div key={r.id} className="px-6 py-4">
                  <div className="hidden lg:grid gap-4 items-center grid-cols-[80px_100px_1fr_1fr_110px_110px_100px_130px]">
                    <span className="text-sm font-medium text-[var(--text)]">
                      {r.nro_recibo || '—'}
                    </span>
                    <span className="text-sm text-[var(--text2)] whitespace-nowrap">
                      {formatDate(r.fecha)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--text)] truncate">{r.cliente_nombre}</p>
                      {r.cliente_cuit && (
                        <p className="text-xs text-[var(--text2)]">CUIT: {r.cliente_cuit}</p>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text2)] truncate" title={r.concepto}>
                      {truncar(r.concepto)}
                    </p>
                    <span className="text-sm font-semibold text-[var(--text)] whitespace-nowrap">
                      {dinero(r.monto)}
                    </span>
                    <span className="text-sm text-[var(--text2)]">
                      {r.forma_pago || '—'}
                    </span>
                    <span
                      className={`inline-block text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded text-center ${claseEstadoRecibo(r.estado)}`}
                    >
                      {etiquetaEstadoRecibo(r.estado)}
                    </span>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => abrirEditar(r)}
                        title="Editar"
                        className="p-2 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--field)] transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => borrar(r)}
                        title="Eliminar"
                        className="p-2 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:text-[var(--danger-deep)] hover:bg-[var(--danger-soft)] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => generarPDFRecibo(r)}
                        title="Exportar PDF"
                        className="p-2 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--field)] transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="lg:hidden space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {r.nro_recibo && (
                            <span className="text-xs font-semibold text-[var(--text2)]">
                              {r.nro_recibo}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${claseEstadoRecibo(r.estado)}`}
                          >
                            {etiquetaEstadoRecibo(r.estado)}
                          </span>
                        </div>
                        <p className="font-semibold text-[var(--text)] truncate">{r.cliente_nombre}</p>
                        {r.cliente_cuit && (
                          <p className="text-xs text-[var(--text2)]">CUIT: {r.cliente_cuit}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => abrirEditar(r)}
                          title="Editar"
                          className="p-2 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--field)] transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => borrar(r)}
                          title="Eliminar"
                          className="p-2 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:text-[var(--danger-deep)] hover:bg-[var(--danger-soft)] transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => generarPDFRecibo(r)}
                          title="Exportar PDF"
                          className="p-2 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--field)] transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-[var(--text2)] truncate" title={r.concepto}>
                      {truncar(r.concepto)}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text2)]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(r.fecha)}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-[var(--text)]">
                        <DollarSign className="w-3.5 h-3.5" />
                        {dinero(r.monto)}
                      </span>
                      {r.forma_pago && (
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5" />
                          {r.forma_pago}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filtrados.length === 0 && (
              <div className="p-12 text-center text-[var(--text2)]">
                <FileText className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
                <p className="font-medium">
                  {recibos.length === 0
                    ? 'No hay recibos registrados. Creá el primero con el botón superior.'
                    : 'No se encontraron recibos con ese criterio de búsqueda.'}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {modalOpen && (
        <Modal
          title={editando ? 'Editar Recibo' : 'Nuevo Recibo'}
          onClose={() => setModalOpen(false)}
        >
          <div className="bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--field)]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--primary-soft)] rounded-lg">
                  <FileText className="w-5 h-5 text-[var(--primary-deep)]" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text)]">
                  {editando ? 'Editar Recibo' : 'Nuevo Recibo'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--hover)] p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1">
                <label className={labelCls}>Nro Recibo</label>
                <input
                  type="text"
                  value={form.nro_recibo}
                  onChange={(e) => setForm({ ...form, nro_recibo: e.target.value })}
                  placeholder="Ej: R-0001"
                  className={inputCls}
                />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Fecha *</label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Cliente Nombre *</label>
                <input
                  type="text"
                  value={form.cliente_nombre}
                  onChange={(e) => setForm({ ...form, cliente_nombre: e.target.value })}
                  placeholder="Nombre del cliente"
                  className={inputCls}
                />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Cliente Domicilio</label>
                <input
                  type="text"
                  value={form.cliente_domicilio}
                  onChange={(e) => setForm({ ...form, cliente_domicilio: e.target.value })}
                  placeholder="Dirección del cliente"
                  className={inputCls}
                />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Cliente CUIT</label>
                <input
                  type="text"
                  value={form.cliente_cuit}
                  onChange={(e) => setForm({ ...form, cliente_cuit: e.target.value })}
                  placeholder="20-12345678-9"
                  className={inputCls}
                />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Concepto *</label>
                <textarea
                  value={form.concepto}
                  onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                  rows={3}
                  placeholder="Descripción de bienes o servicios..."
                  className={`${inputCls} h-auto py-3`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Monto (ARS) *</label>
                  <input
                    type="number"
                    min={0}
                    value={form.monto}
                    onChange={(e) => setForm({ ...form, monto: e.target.value })}
                    placeholder="0"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Forma de Pago</label>
                  <select
                    value={form.forma_pago}
                    onChange={(e) => setForm({ ...form, forma_pago: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">— Sin especificar —</option>
                    {FORMAS_PAGO.map((fp) => (
                      <option key={fp} value={fp}>
                        {fp}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Estado</label>
                <select
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value as EstadoRecibo })}
                  className={inputCls}
                >
                  {ESTADOS_RECIBO.map((e) => (
                    <option key={e} value={e}>
                      {etiquetaEstadoRecibo(e)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Notas</label>
                <textarea
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  rows={2}
                  placeholder="Observaciones..."
                  className={`${inputCls} h-auto py-3`}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 text-[var(--text2)] font-medium hover:bg-[var(--field)] rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardar}
                  disabled={saving}
                  className="px-5 py-2.5 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-deep)] transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editando ? 'Guardar Cambios' : 'Crear Recibo'}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
