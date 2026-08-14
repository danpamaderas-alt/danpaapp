import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { informeEscrito, type DatosInformeEscrito } from './informes';

const ARS = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number.isFinite(n) ? n : 0);

const etiquetaCat = (c: string) =>
  c.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

const AZUL_OSCURO = [22, 40, 57] as const;

export function generarPDFInforme(d: DatosInformeEscrito): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 14;
  const pageW = 210;
  let y = 0;

  // Encabezado
  doc.setFillColor(AZUL_OSCURO[0], AZUL_OSCURO[1], AZUL_OSCURO[2]);
  doc.rect(0, 0, pageW, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DANPA MADERAS', margin, 12);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Informe mensual · ${d.rango.etiqueta}`, margin, 19);
  doc.setFontSize(8);
  doc.text(new Date().toLocaleDateString('es-AR'), pageW - margin, 19, { align: 'right' });

  y = 34;
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Resumen del mes', margin, y);
  y += 4;

  // KPIs como tarjetas
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

  // Informe escrito
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text('Informe escrito', margin, y);
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

  // Movimientos
  y += 4;
  if (y > 250) {
    doc.addPage();
    y = 15;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text('Movimientos del mes', margin, y);
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

  let finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 8;

  if (d.podas.length > 0) {
    const conTipo = d.podasPorTipo.filter((t) => t.trabajos > 0);
    if (finalY + 40 > 280) {
      doc.addPage();
      finalY = 15;
    } else {
      finalY += 6;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text('Podas por tipo', margin, finalY);
    finalY += 3;
    const rows = conTipo.map((t) => [t.etiqueta, String(t.trabajos), String(t.arboles)]);
    if (d.podasSinTipo > 0) {
      rows.push([`Sin especificar`, String(d.podasSinTipo), '']);
    }
    autoTable(doc, {
      startY: finalY,
      margin: { left: margin, right: margin },
      head: [['Tipo de poda', 'Trabajos', 'Árboles']],
      body: rows,
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
    doc.text(
      `DANPA MADERAS · Informe ${d.rango.etiqueta} · Página ${i} de ${total}`,
      pageW / 2,
      291,
      { align: 'center' }
    );
  }

  doc.save(`informe_${d.rango.desde}.pdf`);
}