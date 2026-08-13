import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchMovimientos,
  crearMovimiento,
  actualizarMovimiento,
  eliminarMovimiento,
  calcularSaldo,
  desglosePorCategoria,
  CATEGORIAS,
  OPCIONES_PAGADOR,
  OPCIONES_CUENTA,
  fetchOpciones,
  agregarOpcion,
  eliminarOpcion,
  type Movimiento,
  type MovimientoInput,
} from '../lib/finanzas';
import { dinero, formatDate, hoyISO, getErrorMessage } from '../lib/format';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  ArrowDownCircle,
  ArrowUpCircle,
  FileText,
  ListPlus,
  Check,
} from 'lucide-react';

interface FinanzasViewProps {
  corredorId: string;
}

interface FormState {
  id?: string;
  tipo: 'ingreso' | 'egreso';
  concepto: string;
  monto: string;
  categoria: string;
  fecha: string;
  notas: string;
  pagador: string;
  cuenta: string;
  tiene_factura: boolean;
  nro_factura: string;
}

const emptyForm = (): FormState => ({
  tipo: 'egreso',
  concepto: '',
  monto: '',
  categoria: 'general',
  fecha: hoyISO(),
  notas: '',
  pagador: '',
  cuenta: '',
  tiene_factura: false,
  nro_factura: '',
});

const etiquetaCategoria = (c: string) =>
  c.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

export default function FinanzasView({ corredorId }: FinanzasViewProps) {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [tipo, setTipo] = useState('');
  const [categoria, setCategoria] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [guardando, setGuardando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState<Movimiento | null>(null);
  const [opcionesDb, setOpcionesDb] = useState<{ pagadores: string[]; cuentas: string[] }>({
    pagadores: [],
    cuentas: [],
  });
  const [adminOpcionesOpen, setAdminOpcionesOpen] = useState(false);
  const [nuevoPagador, setNuevoPagador] = useState('');
  const [nuevaCuenta, setNuevaCuenta] = useState('');

  const recargarOpciones = useCallback(async () => {
    try {
      setOpcionesDb(await fetchOpciones(corredorId));
    } catch (err) {
      console.error(err);
    }
  }, [corredorId]);

  useEffect(() => {
    recargarOpciones();
  }, [recargarOpciones]);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMovimientos({ corredorId, desde: desde || undefined, hasta: hasta || undefined, tipo: tipo || undefined, categoria: categoria || undefined });
      setMovimientos(data);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, 'Error al cargar los movimientos.'));
    } finally {
      setLoading(false);
    }
  }, [corredorId, desde, hasta, tipo, categoria]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const saldo = useMemo(() => calcularSaldo(movimientos), [movimientos]);
  const ingresos = useMemo(
    () => movimientos.filter((m) => m.tipo === 'ingreso').reduce((a, m) => a + m.monto, 0),
    [movimientos]
  );
  const egresos = useMemo(
    () => movimientos.filter((m) => m.tipo === 'egreso').reduce((a, m) => a + m.monto, 0),
    [movimientos]
  );
  const desglose = useMemo(() => desglosePorCategoria(movimientos), [movimientos]);
  const maxDesglose = Math.max(1, ...desglose.map((d) => d.egreso));

  const opcionesPagador = useMemo(() => {
    const set = new Set<string>(OPCIONES_PAGADOR);
    opcionesDb.pagadores.forEach((p) => set.add(p));
    movimientos.forEach((m) => {
      if (m.pagador) set.add(m.pagador);
    });
    return Array.from(set);
  }, [movimientos, opcionesDb]);

  const opcionesCuenta = useMemo(() => {
    const set = new Set<string>(OPCIONES_CUENTA);
    opcionesDb.cuentas.forEach((c) => set.add(c));
    movimientos.forEach((m) => {
      if (m.cuenta) set.add(m.cuenta);
    });
    return Array.from(set);
  }, [movimientos, opcionesDb]);

  const abrirNuevo = () => {
    setForm(emptyForm());
    setModalOpen(true);
  };

  const abrirEdicion = (m: Movimiento) => {
    setForm({
      id: m.id,
      tipo: (m.tipo === 'ingreso' ? 'ingreso' : 'egreso') as 'ingreso' | 'egreso',
      concepto: m.concepto,
      monto: String(m.monto),
      categoria: m.categoria,
      fecha: m.fecha.slice(0, 10),
      notas: m.notas || '',
      pagador: m.pagador || '',
      cuenta: m.cuenta || '',
      tiene_factura: m.tiene_factura || false,
      nro_factura: m.nro_factura || '',
    });
    setModalOpen(true);
  };

  const guardar = async () => {
    const monto = Number(form.monto);
    if (!form.concepto.trim()) {
      alert('Escribí un concepto.');
      return;
    }
    if (!Number.isFinite(monto) || monto <= 0) {
      alert('El monto debe ser mayor a 0.');
      return;
    }
    if (!form.fecha) {
      alert('Elegí una fecha.');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const input: MovimientoInput = {
        corredor_id: corredorId,
        tipo: form.tipo,
        concepto: form.concepto.trim(),
        monto,
        categoria: form.categoria,
        fecha: form.fecha,
        notas: form.notas.trim() || undefined,
        creado_por: corredorId,
        pagador: form.pagador.trim() || undefined,
        cuenta: form.cuenta.trim() || undefined,
        tiene_factura: form.tiene_factura,
        nro_factura: form.nro_factura.trim() || undefined,
      };
      if (form.id) {
        await actualizarMovimiento(form.id, input);
      } else {
        await crearMovimiento(input);
      }
      try {
        if (form.pagador && !opcionesPagador.includes(form.pagador)) {
          await agregarOpcion(corredorId, 'pagador', form.pagador);
        }
        if (form.cuenta && !opcionesCuenta.includes(form.cuenta)) {
          await agregarOpcion(corredorId, 'cuenta', form.cuenta);
        }
      } catch (err) {
        console.error('No se pudo guardar la opción:', err);
      }
      await recargarOpciones();
      setModalOpen(false);
      await cargar();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  };

  const confirmarBorrado = async () => {
    if (!confirmarEliminar) return;
    setGuardando(true);
    try {
      await eliminarMovimiento(confirmarEliminar.id);
      setConfirmarEliminar(null);
      await cargar();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  };

  const hayFiltros = Boolean(desde || hasta || tipo || categoria);

  const agregarOpcionDesdeAdmin = async (tipo: 'pagador' | 'cuenta', valor: string) => {
    if (!valor.trim()) return;
    try {
      await agregarOpcion(corredorId, tipo, valor);
      if (tipo === 'pagador') setNuevoPagador('');
      else setNuevaCuenta('');
      await recargarOpciones();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const quitarOpcion = async (tipo: 'pagador' | 'cuenta', valor: string) => {
    try {
      await eliminarOpcion(corredorId, tipo, valor);
      await recargarOpciones();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const kpi = [
    {
      label: 'Saldo',
      valor: dinero(saldo),
      clase: saldo >= 0 ? 'text-[var(--primary)]' : 'text-[var(--danger)]',
      Icon: Wallet,
      fondo: 'bg-[var(--blue-soft)]',
      iconColor: 'text-[var(--text)]',
    },
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
      label: 'Movimientos',
      valor: String(movimientos.length),
      clase: 'text-[var(--text)]',
      Icon: Search,
      fondo: 'bg-[var(--gray-soft)]',
      iconColor: 'text-[var(--text)]',
    },
  ];

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-[1440px] mx-auto w-full">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text)] tracking-tight">Finanzas</h2>
          <p className="text-[var(--text2)] mt-1">Control de ingresos, egresos y gastos del corredor.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAdminOpcionesOpen(true)}
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--blue-header)] flex items-center justify-center gap-2"
          >
            <ListPlus className="w-5 h-5" />
            Opciones
          </button>
          <button
            onClick={abrirNuevo}
            className="bg-[var(--primary)] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--primary-deep)] transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Nuevo Movimiento
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-[var(--danger-soft)] text-[var(--danger-deep)] p-4 rounded-xl flex items-start gap-4 mb-8">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading && movimientos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-[var(--text2)]">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-[var(--primary)]" />
          <p>Cargando finanzas...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {kpi.map((k) => (
              <div key={k.label} className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)]">
                <div className={`p-2 rounded-lg w-fit mb-4 ${k.fondo}`}>
                  <k.Icon className={`w-5 h-5 ${k.iconColor}`} />
                </div>
                <h3 className="text-[var(--text2)] text-xs font-semibold uppercase tracking-wider mb-1">{k.label}</h3>
                <div className={`text-3xl font-bold ${k.clase}`}>{k.valor}</div>
              </div>
            ))}
          </div>

          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 mb-8">
            <div className="flex items-center gap-2 mb-4 text-[var(--text)]">
              <Search className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Filtros</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Desde</label>
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)] mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Hasta</label>
                <input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)] mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Tipo</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)] mt-1"
                >
                  <option value="">Todos</option>
                  <option value="ingreso">Ingresos</option>
                  <option value="egreso">Egresos</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Categoría</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)] mt-1"
                >
                  <option value="">Todas</option>
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {etiquetaCategoria(c)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {hayFiltros && (
              <button
                onClick={() => {
                  setDesde('');
                  setHasta('');
                  setTipo('');
                  setCategoria('');
                }}
                className="mt-4 text-sm text-[var(--primary)] font-medium hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-1 bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
              <h3 className="text-lg font-semibold text-[var(--text)] mb-5">Desglose por Categoría</h3>
              {desglose.length === 0 ? (
                <p className="text-sm text-[var(--text2)]">Sin movimientos para este filtro.</p>
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

            <div className="lg:col-span-2 bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
              <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center">
                <h3 className="text-lg font-semibold text-[var(--text)]">Historial</h3>
                <span className="text-sm text-[var(--text2)]">{movimientos.length} movimientos</span>
              </div>
              <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                <table className="w-full text-left border-collapse min-w-[680px]">
                  <thead className="sticky top-0 bg-[var(--blue-header)]">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Fecha</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Concepto</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)]">Categoría</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)] text-right">Monto</th>
                      <th className="px-6 py-3 text-xs font-semibold text-[var(--text2)] uppercase tracking-wider border-b border-[var(--border)] text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {movimientos.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-[var(--text2)]">
                          <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="font-medium">No hay movimientos</p>
                          <p className="text-sm mt-1">Agregá ingresos y egresos para llevar el control.</p>
                        </td>
                      </tr>
                    ) : (
                      movimientos.map((m) => {
                        const esIngreso = m.tipo === 'ingreso';
                        return (
                          <tr key={m.id} className="hover:bg-[var(--field)] transition-colors">
                            <td className="px-6 py-3.5 text-[var(--text2)] text-sm whitespace-nowrap">{formatDate(m.fecha)}</td>
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-2">
                                {esIngreso ? (
                                  <ArrowUpCircle className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
                                ) : (
                                  <ArrowDownCircle className="w-4 h-4 text-[var(--danger)] flex-shrink-0" />
                                )}
                                <div>
                                  <p className="font-medium text-[var(--text)]">{m.concepto}</p>
                                  {m.notas && <p className="text-xs text-[var(--text2)] line-clamp-1">{m.notas}</p>}
                                  {(m.pagador || m.cuenta) && (
                                    <p className="text-xs text-[var(--text2)] mt-0.5">
                                      {m.pagador && <>por {m.pagador}</>}
                                      {m.pagador && m.cuenta && ' · '}
                                      {m.cuenta && m.cuenta}
                                    </p>
                                  )}
                                  {m.tiene_factura && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--danger-soft)] text-[var(--danger-deep)] mt-1">
                                      <FileText className="w-3 h-3" />
                                      Con factura{m.nro_factura ? ` · ${m.nro_factura}` : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-3.5">
                              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--blue-header)] text-[var(--text2)]">
                                {etiquetaCategoria(m.categoria)}
                              </span>
                            </td>
                            <td className={`px-6 py-3.5 text-right font-bold whitespace-nowrap ${esIngreso ? 'text-[var(--primary)]' : 'text-[var(--danger)]'}`}>
                              {esIngreso ? '+' : '-'}{dinero(m.monto)}
                            </td>
                            <td className="px-6 py-3.5 text-right whitespace-nowrap">
                              <button
                                onClick={() => abrirEdicion(m)}
                                className="p-2 text-[var(--text2)] hover:text-[var(--primary)] hover:bg-[var(--primary-soft)] rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setConfirmarEliminar(m)}
                                className="p-2 text-[var(--text2)] hover:text-[var(--danger-deep)] hover:bg-[var(--danger-soft)] rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-[var(--overlay)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--field)]">
              <h3 className="text-xl font-bold text-[var(--text)]">{form.id ? 'Editar Movimiento' : 'Nuevo Movimiento'}</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--hover)] p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, tipo: 'ingreso' })}
                  className={`h-11 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    form.tipo === 'ingreso'
                      ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary-deep)]'
                      : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text2)] hover:bg-[var(--field)]'
                  }`}
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, tipo: 'egreso' })}
                  className={`h-11 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    form.tipo === 'egreso'
                      ? 'bg-[var(--danger-soft)] border-[var(--danger)] text-[var(--danger-deep)]'
                      : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text2)] hover:bg-[var(--field)]'
                  }`}
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  Egreso / Gasto
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Concepto *</label>
                <input
                  type="text"
                  value={form.concepto}
                  onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                  placeholder="Ej. Compra de cepilladora"
                  className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Monto *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.monto}
                    onChange={(e) => setForm({ ...form, monto: e.target.value })}
                    placeholder="0.00"
                    className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Fecha *</label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Categoría</label>
                <select
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {etiquetaCategoria(c)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Quién pagó</label>
                  <select
                    value={form.pagador && !opcionesPagador.includes(form.pagador) ? '__otro__' : form.pagador}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm({ ...form, pagador: v === '__otro__' ? form.pagador : v });
                    }}
                    className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  >
                    <option value="">— Sin asignar —</option>
                    {opcionesPagador.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                    <option value="__otro__">Otro (escribir)...</option>
                  </select>
                  {form.pagador && !opcionesPagador.includes(form.pagador) && (
                    <>
                      <input
                        type="text"
                        value={form.pagador}
                        onChange={(e) => setForm({ ...form, pagador: e.target.value })}
                        placeholder="Nombre de quién pagó"
                        className="w-full h-12 px-4 mt-2 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      />
                      {form.pagador.trim() && (
                        <button
                          type="button"
                          onClick={() => agregarOpcionDesdeAdmin('pagador', form.pagador)}
                          className="w-full mt-2 h-10 rounded-lg text-sm font-medium transition-colors bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          Guardar opción
                        </button>
                      )}
                    </>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Cuenta / Método</label>
                  <select
                    value={form.cuenta && !opcionesCuenta.includes(form.cuenta) ? '__otro__' : form.cuenta}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm({ ...form, cuenta: v === '__otro__' ? form.cuenta : v });
                    }}
                    className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  >
                    <option value="">— Sin asignar —</option>
                    {opcionesCuenta.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__otro__">Otro (escribir)...</option>
                  </select>
                  {form.cuenta && !opcionesCuenta.includes(form.cuenta) && (
                    <>
                      <input
                        type="text"
                        value={form.cuenta}
                        onChange={(e) => setForm({ ...form, cuenta: e.target.value })}
                        placeholder="Cuenta o método de pago"
                        className="w-full h-12 px-4 mt-2 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                      />
                      {form.cuenta.trim() && (
                        <button
                          type="button"
                          onClick={() => agregarOpcionDesdeAdmin('cuenta', form.cuenta)}
                          className="w-full mt-2 h-10 rounded-lg text-sm font-medium transition-colors bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          Guardar opción
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Factura emitida</label>
                <select
                  value={form.tiene_factura ? 'con' : 'sin'}
                  onChange={(e) => setForm({ ...form, tiene_factura: e.target.value === 'con' })}
                  className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                >
                  <option value="sin">Sin factura</option>
                  <option value="con">Con factura</option>
                </select>
                {form.tiene_factura && (
                  <input
                    type="text"
                    value={form.nro_factura}
                    onChange={(e) => setForm({ ...form, nro_factura: e.target.value })}
                    placeholder="Número de factura (opcional)"
                    className="w-full h-12 px-4 mt-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Notas</label>
                <textarea
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  rows={3}
                  placeholder="Detalles opcionales..."
                  className="w-full p-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[var(--blue-header)]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 text-[var(--text2)] font-medium hover:bg-[var(--blue-header)] rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardar}
                  disabled={guardando}
                  className="px-5 py-2.5 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-deep)] transition-colors flex items-center gap-2"
                >
                  {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {adminOpcionesOpen && (
        <div className="fixed inset-0 bg-[var(--overlay)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--field)]">
              <h3 className="text-xl font-bold text-[var(--text)]">Opciones de Finanzas</h3>
              <button
                onClick={() => setAdminOpcionesOpen(false)}
                className="text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--hover)] p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <span className="block text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-2">Quién pagó</span>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={nuevoPagador}
                    onChange={(e) => setNuevoPagador(e.target.value)}
                    placeholder="Nombre nuevo..."
                    className="flex-1 h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') agregarOpcionDesdeAdmin('pagador', nuevoPagador);
                    }}
                  />
                  <button
                    onClick={() => agregarOpcionDesdeAdmin('pagador', nuevoPagador)}
                    className="px-4 h-11 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--primary-deep)] transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {opcionesPagador.map((p) => {
                    const enDb = opcionesDb.pagadores.includes(p);
                    return (
                      <span
                        key={p}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-[var(--blue-header)] text-[var(--text)]"
                      >
                        {p}
                        <button
                          onClick={() => enDb && quitarOpcion('pagador', p)}
                          disabled={!enDb}
                          title={enDb ? 'Quitar' : 'Opción fija del sistema'}
                          className={`${enDb ? 'text-[var(--text2)] hover:text-[var(--danger-deep)]' : 'text-[var(--text2)] opacity-30 cursor-not-allowed'} transition-colors`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border)]">
                <span className="block text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-2">Cuenta / Método</span>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={nuevaCuenta}
                    onChange={(e) => setNuevaCuenta(e.target.value)}
                    placeholder="Cuenta o método nuevo..."
                    className="flex-1 h-11 px-3 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') agregarOpcionDesdeAdmin('cuenta', nuevaCuenta);
                    }}
                  />
                  <button
                    onClick={() => agregarOpcionDesdeAdmin('cuenta', nuevaCuenta)}
                    className="px-4 h-11 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--primary-deep)] transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {opcionesCuenta.map((c) => {
                    const enDb = opcionesDb.cuentas.includes(c);
                    return (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-[var(--blue-header)] text-[var(--text)]"
                      >
                        {c}
                        <button
                          onClick={() => enDb && quitarOpcion('cuenta', c)}
                          disabled={!enDb}
                          title={enDb ? 'Quitar' : 'Opción fija del sistema'}
                          className={`${enDb ? 'text-[var(--text2)] hover:text-[var(--danger-deep)]' : 'text-[var(--text2)] opacity-30 cursor-not-allowed'} transition-colors`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmarEliminar && (
        <div className="fixed inset-0 bg-[var(--overlay)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
            <Trash2 className="w-12 h-12 text-[var(--danger)] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[var(--text)] mb-2">¿Eliminar movimiento?</h3>
            <p className="text-sm text-[var(--text2)] mb-6">
              Se borrará "{confirmarEliminar.concepto}" por {dinero(confirmarEliminar.monto)}.
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
                disabled={guardando}
                className="px-5 py-2.5 bg-[var(--danger)] text-white font-medium rounded-lg hover:bg-[var(--danger-deep)] transition-colors flex items-center gap-2"
              >
                {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
