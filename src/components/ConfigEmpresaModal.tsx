import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { Modal } from './Modal';
import { getConfigEmpresa, saveConfigEmpresa, type ConfigEmpresa } from '../lib/configEmpresa';
import { Settings, Upload, X } from 'lucide-react';

interface ConfigEmpresaModalProps {
  onClose: () => void;
  onSaved?: () => void;
}

const IVA_OPTIONS = [
  { value: 0, label: 'Sin IVA (0%)' },
  { value: 10.5, label: 'IVA 10.5%' },
  { value: 21, label: 'IVA 21%' },
];

export default function ConfigEmpresaModal({ onClose, onSaved }: ConfigEmpresaModalProps) {
  const [config, setConfig] = useState<ConfigEmpresa>(getConfigEmpresa);
  const [logoPreview, setLogoPreview] = useState<string | null>(config.logo);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setConfig(getConfigEmpresa());
    setLogoPreview(getConfigEmpresa().logo);
  }, []);

  const handleChange = (field: keyof ConfigEmpresa, value: string | number | null) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 200 * 1024) {
      alert('El logo debe pesar menos de 200KB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setLogoPreview(dataUrl);
      handleChange('logo', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    handleChange('logo', null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = () => {
    saveConfigEmpresa(config);
    onSaved?.();
    onClose();
  };

  return (
    <Modal title="Configuración de Empresa" onClose={onClose}>
      <div className="bg-[var(--surface)] rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="text-lg font-semibold text-[var(--text)]">Configuración de Empresa</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[var(--gray-soft)] rounded-lg transition-colors">
            <X className="w-5 h-5 text-[var(--text2)]" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-[var(--text2)] mb-2">Logo de Empresa</label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="relative">
                  <img src={logoPreview} alt="Logo" className="h-16 w-auto object-contain border border-[var(--border)] rounded-lg p-2" />
                  <button
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-[var(--danger)] text-white rounded-full flex items-center justify-center text-xs hover:bg-[var(--danger-deep)]"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="h-16 w-32 border-2 border-dashed border-[var(--border)] rounded-lg flex items-center justify-center text-[var(--text2)] text-xs">
                  Sin logo
                </div>
              )}
              <label className="cursor-pointer">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-2 px-3 py-2 bg-[var(--gray-soft)] hover:bg-[var(--border)] rounded-lg text-sm text-[var(--text2)] transition-colors">
                  <Upload className="w-4 h-4" />
                  Subir logo
                </div>
              </label>
            </div>
            <p className="text-xs text-[var(--text2)] mt-1">PNG, JPG o SVG. Máximo 200KB.</p>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-[var(--text2)] mb-1">Nombre de Empresa</label>
            <input
              type="text"
              value={config.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
              placeholder="Servicios Integrales"
            />
          </div>

          {/* CUIT */}
          <div>
            <label className="block text-sm font-medium text-[var(--text2)] mb-1">CUIT</label>
            <input
              type="text"
              value={config.cuit}
              onChange={(e) => handleChange('cuit', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
              placeholder="20-12345678-9"
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-[var(--text2)] mb-1">Dirección</label>
            <input
              type="text"
              value={config.direccion}
              onChange={(e) => handleChange('direccion', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
              placeholder="Av. Principal 1234"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-[var(--text2)] mb-1">Teléfono</label>
            <input
              type="text"
              value={config.telefono}
              onChange={(e) => handleChange('telefono', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
              placeholder="11-1234-5678"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[var(--text2)] mb-1">Email</label>
            <input
              type="email"
              value={config.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
              placeholder="empresa@email.com"
            />
          </div>

          {/* IVA */}
          <div>
            <label className="block text-sm font-medium text-[var(--text2)] mb-1">Porcentaje IVA</label>
            <select
              value={config.iva}
              onChange={(e) => handleChange('iva', Number(e.target.value))}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
            >
              {IVA_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--text2)] bg-[var(--gray-soft)] hover:bg-[var(--border)] rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-deep)] rounded-lg transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  );
}
