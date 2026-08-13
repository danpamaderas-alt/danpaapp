import type { Movimiento } from './finanzas';
import type { Poda } from './podas';

export function rangoDeMes(mes: string): { desde: string; hasta: string; etiqueta: string } {
  const [year, month] = mes.split('-').map(Number);
  const ultimoDia = new Date(year, month, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    desde: `${year}-${pad(month)}-01`,
    hasta: `${year}-${pad(month)}-${pad(ultimoDia)}`,
    etiqueta: new Date(year, month - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }),
  };
}

const escapar = (v: unknown): string => {
  const s = String(v ?? '');
  return `"${s.replace(/"/g, '""')}"`;
};

export function movimientosCSV(lista: Movimiento[]): string {
  const header = ['Fecha', 'Tipo', 'Concepto', 'Categoría', 'Monto', 'Quién pagó', 'Cuenta', 'Factura'];
  const filas = lista.map((m) => [
    m.fecha,
    m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso',
    m.concepto,
    m.categoria,
    m.monto,
    m.pagador || '',
    m.cuenta || '',
    m.tiene_factura ? (m.nro_factura || 'Sí') : 'No',
  ]);
  return [header, ...filas].map((f) => f.map(escapar).join(';')).join('\n');
}

export function podasCSV(lista: Poda[]): string {
  const header = ['Fecha', 'Cantidad de árboles', 'Tipo de árbol', 'Tipo de poda', 'Qué se realizó', 'Lugar'];
  const filas = lista.map((p) => [
    p.fecha,
    p.cantidad_arboles,
    p.tipo_arbol || '',
    p.tipo_poda || '',
    p.detalle,
    p.lugar || '',
  ]);
  return [header, ...filas].map((f) => f.map(escapar).join(';')).join('\n');
}

export function descargarTexto(nombre: string, contenido: string, tipo: string): void {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}