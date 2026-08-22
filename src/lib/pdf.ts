import { informeEscrito, type DatosInformeEscrito } from './informes';
import type { TrabajoContratista, PagoContratista, EventoContratista } from './contratistas';

const ARS = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number.isFinite(n) ? n : 0);

const etiquetaCat = (c: string) =>
  c.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

const AZUL_OSCURO = [22, 40, 57] as const;

/** Secciones que puede incluir el informe (todas activas por defecto). */
export interface SeccionesInforme {
  resumen: boolean;
  escrito: boolean;
  finanzas: boolean;
  movimientos: boolean;
  podas: boolean;
}

export const TODAS_SECCIONES: SeccionesInforme = {
  resumen: true,
  escrito: true,
  finanzas: true,
  movimientos: true,
  podas: true,
};

export async function generarPDFInforme(d: DatosInformeEscrito, secciones: SeccionesInforme = TODAS_SECCIONES): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 14;
  const pageW = 210;
  let y = 0;

  // Encabezado (siempre presente)
  doc.setFillColor(AZUL_OSCURO[0], AZUL_OSCURO[1], AZUL_OSCURO[2]);
  doc.rect(0, 0, pageW, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Servicios Integrales', margin, 12);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Informe mensual · ${d.rango.etiqueta}`, margin, 19);
  doc.setFontSize(8);
  doc.text(new Date().toLocaleDateString('es-AR'), pageW - margin, 19, { align: 'right' });

  y = 34;

  const finalYTabla = () =>
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;

  const titulo = (texto: string, top: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text(texto, margin, top);
  };

  if (secciones.resumen) {
    titulo('Resumen del mes', y);
    y += 4;
    const kpis = [
      { label: 'Ingresos', value: ARS(d.ingresos), color: [34, 197, 94] },
      { label: 'Egresos', value: ARS(d.egresos), color: [239, 68, 68] },
      { label: 'Saldo', value: ARS(d.saldo), color: d.saldo >= 0 ? [34, 197, 94] : [239, 68, 68] },
      { label: 'Árboles podados', value: String(d.totalArboles), color: [59, 130, 246] },
    ];
    const cardW = (pageW - margin * 2 - 12) / 4;
    const cardH = 20;
    kpis.forEach((k, i) => {
      const x = margin + i * (cardW + 4);
      doc.setDrawColor(220, 225, 230);
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(x, y, cardW, cardH, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(110, 120, 130);
      doc.text(k.label.toUpperCase(), x + 4, y + 6.5);
      doc.setFontSize(10.5);
      doc.setTextColor(k.color[0], k.color[1], k.color[2]);
      doc.text(k.value, x + 4, y + 15);
    });
    y += cardH + 9;
  }

  if (secciones.escrito) {
    y += 4;
    if (y + 14 > 280) {
      doc.addPage();
      y = 15;
    }
    titulo('Informe escrito', y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    for (const p of informeEscrito(d)) {
      const lines = doc.splitTextToSize(p, pageW - margin * 2);
      const needed = lines.length * 4.4 + 2.5;
      if (y + needed > 280) {
        doc.addPage();
        y = 15;
      }
      doc.text(lines, margin, y);
      y += needed;
    }
  }

  if (secciones.finanzas) {
    y += 6;
    if (y + 14 > 280) {
      doc.addPage();
      y = 15;
    }
    titulo('Finanzas por categoría', y);
    y += 3;
    const filas = d.desglose
      .filter((x) => x.egreso > 0 || x.ingreso > 0)
      .map((x) => [etiquetaCat(x.categoria), ARS(x.egreso), ARS(x.ingreso)]);
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Categoría', 'Egresos', 'Ingresos']],
      body: filas.length === 0 ? [['—', 'Sin movimientos en el mes', '']] : filas,
      styles: { fontSize: 8.5, cellPadding: 2.2 },
      headStyles: { fillColor: [AZUL_OSCURO[0], AZUL_OSCURO[1], AZUL_OSCURO[2]], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 246, 248] },
    });
    y = finalYTabla() + 6;
  }

  if (secciones.movimientos) {
    y += 4;
    if (y + 14 > 280) {
      doc.addPage();
      y = 15;
    }
    titulo('Movimientos del mes', y);
    y += 3;
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Fecha', 'Concepto', 'Categoría', 'Monto']],
      body:
        d.movimientos.length === 0
          ? [['—', 'Sin movimientos en el mes', '', '']]
          : d.movimientos.map((m) => [
              m.fecha,
              m.concepto,
              etiquetaCat(m.categoria),
              `${m.tipo === 'ingreso' ? '+' : '-'}${ARS(m.monto)}`,
            ]),
      styles: { fontSize: 8.5, cellPadding: 2.2 },
      headStyles: { fillColor: [AZUL_OSCURO[0], AZUL_OSCURO[1], AZUL_OSCURO[2]], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 246, 248] },
    });
    y = finalYTabla();
  }

  if (secciones.podas && d.podas.length > 0) {
    y += 6;
    if (y + 14 > 280) {
      doc.addPage();
      y = 15;
    }
    titulo('Podas por tipo', y);
    y += 3;
    const conTipo = d.podasPorTipo.filter((t) => t.trabajos > 0).map((t) => [t.etiqueta, String(t.trabajos), String(t.arboles)]);
    if (d.podasSinTipo > 0) conTipo.push(['Sin especificar', String(d.podasSinTipo), '']);
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Tipo de poda', 'Trabajos', 'Árboles']],
      body: conTipo,
      styles: { fontSize: 8.5, cellPadding: 2.2 },
      headStyles: { fillColor: [AZUL_OSCURO[0], AZUL_OSCURO[1], AZUL_OSCURO[2]], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 246, 248] },
    });
  }

  // Pie de página con numeración
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Servicios Integrales · Informe ${d.rango.etiqueta} · Página ${i} de ${total}`, pageW / 2, 291, {
      align: 'center',
    });
  }

  doc.save(`informe_${d.rango.desde}.pdf`);
}

export interface DatosInformeContratistas {
  desde: string;
  hasta: string;
  nombreFiltro: string;
  trabajos: TrabajoContratista[];
  pagos: PagoContratista[];
  eventos: EventoContratista[];
  nombres: Record<string, string>;
}

const fmtFechaCorta = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

const slugArchivo = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase();

const TIPO_EVENTO_PDF: Record<string, string> = {
  creacion: 'Creación',
  edicion: 'Edición',
  pago: 'Pago',
  eliminado: 'Eliminación',
  nota: 'Nota',
};

const ESTADO_PDF_TRABAJO: Record<string, { etiqueta: string; color: [number, number, number] }> = {
  pendiente: { etiqueta: 'PENDIENTE', color: [239, 68, 68] },
  parcial: { etiqueta: 'PARCIAL', color: [59, 130, 246] },
  pagado: { etiqueta: 'PAGADO', color: [34, 197, 94] },
};

const GRIS_TEXTO: [number, number, number] = [150, 150, 150];
const GRIS_SUAVE: [number, number, number] = [110, 120, 130];

interface ColumnaPdf {
  header: string;
  ancho?: number | 'auto';
  alinear?: 'left' | 'center' | 'right';
}

interface CfgTabla {
  margin: number;
  startYRef: () => number;
  setY: (v: number) => void;
  nuevaPaginaFn: () => void;
  cols: ColumnaPdf[];
  body: string[][];
  foot?: string[][];
  idxEstado?: number;
  idxEstadoRaw?: (rowIndex: number) => string;
}

type DocPdf = import('jspdf').jsPDF;
type FnAutoTable = typeof import('jspdf-autotable').autoTable;

const AZUL_RGB = (): [number, number, number] => [AZUL_OSCURO[0], AZUL_OSCURO[1], AZUL_OSCURO[2]];

function dibujarTabla(doc: DocPdf, autoTable: FnAutoTable, cfg: CfgTabla): void {
  const startYBase = cfg.startYRef() + 2;
  let startY = startYBase;
  if (startY > 265) {
    cfg.nuevaPaginaFn();
    startY = 28;
  }

  const colStyles: Record<number, { cellWidth: number | 'auto'; halign?: 'left' | 'center' | 'right' }> = {};
  cfg.cols.forEach((c, i) => {
    colStyles[i] = { cellWidth: c.ancho ?? 'auto', ...(c.alinear ? { halign: c.alinear } : {}) };
  });
  const azul = AZUL_RGB();

  autoTable(doc, {
    startY,
    margin: { left: cfg.margin, right: cfg.margin, top: 24, bottom: 16 },
    head: [cfg.cols.map((c) => c.header)],
    body: cfg.body,
    foot: cfg.foot,
    styles: { fontSize: 8.5, cellPadding: 2.2 },
    headStyles: { fillColor: azul, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 246, 248] },
    footStyles: { fillColor: [237, 240, 243], textColor: azul, fontStyle: 'bold' },
    columnStyles: colStyles,
    didParseCell: (data) => {
      if (data.section !== 'body') return;
      if (cfg.idxEstado !== undefined && data.column.index === cfg.idxEstado) {
        const est = ESTADO_PDF_TRABAJO[String(data.cell.raw ?? '')];
        if (est) {
          data.cell.text = [];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 7.5;
          data.cell.styles.halign = 'center';
        }
        return;
      }
      const v = data.cell.raw;
      if (v === '' || v === null || v === undefined) {
        data.cell.text = ['—'];
        data.cell.styles.textColor = GRIS_TEXTO;
      }
    },
    didDrawCell: (data) => {
      if (data.section === 'foot') {
        doc.setDrawColor(azul[0], azul[1], azul[2]);
        doc.setLineWidth(0.2);
        doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
        return;
      }
      if (data.section !== 'body' || cfg.idxEstado === undefined || data.column.index !== cfg.idxEstado) return;
      const raw = cfg.idxEstadoRaw ? cfg.idxEstadoRaw(data.row.index) : String(data.cell.raw ?? '');
      const est = ESTADO_PDF_TRABAJO[raw];
      if (!est) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(GRIS_TEXTO[0], GRIS_TEXTO[1], GRIS_TEXTO[2]);
        doc.text('—', data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: 'center' });
        return;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      const anchoTexto = doc.getTextWidth(est.etiqueta);
      const cx = data.cell.x + data.cell.width / 2;
      const baseY = data.cell.y + data.cell.height / 2 + 1.2;
      doc.setFillColor(est.color[0], est.color[1], est.color[2]);
      doc.circle(cx - anchoTexto / 2 - 2.2, baseY - 0.9, 0.9, 'F');
      doc.setTextColor(est.color[0], est.color[1], est.color[2]);
      doc.text(est.etiqueta, cx - anchoTexto / 2 + 0.9, baseY);
    },
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY;
  cfg.setY(finalY + 6);
}

export async function generarPDFInformeContratistas(d: DatosInformeContratistas): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const margin = 14;
  const pageW = 210;
  const contentW = pageW - margin * 2;
  const unico = Boolean(d.nombreFiltro);
  const periodo = `${fmtFechaCorta(d.desde)} – ${fmtFechaCorta(d.hasta)}`;
  const hoyLabel = new Date().toLocaleDateString('es-AR');
  const nom = (id: string) => d.nombres[id] || '—';
  let y = 0;

  doc.setProperties({
    title: `Informe de subcontratados · ${periodo}`,
    subject: 'Informe de subcontratados',
    author: 'Servicios Integrales',
  });

  // Encabezado corporativo (página 1)
  doc.setFillColor(AZUL_OSCURO[0], AZUL_OSCURO[1], AZUL_OSCURO[2]);
  doc.rect(0, 0, pageW, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Servicios Integrales', margin, 12);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Informe de subcontratados${unico ? ` · ${d.nombreFiltro}` : ''}`, margin, 19);
  doc.setFontSize(8);
  doc.text(hoyLabel, pageW - margin, 19, { align: 'right' });

  y = 33;
  doc.setFontSize(8);
  doc.setTextColor(GRIS_SUAVE[0], GRIS_SUAVE[1], GRIS_SUAVE[2]);
  doc.text(`Período: ${periodo}  ·  Contratista: ${unico ? d.nombreFiltro : 'Todos los contratistas'}`, margin, y);
  y += 9;

  // Mini-encabezado para páginas 2+
  const conMiniHeader = new Set<number>();
  const pintaMiniHeader = () => {
    doc.setFillColor(AZUL_OSCURO[0], AZUL_OSCURO[1], AZUL_OSCURO[2]);
    doc.rect(0, 0, pageW, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Servicios Integrales', margin, 7.8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Informe de subcontratados · ${periodo}`, pageW - margin, 7.8, { align: 'right' });
  };
  const pintarPaginaNueva = () => {
    doc.addPage();
    conMiniHeader.add(doc.getNumberOfPages());
    pintaMiniHeader();
    y = 24;
  };
  const saltoSi = (necesita: number) => {
    if (y + necesita > 280) pintarPaginaNueva();
  };
  const tituloSeccion = (texto: string) => {
    saltoSi(14);
    doc.setFillColor(AZUL_OSCURO[0], AZUL_OSCURO[1], AZUL_OSCURO[2]);
    doc.rect(margin, y - 3, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text(texto, margin + 4.5, y);
    y += 7;
  };

  // ---------- KPIs (grilla 3+3) ----------
  const totalContratado = d.trabajos.reduce((a, t) => a + t.costo, 0);
  const totalPagado = d.pagos.reduce((a, p) => a + p.monto, 0);
  const saldoPendiente = Math.max(0, totalContratado - totalPagado);
  const totalArboles = d.trabajos.reduce((a, t) => a + (t.cantidad_arboles || 0), 0);

  const kpis: { label: string; valor: string; color: [number, number, number] }[] = [
    { label: 'Total contratado', valor: ARS(totalContratado), color: [59, 130, 246] },
    { label: 'Total pagado', valor: ARS(totalPagado), color: [34, 197, 94] },
    { label: 'Saldo pendiente', valor: ARS(saldoPendiente), color: saldoPendiente > 0 ? [239, 68, 68] : [34, 197, 94] },
    { label: 'Trabajos', valor: String(d.trabajos.length), color: [22, 40, 57] },
    { label: 'Pagos realizados', valor: String(d.pagos.length), color: [22, 40, 57] },
    { label: 'Árboles podados', valor: String(totalArboles), color: [22, 40, 57] },
  ];

  saltoSi(46);
  const cardW = (contentW - 6) / 3;
  const cardH = 16;
  kpis.forEach((k, i) => {
    const fila = Math.floor(i / 3);
    if (fila === 1 && i === 3) y += cardH + 3;
    const x = margin + (i % 3) * (cardW + 3);
    doc.setDrawColor(220, 225, 230);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(x, y, cardW, cardH, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(GRIS_SUAVE[0], GRIS_SUAVE[1], GRIS_SUAVE[2]);
    doc.text(k.label.toUpperCase(), x + 4, y + 6);
    let fs = 10.5;
    doc.setFontSize(fs);
    while (fs > 9 && doc.getTextWidth(k.valor) > cardW - 8) {
      fs -= 0.5;
      doc.setFontSize(fs);
    }
    doc.setTextColor(k.color[0], k.color[1], k.color[2]);
    doc.text(k.valor, x + 4, y + 12.5);
  });
  y += cardH + 9;

  // ---------- Resumen ejecutivo en tarjeta ----------
  tituloSeccion('Resumen del período');
  const prosa = resumenProsaContratistas(d, nom, totalContratado, totalPagado, saldoPendiente, totalArboles);
  const lineasProsa = doc.splitTextToSize(prosa, contentW - 8);
  const altoCard = lineasProsa.length * 4.3 + 9;
  if (y + altoCard > 280) pintarPaginaNueva();
  doc.setDrawColor(220, 225, 230);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(margin, y, contentW, altoCard, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(lineasProsa, margin + 4, y + 7);
  y += altoCard + 7;

  // ---------- Resumen por contratista ----------
  const porContratista = new Map<string, { contratado: number; pagado: number; trabajos: number; pagos: number; arboles: number }>();
  for (const t of d.trabajos) {
    const r = porContratista.get(t.contratista_id) || { contratado: 0, pagado: 0, trabajos: 0, pagos: 0, arboles: 0 };
    r.contratado += t.costo;
    r.trabajos += 1;
    r.arboles += t.cantidad_arboles || 0;
    porContratista.set(t.contratista_id, r);
  }
  for (const p of d.pagos) {
    const r = porContratista.get(p.contratista_id) || { contratado: 0, pagado: 0, trabajos: 0, pagos: 0, arboles: 0 };
    r.pagado += p.monto;
    r.pagos += 1;
    porContratista.set(p.contratista_id, r);
  }
  const filasResumen = [...porContratista.entries()]
    .map(([id, r]) => ({
      id,
      nombre: nom(id),
      ...r,
      pendiente: Math.max(0, r.contratado - r.pagado),
    }))
    .sort((a, b) => b.pagado - a.pagado || a.nombre.localeCompare(b.nombre));

  if (filasResumen.length > 0) {
    tituloSeccion('Resumen por contratista');
    const cols: ColumnaPdf[] = [
      { header: 'Contratista', ancho: 48 },
      { header: 'Trabajos', ancho: 15, alinear: 'center' },
      { header: 'Pagos', ancho: 15, alinear: 'center' },
      { header: 'Árboles', ancho: 18, alinear: 'center' },
      { header: 'Contratado', ancho: 28, alinear: 'right' },
      { header: 'Pagado', ancho: 28, alinear: 'right' },
      { header: 'Pendiente', ancho: 30, alinear: 'right' },
    ];
    const body = filasResumen.map((r) => [
      r.nombre,
      String(r.trabajos),
      String(r.pagos),
      r.arboles ? String(r.arboles) : '',
      ARS(r.contratado),
      ARS(r.pagado),
      ARS(r.pendiente),
    ]);
    const foot = [
      [
        'TOTAL',
        String(filasResumen.reduce((a, r) => a + r.trabajos, 0)),
        String(filasResumen.reduce((a, r) => a + r.pagos, 0)),
        String(filasResumen.reduce((a, r) => a + r.arboles, 0)),
        ARS(filasResumen.reduce((a, r) => a + r.contratado, 0)),
        ARS(filasResumen.reduce((a, r) => a + r.pagado, 0)),
        ARS(filasResumen.reduce((a, r) => a + r.pendiente, 0)),
      ],
    ];
    dibujarTabla(doc, autoTable, {
      margin,
      startYRef: () => y,
      setY: (v: number) => {
        y = v;
      },
      nuevaPaginaFn: pintarPaginaNueva,
      cols,
      body,
      foot,
    });
  }

  // ---------- Detalle de trabajos ----------
  if (d.trabajos.length > 0) {
    tituloSeccion(`Detalle de trabajos (${d.trabajos.length})`);
    const hayArboles = d.trabajos.some((t) => t.cantidad_arboles !== null && t.cantidad_arboles !== undefined);
    const hayFechaPago = d.trabajos.some((t) => t.estado !== 'pendiente');

    const cols: ColumnaPdf[] = [{ header: 'Fecha', ancho: 17 }];
    if (!unico) cols.push({ header: 'Contratista', ancho: 30 });
    cols.push({ header: 'Descripción', ancho: 'auto' });
    cols.push({ header: 'Lugar', ancho: 24 });
    cols.push({ header: 'Contrato', ancho: 16 });
    cols.push({ header: 'Remito', ancho: 16 });
    if (hayArboles) cols.push({ header: 'Árboles', ancho: 13, alinear: 'center' });
    cols.push({ header: 'Costo', ancho: 22, alinear: 'right' });
    cols.push({ header: 'Estado', ancho: 20, alinear: 'center' });
    if (hayFechaPago) cols.push({ header: 'Fecha pago', ancho: 17 });

    const idxEstado = cols.findIndex((c) => c.header === 'Estado');
    const idxArboles = cols.findIndex((c) => c.header === 'Árboles');
    const idxCosto = cols.findIndex((c) => c.header === 'Costo');

    const body = d.trabajos.map((t) => {
      const valores: Record<string, string> = {
        Fecha: t.fecha,
        Contratista: nom(t.contratista_id),
        Descripción: t.descripcion,
        Lugar: t.lugar || '',
        Contrato: t.nro_contrato || '',
        Remito: t.nro_remito || '',
        Árboles: t.cantidad_arboles ? String(t.cantidad_arboles) : '',
        Costo: ARS(t.costo),
        Estado: t.estado,
        'Fecha pago': t.fecha_pago ? fmtFechaCorta(t.fecha_pago) : '',
      };
      return cols.map((c) => valores[c.header] ?? '');
    });
    const foot = [
      cols.map((_c, i) => {
        if (i === 0) return 'TOTAL';
        if (i === idxArboles) return String(totalArboles);
        if (i === idxCosto) return ARS(totalContratado);
        return '';
      }),
    ];
    dibujarTabla(doc, autoTable, {
      margin,
      startYRef: () => y,
      setY: (v: number) => {
        y = v;
      },
      nuevaPaginaFn: pintarPaginaNueva,
      cols,
      body,
      foot,
      idxEstado,
      idxEstadoRaw: (rowIndex: number) => d.trabajos[rowIndex]?.estado || '',
    });
  }

  // ---------- Detalle de pagos ----------
  if (d.pagos.length > 0) {
    tituloSeccion(`Detalle de pagos (${d.pagos.length})`);
    const hayNotas = d.pagos.some((p) => p.notas);
    const trabajoPorId = new Map(d.trabajos.map((t) => [t.id, t]));

    const cols: ColumnaPdf[] = [{ header: 'Fecha', ancho: 17 }];
    if (!unico) cols.push({ header: 'Contratista', ancho: 28 });
    cols.push({ header: 'Trabajo asociado', ancho: 'auto' });
    cols.push({ header: 'Medio de pago', ancho: 26 });
    if (hayNotas) cols.push({ header: 'Notas', ancho: 28 });
    cols.push({ header: 'Monto', ancho: 24, alinear: 'right' });

    const body = d.pagos.map((p) => {
      const tr = trabajoPorId.get(p.trabajo_id);
      const trabajo = tr ? tr.descripcion + (tr.nro_remito ? ` · Remito ${tr.nro_remito}` : '') : '—';
      const valores: Record<string, string> = {
        Fecha: p.fecha,
        Contratista: nom(p.contratista_id),
        'Trabajo asociado': trabajo,
        'Medio de pago': p.metodo || '',
        Notas: p.notas || '',
        Monto: ARS(p.monto),
      };
      return cols.map((c) => valores[c.header] ?? '');
    });
    const foot = [
      cols.map((c, i) => (i === 0 ? 'TOTAL' : c.header === 'Monto' ? ARS(totalPagado) : '')),
    ];
    dibujarTabla(doc, autoTable, {
      margin,
      startYRef: () => y,
      setY: (v: number) => {
        y = v;
      },
      nuevaPaginaFn: pintarPaginaNueva,
      cols,
      body,
      foot,
    });
  }

  // ---------- Historial de eventos (solo modo un contratista) ----------
  if (unico && d.eventos.length > 0) {
    tituloSeccion(`Historial de eventos (${d.eventos.length})`);
    const cols: ColumnaPdf[] = [
      { header: 'Fecha', ancho: 17 },
      { header: 'Tipo', ancho: 22 },
      { header: 'Descripción', ancho: 'auto' },
      { header: 'Monto', ancho: 24, alinear: 'right' },
    ];
    const body = d.eventos.map((e) => [
      e.fecha,
      TIPO_EVENTO_PDF[e.tipo] || e.tipo,
      e.descripcion,
      e.monto !== null && e.monto !== undefined ? ARS(e.monto) : '',
    ]);
    dibujarTabla(doc, autoTable, {
      margin,
      startYRef: () => y,
      setY: (v: number) => {
        y = v;
      },
      nuevaPaginaFn: pintarPaginaNueva,
      cols,
      body,
    });
  }

  // ---------- Cierre ----------
  saltoSi(14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(GRIS_TEXTO[0], GRIS_TEXTO[1], GRIS_TEXTO[2]);
  doc.text(`Emitido el ${hoyLabel} · Generado por Servicios Integrales`, margin, y + 2);
  y += 12;

  // Conformidad / firma solo en informe de un contratista
  if (unico) {
    saltoSi(56);
    tituloSeccion('Conformidad del período');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const intro = doc.splitTextToSize(
      `Quien suscribe declara conformidad con los trabajos contratados y los pagos recibidos detallados en este informe correspondientes al período ${periodo}.`,
      contentW
    );
    doc.text(intro, margin, y);
    y += intro.length * 4.4 + 10;
    const lw = 55;
    const x2 = margin + lw + 18;
    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.25);
    doc.line(margin, y, margin + lw, y);
    doc.line(x2, y, x2 + lw, y);
    doc.setFontSize(7.5);
    doc.setTextColor(GRIS_SUAVE[0], GRIS_SUAVE[1], GRIS_SUAVE[2]);
    doc.text('Firma y aclaración — Servicios Integrales', margin, y + 5);
    doc.text(`Firma y aclaración — ${d.nombreFiltro}`, x2, y + 5);
  }

  // Pie de página: mini-headers faltantes + numeración
  const totalPaginas = doc.getNumberOfPages();
  for (let i = 2; i <= totalPaginas; i++) {
    if (!conMiniHeader.has(i)) {
      doc.setPage(i);
      pintaMiniHeader();
    }
  }
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(GRIS_TEXTO[0], GRIS_TEXTO[1], GRIS_TEXTO[2]);
    doc.text(`Servicios Integrales · Informe de subcontratados · Página ${i} de ${totalPaginas}`, pageW / 2, 291, {
      align: 'center',
    });
  }

  const sufijo = unico ? `_${slugArchivo(d.nombreFiltro)}` : '';
  doc.save(`informe_subcontratados${sufijo}_${d.desde}_${d.hasta}.pdf`);
}

function resumenProsaContratistas(
  d: DatosInformeContratistas,
  nombreDeFn: (id: string) => string,
  totalContratado: number,
  totalPagado: number,
  saldoPendiente: number,
  totalArboles: number
): string {
  const { trabajos: trabajosFiltrados, pagos: pagosFiltrados, eventos: eventosFiltrados } = d;
  const filtroContratista = d.nombreFiltro;
  const dinero = ARS;
  if (!trabajosFiltrados.length && !pagosFiltrados.length) {
    return `No se registraron trabajos ni pagos de subcontratados en el período seleccionado${
      filtroContratista ? ` para ${filtroContratista}` : ''
    }.`;
  }
  let texto = '';
  if (trabajosFiltrados.length > 0) {
    texto += `En el período se contrataron ${trabajosFiltrados.length} ${
      trabajosFiltrados.length === 1 ? 'trabajo' : 'trabajos'
    } por un total de ${dinero(totalContratado)}`;
    const parciales = trabajosFiltrados.filter((t) => t.estado === 'parcial').length;
    if (parciales > 0) texto += `, de los cuales ${parciales} tienen pagos parciales`;
    texto += '. ';
    if (totalArboles > 0) {
      texto += `En total se podaron ${totalArboles} ${totalArboles === 1 ? 'árbol' : 'árboles'}`;
      const porContratista = new Map<string, number>();
      for (const t of trabajosFiltrados) {
        if (!t.cantidad_arboles) continue;
        porContratista.set(t.contratista_id, (porContratista.get(t.contratista_id) || 0) + t.cantidad_arboles);
      }
      const ranking = [...porContratista.entries()].sort((a, b) => b[1] - a[1]);
      if (ranking.length > 0) {
        texto += `, destacándose ${nombreDeFn(ranking[0][0])} con ${ranking[0][1]}`;
        if (ranking.length > 1) {
          const resto = ranking.slice(1, 4).map(([id, cant]) => `${nombreDeFn(id)} (${cant})`);
          texto += `, seguido de ${resto.join(', ')}`;
        }
      }
      texto += '. ';
    }
  }
  if (pagosFiltrados.length > 0) {
    texto += `Se efectuaron ${pagosFiltrados.length} ${pagosFiltrados.length === 1 ? 'pago' : 'pagos'} por ${dinero(totalPagado)}`;
    const porContratista = new Map<string, number>();
    for (const p of pagosFiltrados) porContratista.set(p.contratista_id, (porContratista.get(p.contratista_id) || 0) + p.monto);
    const ranking = [...porContratista.entries()].sort((a, b) => b[1] - a[1]);
    texto += `. Quien más cobró fue ${nombreDeFn(ranking[0][0])} con ${dinero(ranking[0][1])}`;
    if (ranking.length > 1) {
      const resto = ranking.slice(1, 4).map(([id, monto]) => `${nombreDeFn(id)} (${dinero(monto)})`);
      texto += `, seguido de ${resto.join(', ')}`;
    }
    texto += '.';
  }
  if (saldoPendiente > 0) texto += ` Quedan ${dinero(saldoPendiente)} pendientes de pago.`;
  else if (trabajosFiltrados.length > 0) texto += ' No quedan saldos pendientes de pago.';
  if (eventosFiltrados.length > 0) texto += ` Se registraron ${eventosFiltrados.length} eventos en el historial.`;
  return texto;
}
