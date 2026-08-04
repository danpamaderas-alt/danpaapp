import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, AlertCircle, Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';

type Modo = 'login' | 'registro';

export default function Login() {
  const [modo, setModo] = useState<Modo>('login');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cambiarModo = (m: Modo) => {
    setModo(m);
    setError(null);
    setMensaje(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMensaje(null);

    if (!email.trim() || !password) {
      setError('Completá email y contraseña.');
      return;
    }
    if (modo === 'registro') {
      if (!nombre.trim()) {
        setError('Escribí tu nombre.');
        return;
      }
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
    }

    setLoading(true);
    try {
      if (modo === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { nombre: nombre.trim(), perfil: 'corredor' } },
        });
        if (error) throw error;
        if (!data.session) {
          setMensaje('Cuenta creada. Revisá tu email para confirmarla y después ingresá.');
          cambiarModo('login');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--text)] tracking-tight">DANPA MADERAS</h1>
          <p className="text-[var(--text2)] text-sm mt-1">Venta de Maderas</p>
        </div>

        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
          <div className="flex border-b border-[var(--border)]">
            <button
              onClick={() => cambiarModo('login')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                modo === 'login'
                  ? 'bg-[var(--primary-soft)] text-[var(--primary-deep)]'
                  : 'text-[var(--text2)] hover:bg-[var(--field)]'
              }`}
            >
              Ingresar
            </button>
            <button
              onClick={() => cambiarModo('registro')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                modo === 'registro'
                  ? 'bg-[var(--primary-soft)] text-[var(--primary-deep)]'
                  : 'text-[var(--text2)] hover:bg-[var(--field)]'
              }`}
            >
              Crear cuenta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-[var(--danger-soft)] text-[var(--danger-deep)] p-3 rounded-lg flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {mensaje && (
              <div className="bg-[var(--primary-soft)] text-[var(--primary-deep)] p-3 rounded-lg text-sm">{mensaje}</div>
            )}

            {modo === 'registro' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Nombre</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Tu nombre y apellido"
                    className="w-full h-12 pl-10 pr-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="corredor@ejemplo.com"
                  className="w-full h-12 pl-10 pr-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 pl-10 pr-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-deep)] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : modo === 'login' ? (
                <LogIn className="w-5 h-5" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
              {modo === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[var(--muted)] mt-6">Cada corredor accede con su propio usuario.</p>
      </div>
    </div>
  );
}
