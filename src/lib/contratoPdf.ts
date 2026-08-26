import { jsPDF } from 'jspdf';
import type { Contrato } from './contratos';

const ARS = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0
  );

const GRIS_TEXTO: [number, number, number] = [130, 140, 150];

const fmtFechaCorta = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

const slugArchivo = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase();

export function generarPDFContrato(contrato: Contrato, nombreEmisor?: string): void {
  const pageW = 210;
  const margin = 14;
  const contentW = pageW - margin * 2;
  const maxYPie = 275;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 38;

  const saltoSi = (necesita: number) => {
    if (y + necesita > maxYPie) {
      doc.addPage();
      y = 20;
    }
  };

  const tituloSeccion = (num: string, texto: string) => {
    saltoSi(10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(22, 40, 57);
    doc.text(`${num}. ${texto}`, margin, y);
    y += 6;
  };

  const textoBloque = (texto: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    const lineas = doc.splitTextToSize(texto, contentW);
    for (const linea of lineas) {
      saltoSi(5);
      doc.text(linea, margin, y);
      y += 4.2;
    }
  };

  const pintarPie = () => {
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(GRIS_TEXTO[0], GRIS_TEXTO[1], GRIS_TEXTO[2]);
      doc.text(`Servicios Integrales · Página ${i} de ${total}`, pageW / 2, 291, { align: 'center' });
    }
  };

  const etiquetaContraparte = contrato.tipo === 'cliente' ? 'Cliente' : 'Subcontratista';
  const tituloContrato =
    contrato.tipo === 'cliente'
      ? 'CONTRATO DE TRABAJO Y PRESTACIÓN DE SERVICIOS'
      : 'CONTRATO DE SUBCONTRATACIÓN DE SERVICIOS';

  const emisor = nombreEmisor || 'Servicios Integrales';
  const contraparte = contrato.contraparte || '—';
  const nroLabel = contrato.nro_contrato || fmtFechaCorta(contrato.fecha);

  doc.setProperties({
    title: `Contrato - ${contraparte}`,
    subject: tituloContrato,
    author: 'Servicios Integrales',
  });

  doc.setFillColor(22, 40, 57);
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('SERVICIOS INTEGRALES', margin, 12);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Venta de maderas · Poda de árboles', margin, 19);

  doc.setFillColor(240, 242, 245);
  doc.roundedRect(pageW - margin - 42, 5, 42, 18, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(80, 90, 100);
  doc.text('CONTRATO N°', pageW - margin - 21, 10, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(22, 40, 57);
  doc.text(nroLabel, pageW - margin - 21, 15.5, { align: 'center' });
  doc.setFontSize(7.5);
  doc.setTextColor(GRIS_TEXTO[0], GRIS_TEXTO[1], GRIS_TEXTO[2]);
  doc.text(fmtFechaCorta(contrato.fecha), pageW - margin - 21, 20, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(22, 40, 57);
  doc.text(tituloContrato, pageW / 2, y, { align: 'center' });
  y += 12;

  doc.setFillColor(248, 249, 251);
  doc.roundedRect(margin, y - 3, contentW, 20, 2, 2, 'FD');
  doc.setDrawColor(220, 225, 230);
  doc.roundedRect(margin, y - 3, contentW, 20, 2, 2, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 110, 120);
  doc.text('PARTES', margin + 4, y + 1);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text(`EMISOR: ${emisor}`, margin + 4, y + 7);
  doc.text(`${etiquetaContraparte.toUpperCase()}: ${contraparte}`, margin + 4, y + 13);
  y += 26;

  tituloSeccion('1', 'OBJETO');
  let textoObjeto = contrato.titulo;
  if (contrato.descripcion) textoObjeto += `. ${contrato.descripcion}`;
  if (contrato.lugar) textoObjeto += `. Lugar de ejecución: ${contrato.lugar}.`;
  textoBloque(textoObjeto);
  y += 4;

  tituloSeccion('2', 'PLAZO');
  let textoPlazo = `Fecha de inicio: ${fmtFechaCorta(contrato.fecha)}.`;
  if (contrato.fecha_fin) {
    textoPlazo += ` Fecha de finalización: ${fmtFechaCorta(contrato.fecha_fin)}.`;
  } else {
    textoPlazo += ' Sin fecha de finalización pactada.';
  }
  textoBloque(textoPlazo);
  y += 4;

  tituloSeccion('3', 'PRECIO Y FORMA DE PAGO');
  let textoMonto = `El precio total de la prestación es de ${ARS(contrato.monto)}.`;
  if (contrato.forma_pago) textoMonto += ` Forma de pago: ${contrato.forma_pago}.`;
  textoBloque(textoMonto);
  y += 4;

  let numAceptacion = '4';
  if (contrato.notas) {
    tituloSeccion('4', 'OBSERVACIONES');
    textoBloque(contrato.notas);
    y += 4;
    numAceptacion = '5';
  }

  tituloSeccion(numAceptacion, 'ACEPTACIÓN');
  textoBloque(
    'Ambas partes declaran estar conformes con las condiciones establecidas en el presente contrato y se obligan a su cumplimiento. El presente contrato queda firmado en el lugar y fecha indicados en el encabezado.'
  );
  y += 14;

  saltoSi(35);
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.25);
  const lw = 60;
  const x1 = margin;
  const x2 = pageW - margin - lw;
  doc.line(x1, y, x1 + lw, y);
  doc.line(x2, y, x2 + lw, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(GRIS_TEXTO[0], GRIS_TEXTO[1], GRIS_TEXTO[2]);
  doc.text(`Firma — ${emisor}`, x1, y);
  doc.text(`Firma — ${contraparte}`, x2, y);

  pintarPie();

  doc.save(`contrato_${slugArchivo(contrato.nro_contrato || contrato.titulo)}_${contrato.fecha}.pdf`);
}
