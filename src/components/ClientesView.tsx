import { Modal } from './Modal';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types';
import { fetchNotas, crearNota, eliminarNota, type ClienteNota } from '../lib/clienteNotas';
import { formatDate } from '../lib/format';
import { Users, Plus, Loader2, AlertCircle, Search, MapPin, Phone, Tag, StickyNote, X, Trash2, Pencil } from 'lucide-react';

type Cliente = Database['public']['Tables']['clientes']['Row'];

interface ClientesViewProps {
  corredorId: string;
}

const initialForm = {
  nombre: '',
  telefono: '',
  direccion: '',
  notas: '',
  tipo_cliente: 'general',
};

export default function ClientesView({ corredorId }: ClientesViewProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [notasCliente, setNotasCliente] = useState<Cliente | null>(null);
  const [notas, setNotas] = useState<ClienteNota[]>([]);
  const [nuevaNota, setNuevaNota] = useState('');
  const [notasLoading, setNotasLoading] = useState(false);
  const [notasError, setNotasError] = useState<string | null>(null);
  const [notasGuardando, setNotasGuardando] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [editFormData, setEditFormData] = useState(initialForm);
  const [editActivo, setEditActivo] = useState(true);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: e } = await supabase
        .from('clientes')
        .select('id, nombre, telefono, direccion, notas, tipo_cliente, activo')
        .eq('corredor_id', corredorId)
        .order('nombre', { ascending: true });
      if (e) throw e;
      setClientes((data as Cliente[]) || []);
    } catch (err: any) {
      console.error(err);
      setError('Error al cargar la lista de clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, [corredorId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const { error: insertError } = await supabase.from('clientes').insert({
        corredor_id: corredorId,
        nombre: formData.nombre,
        telefono: formData.telefono || null,
        direccion: formData.direccion || null,
        notas: formData.notas || null,
        tipo_cliente: formData.tipo_cliente,
      });
      if (insertError) throw insertError;

      setIsModalOpen(false);
      setFormData(initialForm);
      fetchClientes();
    } catch (err: any) {
      console.error(err);
      alert('Error al agregar cliente: ' + (err.message || 'Intentelo más tarde.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActivo = async (cliente: Cliente) => {
    const { error: e } = await supabase
      .from('clientes')
      .update({ activo: !cliente.activo })
      .eq('id', cliente.id);
    if (e) {
      alert('Error al actualizar: ' + e.message);
      return;
    }
    setClientes((prev) => prev.map((c) => (c.id === cliente.id ? { ...c, activo: !cliente.activo } : c)));
  };

  const abrirEdicion = (cliente: Cliente) => {
    setEditFormData({
      nombre: cliente.nombre,
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      notas: cliente.notas || '',
      tipo_cliente: cliente.tipo_cliente,
    });
    setEditActivo(cliente.activo);
    setEditingCliente(cliente);
  };

  const guardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCliente) return;
    setEditSubmitting(true);
    try {
      const { error: e2 } = await supabase
        .from('clientes')
        .update({
          nombre: editFormData.nombre,
          telefono: editFormData.telefono || null,
          direccion: editFormData.direccion || null,
          notas: editFormData.notas || null,
          tipo_cliente: editFormData.tipo_cliente,
          activo: editActivo,
        })
        .eq('id', editingCliente.id);
      if (e2) throw e2;
      setEditingCliente(null);
      fetchClientes();
    } catch (err: any) {
      alert('Error al guardar el cliente: ' + (err.message || 'Inténtelo más tarde.'));
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const abrirNotas = async (cliente: Cliente) => {
    setNotasCliente(cliente);
    setNotasError(null);
    setNotasLoading(true);
    setNuevaNota('');
    try {
      const data = await fetchNotas(cliente.id);
      setNotas(data);
    } catch (err: any) {
      setNotasError('Error al cargar las notas: ' + (err.message || 'Inténtelo más tarde.'));
    } finally {
      setNotasLoading(false);
    }
  };

  const agregarNota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notasCliente || !nuevaNota.trim()) return;
    setNotasGuardando(true);
    setNotasError(null);
    try {
      await crearNota(notasCliente.id, corredorId, nuevaNota.trim());
      setNuevaNota('');
      const data = await fetchNotas(notasCliente.id);
      setNotas(data);
    } catch (err: any) {
      setNotasError('Error al guardar la nota: ' + (err.message || 'Inténtelo más tarde.'));
    } finally {
      setNotasGuardando(false);
    }
  };

  const borrarNota = async (id: string) => {
    if (!notasCliente) return;
    setNotasGuardando(true);
    setNotasError(null);
    try {
      await eliminarNota(id);
      const data = await fetchNotas(notasCliente.id);
      setNotas(data);
    } catch (err: any) {
      setNotasError('Error al eliminar la nota: ' + (err.message || 'Inténtelo más tarde.'));
    } finally {
      setNotasGuardando(false);
    }
  };

  const filtered = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.telefono || '').includes(searchQuery)
  );

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-[1440px] mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text)] tracking-tight">Mis Clientes</h2>
          <p className="text-[var(--text2)] mt-1">Directorio de clientes del corredor.</p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text2)] w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all shadow-sm"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[var(--primary)] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--primary-deep)] transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Nuevo Cliente
          </button>
        </div>
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
          <p>Cargando clientes...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-12 text-center text-[var(--text2)]">
          <Users className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[var(--text)] mb-2">No se encontraron clientes</h3>
          <p>Agregá un nuevo cliente para gestionar sus pedidos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => (
            <div
              key={c.id}
              className={`bg-[var(--surface)] border ${c.activo ? 'border-[var(--border)]' : 'border-[var(--border)] opacity-60'} rounded-xl p-6 hover:shadow-md transition-shadow`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text)]">{c.nombre}</h3>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] uppercase tracking-wider mt-1">
                    <Tag className="w-3.5 h-3.5" />
                    {c.tipo_cliente}
                  </span>
                </div>
                <button
                  onClick={() => toggleActivo(c)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                    c.activo ? 'bg-[var(--primary-soft)] text-[var(--primary-deep)]' : 'bg-[var(--gray-soft)] text-[var(--text2)]'
                  }`}
                  title="Activar/desactivar"
                >
                  {c.activo ? 'Activo' : 'Inactivo'}
                </button>
              </div>

              <div className="space-y-3">
                {c.telefono && (
                  <div className="flex items-start gap-3 text-sm text-[var(--text2)]">
                    <Phone className="w-4 h-4 mt-0.5 text-[var(--muted)]" />
                    <span>{c.telefono}</span>
                  </div>
                )}
                {c.direccion && (
                  <div className="flex items-start gap-3 text-sm text-[var(--text2)]">
                    <MapPin className="w-4 h-4 mt-0.5 text-[var(--muted)]" />
                    <span className="line-clamp-2">{c.direccion}</span>
                  </div>
                )}
              </div>

              {c.notas && (
                <div className="mt-4 pt-3 border-t border-[var(--blue-header)] text-sm text-[var(--text)]">
                  <p className="text-xs uppercase tracking-wider text-[var(--text2)] mb-1">Notas</p>
                  <p className="line-clamp-2">{c.notas}</p>
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => abrirEdicion(c)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--text2)] hover:bg-[var(--hover)] transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => abrirNotas(c)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--primary-deep)] hover:bg-[var(--primary-soft)] hover:border-[var(--primary)] transition-colors"
                >
                  <StickyNote className="w-4 h-4" />
                  Notas
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <Modal title="Nuevo Cliente" onClose={() => setIsModalOpen(false)}>
          <div className="bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--field)]">
              <h3 className="text-xl font-bold text-[var(--text)]">Nuevo Cliente</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--hover)] p-2 rounded-lg transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Nombre *</label>
                <input
                  type="text"
                  name="nombre"
                  required
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej. Casa de Bebidas"
                  className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Teléfono</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="+54 221..."
                    className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Tipo</label>
                  <select
                    name="tipo_cliente"
                    value={formData.tipo_cliente}
                    onChange={handleChange}
                    className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  >
                    <option value="general">General</option>
                    <option value="mayorista">Mayorista</option>
                    <option value="constructor">Constructor</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  placeholder="Calle y número, localidad"
                  className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Notas</label>
                <textarea
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Forma de pago habitual, referencias..."
                  className="w-full p-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[var(--blue-header)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-[var(--text2)] font-medium hover:bg-[var(--blue-header)] rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-deep)] transition-colors flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {editingCliente && (
        <Modal title="Editar Cliente" onClose={() => setEditingCliente(null)}>
          <div className="bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--field)]">
              <h3 className="text-xl font-bold text-[var(--text)]">Editar Cliente</h3>
              <button
                onClick={() => setEditingCliente(null)}
                className="text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--hover)] p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarEdicion} className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Nombre *</label>
                <input
                  type="text"
                  name="nombre"
                  required
                  value={editFormData.nombre}
                  onChange={handleEditChange}
                  className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Teléfono</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={editFormData.telefono}
                    onChange={handleEditChange}
                    className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Tipo</label>
                  <select
                    name="tipo_cliente"
                    value={editFormData.tipo_cliente}
                    onChange={handleEditChange}
                    className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  >
                    <option value="general">General</option>
                    <option value="mayorista">Mayorista</option>
                    <option value="constructor">Constructor</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  value={editFormData.direccion}
                  onChange={handleEditChange}
                  className="w-full h-12 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Notas</label>
                <textarea
                  name="notas"
                  value={editFormData.notas}
                  onChange={handleEditChange}
                  rows={3}
                  className="w-full p-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                />
              </div>

              <label className="flex items-center gap-3 select-none">
                <input
                  type="checkbox"
                  checked={editActivo}
                  onChange={(e) => setEditActivo(e.target.checked)}
                  className="w-5 h-5 accent-[var(--primary)]"
                />
                <span className="text-sm font-medium text-[var(--text2)]">Cliente activo</span>
              </label>

              <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setEditingCliente(null)}
                  className="px-5 py-2.5 text-[var(--text2)] font-medium hover:bg-[var(--blue-header)] rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2.5 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-deep)] transition-colors flex items-center gap-2"
                >
                  {editSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {notasCliente && (
        <Modal title={`Notas de ${notasCliente.nombre}`} onClose={() => setNotasCliente(null)}>
          <div className="bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--field)]">
              <h3 className="text-xl font-bold text-[var(--text)]">Notas de {notasCliente.nombre}</h3>
              <button
                onClick={() => setNotasCliente(null)}
                className="text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--hover)] p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {notasError && (
                <div className="bg-[var(--danger-soft)] text-[var(--danger-deep)] p-3 rounded-lg flex items-start gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>{notasError}</p>
                </div>
              )}

              <form onSubmit={agregarNota} className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider">Nueva nota</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nuevaNota}
                    onChange={(e) => setNuevaNota(e.target.value)}
                    placeholder="Ej. Pide 50 tablas de pino por mes..."
                    className="flex-1 h-11 px-4 rounded-lg border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--field)]"
                  />
                  <button
                    type="submit"
                    disabled={notasGuardando || !nuevaNota.trim()}
                    className="px-5 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-deep)] transition-colors flex items-center gap-2"
                  >
                    {notasGuardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Agregar
                  </button>
                </div>
              </form>

              <div className="max-h-[320px] overflow-y-auto space-y-3">
                {notasLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 text-[var(--text2)]">
                    <Loader2 className="w-6 h-6 animate-spin mb-3 text-[var(--primary)]" />
                    <p className="text-sm">Cargando notas...</p>
                  </div>
                ) : notas.length === 0 ? (
                  <div className="text-center py-10 text-[var(--text2)]">
                    <StickyNote className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Sin notas registradas para este cliente.</p>
                  </div>
                ) : (
                  notas.map((n) => (
                    <div key={n.id} className="bg-[var(--field)] border border-[var(--border)] rounded-lg p-4">
                      <div className="flex justify-between items-start gap-3">
                        <p className="text-sm text-[var(--text)] flex-1 whitespace-pre-wrap">{n.nota}</p>
                        <button
                          onClick={() => borrarNota(n.id)}
                          disabled={notasGuardando}
                          className="p-1.5 text-[var(--text2)] hover:text-[var(--danger-deep)] hover:bg-[var(--danger-soft)] rounded-lg transition-colors flex-shrink-0"
                          title="Eliminar nota"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-[var(--muted)] mt-2">{formatDate(n.created_at)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
