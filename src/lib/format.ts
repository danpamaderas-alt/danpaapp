export const dinero = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number.isFinite(n) ? n : 0);

const esSoloFecha = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

/** Parsea una fecha "YYYY-MM-DD" como fecha local (evita corrimientos por zona horaria). */
export const parseDateOnly = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Devuelve un Date como "YYYY-MM-DD" en hora local. */
export const claveFecha = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const formatDate = (d: string) => {
  const fecha = esSoloFecha(d) ? parseDateOnly(d) : new Date(d);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const hoyISO = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const getErrorMessage = (err: unknown, fallback = 'Ocurrió un error inesperado.'): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
};
