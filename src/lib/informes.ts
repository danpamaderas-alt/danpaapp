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

export interface DatosInformeEscrito {
  rango: { desde: string; hasta: string; etiqueta: string };
  movimientos: Movimiento[];
  podas: Poda[];
  ingresos: number;
  egresos: number;
  saldo: number;
  desglose: { categoria: string; egreso: number; ingreso: number }[];
  podasPorTipo: { valor: string; etiqueta: string; trabajos: number; arboles: number }[];
  podasSinTipo: number;
  totalArboles: number;
}

const dineroTexto = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number.isFinite(n) ? n : 0);

const etiquetaCatTexto = (c: string) =>
  c.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

/** Genera un informe escrito en prosa (párrafos) resumiendo el mes. */
export function informeEscrito(d: DatosInformeEscrito): string[] {
  const parrafos: string[] = [];
  const nIng = d.movimientos.filter((m) => m.tipo === 'ingreso').length;
  const nEgr = d.movimientos.filter((m) => m.tipo === 'egreso').length;

  parrafos.push(
    `Informe mensual de ${d.rango.etiqueta}. Durante el período se registraron ${d.movimientos.length} movimientos financieros: ` +
      `${nIng} ingresos por un total de ${dineroTexto(d.ingresos)} y ${nEgr} egresos por ${dineroTexto(d.egresos)}. ` +
      `El saldo del mes fue ${d.saldo >= 0 ? 'positivo' : 'negativo'} en ${dineroTexto(Math.abs(d.saldo))}.`
  );

  const egresosCat = d.desglose
    .filter((x) => x.egreso > 0)
    .sort((a, b) => b.egreso - a.egreso);
  if (egresosCat.length > 0) {
    const top = egresosCat[0];
    const pct = d.egresos > 0 ? Math.round((top.egreso / d.egresos) * 100) : 0;
    let frase = `Los gastos se concentraron principalmente en ${etiquetaCatTexto(top.categoria)} con ${dineroTexto(top.egreso)} (${pct}% del total de egresos).`;
    if (egresosCat.length > 1) {
      const resto = egresosCat.slice(1, 3);
      frase += ` Le siguen ${resto.map((x) => `${etiquetaCatTexto(x.categoria)} (${dineroTexto(x.egreso)})`).join(' y ')}.`;
    }
    parrafos.push(frase);
  } else {
    parrafos.push('No se registraron egresos en el mes.');
  }

  if (d.podas.length > 0) {
    const conTipo = d.podasPorTipo.filter((t) => t.trabajos > 0).sort((a, b) => b.arboles - a.arboles);
    let frase = `En cuanto a podas, se realizaron ${d.podas.length} trabajos sobre ${d.totalArboles} árboles.`;
    if (conTipo.length > 0) {
      const topTipo = conTipo[0];
      frase += ` El tipo de poda más frecuente fue "${topTipo.etiqueta}" con ${topTipo.trabajos} trabajos y ${topTipo.arboles} árboles.`;
    }
    if (d.podasSinTipo > 0) {
      frase += ` Además hay ${d.podasSinTipo} trabajos con tipo sin especificar.`;
    }
    parrafos.push(frase);
  } else {
    parrafos.push('No se registraron trabajos de poda en el mes.');
  }

  if (d.saldo > 0) {
    parrafos.push(
      `Conclusión: el mes cerró con un resultado positivo de ${dineroTexto(d.saldo)}, lo que refleja una gestión financiera favorable.`
    );
  } else if (d.saldo < 0) {
    parrafos.push(
      `Conclusión: el mes cerró con un resultado negativo de ${dineroTexto(Math.abs(d.saldo))}. Se recomienda revisar los gastos y planificar los pagos de los próximos meses.`
    );
  } else {
    parrafos.push('Conclusión: el mes cerró con saldo neutro, sin diferencia entre ingresos y egresos.');
  }

  return parrafos;
}