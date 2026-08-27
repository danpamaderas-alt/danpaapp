const STORAGE_KEY = 'config_empresa';

export interface ConfigEmpresa {
  nombre: string;
  cuit: string;
  direccion: string;
  telefono: string;
  email: string;
  logo: string | null;
  iva: number;
}

const DEFAULT_CONFIG: ConfigEmpresa = {
  nombre: 'Servicios Integrales',
  cuit: '',
  direccion: '',
  telefono: '',
  email: '',
  logo: null,
  iva: 21,
};

export function getConfigEmpresa(): ConfigEmpresa {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfigEmpresa(config: ConfigEmpresa): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function resetConfigEmpresa(): void {
  localStorage.removeItem(STORAGE_KEY);
}
