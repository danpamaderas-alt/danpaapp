import { jsPDF } from 'jspdf';
import type { Recibo } from './recibos';

export function generarPDFRecibo(recibo: Recibo, nombreEmisor?: string): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const M = 14;
  const contentW = W - M * 2;
  const emisor = nombreEmisor || 'Servicios Integrales';
  const fmt = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });
  let y = 42;

  function saltoSi(necesita: number): void {
    if (y + necesita > 275) {
      doc.addPage();
      y = 20;
    }
  }

  function tituloSeccion(num: number, texto: string): void {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 40, 57);
    doc.text(`${num}. ${texto}`, M, y);
    y += 6;
  }

  function textoBloque(texto: string): void {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const lineas = doc.splitTextToSize(texto, contentW);
    doc.text(lineas, M, y);
    y += lineas.length * 4.2;
  }

  function pintarPie(): void {
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      doc.text(`Servicios Integrales · Página ${i} de ${total}`, W / 2, 291, {
        align: 'center',
      });
    }
  }

  doc.setFillColor(22, 40, 57);
  doc.rect(0, 0, W, 28, 'F');

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('SERVICIOS INTEGRALES', M, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Venta de maderas · Poda de árboles', M, 19);

  const boxW = 42;
  const boxX = W - M - boxW;
  doc.setFillColor(230, 230, 230);
  doc.roundedRect(boxX, 2, boxW, 24, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('RECIBO N°', boxX + 3, 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(recibo.nro_recibo || recibo.fecha, boxX + 3, 13);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(recibo.fecha, boxX + 3, 19);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 40, 57);
  doc.text('RECIBO DE PAGO', W / 2, 35, { align: 'center' });

  const infoItems = [
    `EMISOR: ${emisor}`,
    `CLIENTE: ${recibo.cliente_nombre}`,
  ];
  if (recibo.cliente_cuit) infoItems.push(`CUIT: ${recibo.cliente_cuit}`);
  if (recibo.cliente_domicilio) infoItems.push(`DOMICILIO: ${recibo.cliente_domicilio}`);

  const infoH = 6 + infoItems.length * 5;
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(M, y, contentW, infoH, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 40, 57);
  doc.text('RECIBO', M + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  let infoY = y + 10;
  for (const item of infoItems) {
    doc.text(item, M + 3, infoY);
    infoY += 5;
  }
  y = infoY + 4;

  let sec = 1;

  tituloSeccion(sec++, 'CONCEPTO');
  textoBloque(recibo.concepto);
  y += 2;

  saltoSi(14);
  tituloSeccion(sec++, 'MONTO');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 40, 57);
  doc.text(fmt.format(recibo.monto), M, y);
  y += 8;

  if (recibo.forma_pago) {
    saltoSi(12);
    tituloSeccion(sec++, 'FORMA DE PAGO');
    textoBloque(recibo.forma_pago);
    y += 2;
  }

  if (recibo.notas) {
    saltoSi(14);
    tituloSeccion(sec++, 'OBSERVACIONES');
    textoBloque(recibo.notas);
  }

  y = Math.max(y + 15, 240);
  saltoSi(30);
  const sigY = y + 20;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.line(M, sigY, M + 65, sigY);
  doc.line(W - M - 65, sigY, W - M, sigY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Firma — ${emisor}`, M, sigY + 4);
  doc.text(`Firma — ${recibo.cliente_nombre}`, W - M, sigY + 4, { align: 'right' });

  pintarPie();

  const safeName = (recibo.nro_recibo || recibo.cliente_nombre || 'recibo')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 40);
  doc.save(`recibo_${safeName}_${recibo.fecha}.pdf`);
}
