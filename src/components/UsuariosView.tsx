import { Modal } from './Modal';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types';
import {
  UserCog,
  Loader2,
  AlertCircle,
  UserPlus,
  X,
  KeyRound,
  Ban,
  CheckCircle2,
  Mail,
  User,
  Lock,
} from 'lucide-react';

type Usuario = Database['public']['Tables']['usuarios']['Row'];

const perfiles = [
  { value: 'admin', label: 'Admin', badge: 'bg-[var(--primary-soft)] text-[var(--primary-deep)]' },
  { value: 'ventas', label: 'Ventas', badge: 'bg-[var(--blue-soft)] text-[var(--text)]' },
  { value: 'corredor', label: 'Corredor', badge: 'bg-[var(--gray-soft)] text-[var(--text2)]' },
];

const badgePerfil = (perfil: string) =>
  perfiles.find((p) => p.value === perfil) || { value: perfil, label: perfil, badge: 'bg-[var(--gray-soft)] text-[var(--text2)]' };

export default function UsuariosView({ corredorId }: { corredorId: string }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', perfil: 'ventas' });

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: e } = await supabase.rpc('admin_listar_usuarios');
      if (e) throw e;
      setUsuarios((data as Usuario[]) || []);
    } catch (err: any) {
      console.error(err);
      setError('Error al cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const crear = async () => {
    const nombre = form.nombre.trim();
    const email = form.email.trim();
    if (!nombre) {
      alert('Escribí el nombre.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('El email no es válido.');
      return;
    }
    if (form.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setGuardando(true);
    setError(null);
    let e: { message: string } | null = null;
    const { error } = await supabase.rpc('admin_crear_usuario', {
      p_nombre: nombre,
      p_email: email,
      p_password: form.password,
      p_perfil: form.perfil,
    });
    e = error;
    setGuardando(false);
    if (e) {
      setError('Error al crear el usuario: ' + e.message);
      return;
    }
    setModal(false);
    setForm({ nombre: '', email: '', password: '', perfil: 'ventas' });
    await cargar();
  };

  const toggleActivo = async (u: Usuario) => {
    setOcupadoId(u.id);
    setError(null);
    let e: { message: string } | null = null;
    const { error } = await supabase.rpc('admin_set_activo', {
      p_user_id: u.id,
      p_activo: !u.activo,
    });
    e = error;
    setOcupadoId(null);
    if (e) {
      setError('Error al cambiar el acceso: ' + e.message);
      return;
    }
    await cargar();
  };

  const cambiarPassword = async (u: Usuario) => {
    const nueva = window.prompt(`Nueva contraseña para ${u.nombre || u.email}`);
    if (nueva === null) return;
    if (nueva.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setOcupadoId(u.id);
    const { error: e } = await supabase.rpc('admin_set_password', {
      p_user_id: u.id,
      p_password: nueva,
    });
    setOcupadoId(null);
    if (e) {
      setError('Error al cambiar la contraseña: ' + e.message);
      return;
    }
    alert('Contraseña actualizada.');
  };

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-[1440px] mx-auto w-full">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text)] tracking-tight">Usuarios</h2>
          <p className="text-[var(--text2)] mt-1">Crear cuentas, asignar perfiles y controlar el acceso.</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-deep)] transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo usuario
        </button>
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
          <p>Cargando usuarios...</p>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-12 text-center text-[var(--text2)]">
          <UserCog className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[var(--text)] mb-2">No hay usuarios</h3>
          <p>Creá el primer usuario con el botón "Nuevo usuario".</p>
        </div>
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_1.2fr_120px_110px_200px] gap-4 px-6 py-3 bg-[var(--field)] border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wider text-[var(--text2)]">
            <span>Nombre</span>
            <span>Email</span>
            <span>Perfil</span>
            <span>Acceso</span>
            <span className="text-right">Acciones</span>
          </div>
          <div className="divide-y divide-[var(--border)]/60">
            {usuarios.map((u) => {
              const esYo = u.id === corredorId;
              const perfil = badgePerfil(u.perfil);
              return (
                <div key={u.id} className="grid md:grid-cols-[1fr_1.2fr_120px_110px_200px] gap-2 md:gap-4 items-center px-6 py-4">
                  <div>
                    <p className="font-semibold text-[var(--text)] truncate">{u.nombre || '—'}</p>
                    <p className="text-xs text-[var(--text2)] md:hidden">{u.email}</p>
                    {esYo && <p className="text-xs text-[var(--primary-deep)]">(vos)</p>}
                  </div>
                  <p className="text-[var(--text2)] text-sm hidden md:block truncate">{u.email}</p>
                  <span className={`justify-self-start text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded ${perfil.badge}`}>
                    {perfil.label}
                  </span>
                  <span
                    className={`justify-self-start text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded inline-flex items-center gap-1.5 ${
                      u.activo ? 'bg-[var(--success-soft)] text-[var(--success-deep)]' : 'bg-[var(--danger-soft)] text-[var(--danger-deep)]'
                    }`}
                  >
                    {u.activo ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                    {u.activo ? 'Activo' : 'Bloqueado'}
                  </span>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => cambiarPassword(u)}
                      disabled={ocupadoId === u.id}
                      title="Cambiar contraseña"
                      className="p-2 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--blue-header)] disabled:opacity-50 transition-colors"
                    >
                      {ocupadoId === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => toggleActivo(u)}
                      disabled={esYo || ocupadoId === u.id}
                      title={u.activo ? 'Quitar acceso' : 'Dar acceso'}
                      className={`p-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        u.activo
                          ? 'border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger-soft)]'
                          : 'border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary-soft)]'
                      }`}
                    >
                      {ocupadoId === u.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : u.activo ? (
                        <Ban className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {modal && (
        <Modal title="Nuevo usuario" onClose={() => setModal(false)}>
          <div className="bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--field)]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--primary-soft)] rounded-lg">
                  <UserPlus className="w-5 h-5 text-[var(--primary-deep)]" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text)]">Nuevo usuario</h3>
              </div>
              <button
                onClick={() => setModal(false)}
                className="text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--hover)] p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Nombre *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Nombre y apellido"
                    className="w-full h-12 pl-10 pr-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="corredor@danpa.com"
                    className="w-full h-12 pl-10 pr-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Contraseña *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full h-12 pl-10 pr-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Perfil *</label>
                <select
                  value={form.perfil}
                  onChange={(e) => setForm({ ...form, perfil: e.target.value })}
                  className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                >
                  {perfiles.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
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
                  onClick={crear}
                  disabled={guardando}
                  className="px-5 py-2.5 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-deep)] transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                  Crear usuario
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
