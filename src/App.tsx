import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import {
  PackageOpen,
  PlusCircle,
  ListOrdered,
  TreePine,
  Users,
  Wallet,
  CalendarCheck2,
  Calendar,
  UserCog,
  Briefcase,
  Scissors,
  BarChart3,
  Database,
  UsersRound,
  Loader2,
  AlertCircle,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Bell,
  CheckCheck,
  Boxes,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import {
  fetchNotificaciones,
  marcarLeido,
  marcarTodasLeido,
  iconoNotificacion,
  colorNotificacion,
  type Notificacion,
  type TipoNotificacion,
  type NivelNotificacion,
} from './lib/notificaciones';
import { formatDate } from './lib/format';

const Dashboard = lazy(() => import('./components/Dashboard'));
const ProductosView = lazy(() => import('./components/ProductosView'));
const NuevoPedido = lazy(() => import('./components/NuevoPedido'));
const MisPedidos = lazy(() => import('./components/MisPedidos'));
const ClientesView = lazy(() => import('./components/ClientesView'));
const FinanzasView = lazy(() => import('./components/FinanzasView'));
const VisitasView = lazy(() => import('./components/VisitasView'));
const AgendaView = lazy(() => import('./components/AgendaView'));
const CalendarioView = lazy(() => import('./components/CalendarioView'));
const PodasView = lazy(() => import('./components/PodasView'));
const InformesView = lazy(() => import('./components/InformesView'));
const BackupView = lazy(() => import('./components/BackupView'));
const UsuariosView = lazy(() => import('./components/UsuariosView'));
const RrhhView = lazy(() => import('./components/RrhhView'));
const ContratistasView = lazy(() => import('./components/ContratistasView'));
const InventarioView = lazy(() => import('./components/InventarioView'));
const Login = lazy(() => import('./components/Login'));
import { fetchCorredorActual } from './lib/corredor';
import type { Usuario } from './lib/corredor';

type View = 'dashboard' | 'productos' | 'inventario' | 'nuevoPedido' | 'pedidos' | 'clientes' | 'finanzas' | 'visitas' | 'agenda' | 'calendario' | 'podas' | 'informes' | 'backup' | 'usuarios' | 'rrhh' | 'contratistas';

const VISTAS: View[] = ['dashboard', 'productos', 'inventario', 'nuevoPedido', 'pedidos', 'clientes', 'finanzas', 'visitas', 'agenda', 'calendario', 'podas', 'informes', 'backup', 'usuarios', 'rrhh', 'contratistas'];

function leerVistaGuardada(): View {
  try {
    const guardada = localStorage.getItem('maderas.vista');
    if (guardada && VISTAS.includes(guardada as View)) return guardada as View;
  } catch {
    // ignore
  }
  return 'dashboard';
}

function FullLoader() {
  return (
    <div className="flex-1 flex items-center justify-center py-24 text-[var(--text)]">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [corredor, setCorredor] = useState<Usuario | null>(null);
  const [perfilCargando, setPerfilCargando] = useState(false);
  const [perfilError, setPerfilError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>(leerVistaGuardada);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [dark, setDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('maderas.dark');
      if (stored !== null) return stored === '1';
    } catch {
      // ignore
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('maderas.dark', dark ? '1' : '0');
    } catch {
      // ignore
    }
  }, [dark]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  useEffect(() => {
    try {
      localStorage.setItem('maderas.vista', currentView);
    } catch {
      // ignore
    }
  }, [currentView]);

  useEffect(() => {
    if (!corredor?.activo) return;
    const esAdminLocal = corredor.perfil === 'admin';
    const esGestionLocal = esAdminLocal || corredor.perfil === 'ventas';
    const soloAdmin = ['usuarios', 'rrhh', 'contratistas'] as View[];
    const soloGestion = ['productos', 'inventario', 'backup'] as View[];
    if ((soloAdmin.includes(currentView) && !esAdminLocal) || (soloGestion.includes(currentView) && !esGestionLocal)) {
      setCurrentView('dashboard');
    }
  }, [currentView, corredor]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === 'SIGNED_OUT') setCurrentView('dashboard');
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setCorredor(null);
      setPerfilError(null);
      return;
    }

    let activo = true;
    setPerfilCargando(true);
    setPerfilError(null);
    fetchCorredorActual(session.user.id)
      .then((c) => {
        if (activo) setCorredor(c);
      })
      .catch(() => {
        if (activo) setPerfilError('No se pudo cargar tu perfil de corredor.');
      })
      .finally(() => {
        if (activo) setPerfilCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [session?.user?.id]);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    setCorredor(null);
    setNotificaciones([]);
    setNotifOpen(false);
  };

  const cargarNotificaciones = useCallback(async (id: string) => {
    try {
      const lista = await fetchNotificaciones(id);
      setNotificaciones(lista);
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
    }
  }, []);

  useEffect(() => {
    if (corredor?.id) cargarNotificaciones(corredor.id);
  }, [corredor?.id, cargarNotificaciones]);

  const noLeidas = notificaciones.filter((n) => !n.leido).length;

  const abrirNotif = () => {
    setNotifOpen((o) => !o);
    if (corredorId) cargarNotificaciones(corredorId);
  };

  const clickNotif = async (n: Notificacion) => {
    setNotifOpen(false);
    if (!n.leido) {
      setNotificaciones((prev) => prev.map((x) => (x.id === n.id ? { ...x, leido: true } : x)));
      marcarLeido(n.id, corredorId).catch(console.error);
    }
    if (n.enlace === 'agenda') {
      setCurrentView('agenda');
      setSidebarOpen(false);
    }
  };

  const marcarTodas = async () => {
    setNotificaciones((prev) => prev.map((x) => ({ ...x, leido: true })));
    try {
      await marcarTodasLeido(corredorId);
    } catch (err) {
      console.error('Error marcando todas como leídas:', err);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <div className="bg-[var(--surface)] p-8 rounded-xl border border-[var(--border)] max-w-lg w-full text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[var(--text)] mb-2">Faltan Variables de Entorno</h1>
          <p className="text-[var(--text2)] text-sm mb-4">
            La aplicación no encuentra las credenciales de Supabase.
          </p>
          <div className="bg-[var(--bg)] p-4 rounded-lg text-left font-mono text-xs text-[var(--text2)] space-y-1 mb-4 overflow-x-auto">
            <p className="text-[var(--text)] font-semibold mb-1">Debes configurar en Vercel / Netlify / .env:</p>
            <p>VITE_SUPABASE_URL=https://tu-proyecto.supabase.co</p>
            <p>VITE_SUPABASE_ANON_KEY=tu_anon_key</p>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading || (session && perfilCargando)) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--text)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!session) {
    return (
      <Suspense fallback={<FullLoader />}>
        <Login />
      </Suspense>
    );
  }

  if (!corredor || !corredor.activo || perfilError) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <div className="bg-[var(--surface)] p-8 rounded-xl border border-[var(--border)] max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-[var(--danger)] mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[var(--text)] mb-2">No se pudo acceder</h1>
          <p className="text-[var(--text2)] text-sm mb-6">
            {perfilError || (corredor && !corredor.activo ? 'Tu cuenta está desactivada. Contactá al administrador.' : 'Tu usuario no tiene un perfil de corredor activo.')}
          </p>
          <button
            onClick={cerrarSesion}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-deep)] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  const c = corredor!;
  const corredorId = c.id;
  const esAdmin = c.perfil === 'admin';
  const esGestion = esAdmin || c.perfil === 'ventas';

  const seccionesMenu = [
    {
      titulo: 'Principal',
      items: [{ id: 'dashboard', label: 'Resumen', Icon: PackageOpen }],
    },
    {
      titulo: 'Pedidos',
      items: [
        { id: 'nuevoPedido', label: 'Nuevo Pedido', Icon: PlusCircle },
        { id: 'pedidos', label: 'Mis Pedidos', Icon: ListOrdered },
      ],
    },
    {
      titulo: 'Catálogo',
      items: [
        ...(esGestion ? [{ id: 'productos', label: 'Productos', Icon: TreePine }] : []),
        ...(esGestion ? [{ id: 'inventario', label: 'Inventario', Icon: Boxes }] : []),
      ],
    },
    {
      titulo: 'Clientes',
      items: [
        { id: 'clientes', label: 'Mis Clientes', Icon: Users },
        { id: 'visitas', label: 'Visitas', Icon: CalendarCheck2 },
        { id: 'agenda', label: 'Agenda', Icon: Briefcase },
        { id: 'calendario', label: 'Calendario', Icon: Calendar },
        { id: 'podas', label: 'Podas de Árboles', Icon: Scissors },
      ],
    },
    {
      titulo: 'Administración',
      items: [
        ...(esAdmin ? [{ id: 'usuarios', label: 'Usuarios', Icon: UserCog }] : []),
        ...(esAdmin ? [{ id: 'rrhh', label: 'Recursos Humanos', Icon: UsersRound }] : []),
        ...(esAdmin ? [{ id: 'contratistas', label: 'Subcontratados', Icon: Wrench }] : []),
        { id: 'finanzas', label: 'Finanzas', Icon: Wallet },
        { id: 'informes', label: 'Informes', Icon: BarChart3 },
        ...(esGestion ? [{ id: 'backup', label: 'Backup', Icon: Database }] : []),
      ],
    },
  ] as { titulo: string; items: { id: View; label: string; Icon: LucideIcon }[] }[];

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-[260px] bg-[#162839] border-r border-[var(--border)] flex flex-col py-2 z-50 overflow-hidden transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-6 py-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Servicios Integrales</h1>
            <p className="text-[var(--muted)] text-xs font-medium mt-1">Venta de Maderas</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[var(--muted)] hover:text-white p-1 -mr-2"
            title="Cerrar menú"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="sidebar-nav flex-grow mt-2 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-2">
            {seccionesMenu.map((seccion) => (
              <li key={seccion.titulo}>
                <p className="px-6 pt-4 pb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#7fd3a4]">
                  <span className="w-1 h-3.5 rounded-full bg-[#7fd3a4]" />
                  {seccion.titulo}
                </p>
                <ul className="space-y-0.5">
                  {seccion.items.map(({ id, label, Icon }) => (
                    <li key={id}>
                      <button
                        onClick={() => {
                          setCurrentView(id);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-6 py-2.5 transition-colors duration-200 ${
                          currentView === id
                            ? 'border-l-4 border-[var(--primary)] bg-[#36485b] text-white'
                            : 'text-[var(--muted)] hover:text-white hover:bg-[#2c3e50] border-l-4 border-transparent'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm text-left">{label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto border-t border-[#2c3e50] pt-4 px-6 mb-4">
          <button
            onClick={() => setDark((d) => !d)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[var(--muted)] hover:text-white hover:bg-[#2c3e50] transition-colors"
            title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            <span className="flex items-center gap-2 text-sm">
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {dark ? 'Modo claro' : 'Modo oscuro'}
            </span>
          </button>
        </div>

        <div className="border-t border-[#2c3e50] pt-4 px-6 mb-4">
          <p className="text-xs text-[var(--muted)]">Operando como</p>
          <p className="text-sm font-semibold text-white truncate">{c.nombre}</p>
          <button
            onClick={cerrarSesion}
            className="mt-3 flex items-center gap-2 text-xs text-[var(--muted)] hover:text-white transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="lg:ml-[260px] flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-[#162839] flex items-center justify-between gap-3 px-4 py-3 shadow-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-[var(--muted)] hover:text-white p-1"
              title="Abrir menú"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-white tracking-tight">Servicios Integrales</h1>
          </div>

          <div className="relative">
            <button
              onClick={abrirNotif}
              className="relative p-2 rounded-lg text-[var(--muted)] hover:text-white hover:bg-[#2c3e50] transition-colors"
              title="Notificaciones"
            >
              <Bell className="w-5 h-5" />
              {noLeidas > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--danger)] text-white text-[10px] font-bold flex items-center justify-center">
                  {noLeidas > 99 ? '99+' : noLeidas}
                </span>
              )}
            </button>

            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-[var(--border)] flex justify-between items-center bg-[var(--field)]">
                    <p className="font-semibold text-[var(--text)]">Notificaciones</p>
                    {noLeidas > 0 && (
                      <button
                        onClick={marcarTodas}
                        className="text-xs font-medium text-[var(--primary)] hover:underline flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Marcar todas
                      </button>
                    )}
                  </div>
                  <div className="max-h-[380px] overflow-y-auto divide-y divide-[var(--border)]">
                    {notificaciones.length === 0 ? (
                      <p className="px-4 py-8 text-center text-sm text-[var(--text2)]">No tenés notificaciones.</p>
                    ) : (
                      notificaciones.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => clickNotif(n)}
                          className="w-full text-left px-4 py-3 hover:bg-[var(--field)] transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <span className={`w-8 h-8 rounded-lg border flex items-center justify-center text-sm flex-shrink-0 ${colorNotificacion(n.nivel as NivelNotificacion)}`}>
                              {iconoNotificacion(n.tipo as TipoNotificacion)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm ${n.leido ? 'text-[var(--text2)]' : 'text-[var(--text)] font-semibold'}`}>{n.titulo}</p>
                              <p className="text-xs text-[var(--text2)] mt-0.5 line-clamp-2">{n.mensaje}</p>
                              <p className="text-[10px] text-[var(--muted)] mt-1">{formatDate(n.creado_en)}</p>
                            </div>
                            {!n.leido && <span className="w-2 h-2 rounded-full bg-[var(--primary)] flex-shrink-0 mt-1.5" />}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        <Suspense fallback={<FullLoader />}>
          {currentView === 'dashboard' && <Dashboard corredorId={corredorId} onNavigate={() => setCurrentView('agenda')} />}
          {esAdmin && currentView === 'usuarios' && <UsuariosView corredorId={corredorId} />}
          {esAdmin && currentView === 'rrhh' && <RrhhView corredorId={corredorId} />}
          {esAdmin && currentView === 'contratistas' && <ContratistasView corredorId={corredorId} />}
          {esGestion && currentView === 'productos' && <ProductosView />}
          {esGestion && currentView === 'inventario' && <InventarioView />}
          {currentView === 'nuevoPedido' && <NuevoPedido corredorId={corredorId} onSuccess={() => setCurrentView('pedidos')} />}
          {currentView === 'pedidos' && <MisPedidos corredorId={corredorId} />}
          {currentView === 'clientes' && <ClientesView corredorId={corredorId} />}
          {currentView === 'visitas' && <VisitasView corredorId={corredorId} />}
          {currentView === 'agenda' && <AgendaView corredorId={corredorId} />}
          {currentView === 'calendario' && <CalendarioView corredorId={corredorId} />}
          {currentView === 'podas' && <PodasView corredorId={corredorId} />}
          {currentView === 'finanzas' && <FinanzasView corredorId={corredorId} />}
          {currentView === 'informes' && <InformesView corredorId={corredorId} />}
          {esGestion && currentView === 'backup' && <BackupView corredorId={corredorId} />}
        </Suspense>
      </div>
    </div>
  );
}
