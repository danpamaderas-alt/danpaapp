import { useEffect, useState } from 'react';
import {
  PackageOpen,
  PlusCircle,
  ListOrdered,
  TreePine,
  Users,
  Wallet,
  CalendarCheck2,
  Loader2,
  AlertCircle,
  Sun,
  Moon,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import Dashboard from './components/Dashboard';
import ProductosView from './components/ProductosView';
import NuevoPedido from './components/NuevoPedido';
import MisPedidos from './components/MisPedidos';
import ClientesView from './components/ClientesView';
import FinanzasView from './components/FinanzasView';
import VisitasView from './components/VisitasView';
import Login from './components/Login';
import { fetchCorredorActual } from './lib/corredor';
import type { Usuario } from './lib/corredor';

type View = 'dashboard' | 'productos' | 'nuevoPedido' | 'pedidos' | 'clientes' | 'finanzas' | 'visitas';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [corredor, setCorredor] = useState<Usuario | null>(null);
  const [perfilCargando, setPerfilCargando] = useState(false);
  const [perfilError, setPerfilError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setCurrentView('dashboard');
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
  };

  if (authLoading || (session && perfilCargando)) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--text)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!session) {
    return <Login />;
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

  const corredorId = corredor.id;

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <aside className="fixed top-0 left-0 h-full w-[260px] bg-[#162839] border-r border-[var(--border)] flex flex-col py-2 z-50 overflow-hidden">
        <div className="px-6 py-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">DANPA MADERAS</h1>
          <p className="text-[var(--muted)] text-xs font-medium mt-1">Venta de Maderas</p>
        </div>

        <nav className="flex-grow mt-2">
          <ul className="space-y-1">
            {(
              [
                { id: 'dashboard', label: 'Resumen', Icon: PackageOpen },
                { id: 'productos', label: 'Productos & Stock', Icon: TreePine },
                { id: 'nuevoPedido', label: 'Nuevo Pedido', Icon: PlusCircle },
                { id: 'pedidos', label: 'Mis Pedidos', Icon: ListOrdered },
                { id: 'clientes', label: 'Mis Clientes', Icon: Users },
                { id: 'visitas', label: 'Visitas', Icon: CalendarCheck2 },
                { id: 'finanzas', label: 'Finanzas', Icon: Wallet },
              ] as { id: View; label: string; Icon: LucideIcon }[]
            ).map(({ id, label, Icon }) => (
              <li key={id}>
                <button
                  onClick={() => setCurrentView(id)}
                  className={`w-full flex items-center gap-3 px-6 py-3 transition-colors duration-200 ${
                    currentView === id
                      ? 'border-l-4 border-[var(--primary)] bg-[#36485b] text-white'
                      : 'text-[var(--muted)] hover:text-white hover:bg-[#2c3e50] border-l-4 border-transparent'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-base text-left">{label}</span>
                </button>
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
          <p className="text-sm font-semibold text-white truncate">{corredor.nombre}</p>
          <button
            onClick={cerrarSesion}
            className="mt-3 flex items-center gap-2 text-xs text-[var(--muted)] hover:text-white transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="ml-[260px] flex-1 flex flex-col min-w-0">
        {currentView === 'dashboard' && <Dashboard corredorId={corredorId} />}
        {currentView === 'productos' && <ProductosView />}
        {currentView === 'nuevoPedido' && <NuevoPedido corredorId={corredorId} onSuccess={() => setCurrentView('pedidos')} />}
        {currentView === 'pedidos' && <MisPedidos corredorId={corredorId} />}
        {currentView === 'clientes' && <ClientesView corredorId={corredorId} />}
        {currentView === 'visitas' && <VisitasView corredorId={corredorId} />}
        {currentView === 'finanzas' && <FinanzasView corredorId={corredorId} />}
      </div>
    </div>
  );
}
