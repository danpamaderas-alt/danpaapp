import { jsPDF } from 'jspdf';
import type { ConfigEmpresa } from './configEmpresa';

const ARS = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0
  );

const GRIS_TEXTO: [number, number, number] = [130, 140, 150];
const AZUL_OSCURO: [number, number, number] = [22, 40, 57];

const fmtFechaCorta = (iso: string) => {
  if (!iso) return '';
  const d = iso.length === 10 ? new Date(iso + 'T12:00:00') : new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const slugArchivo = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase();

interface ItemPedido {
  cantidad: number;
  precio_unitario: number;
  productos: { nombre: string } | null;
}

interface PedidoParaPDF {
  id: string;
  created_at: string;
  total: number;
  descuento: number;
  estado: string;
  estado_pago: string;
  monto_pagado: number;
  notas: string | null;
  clientes: { nombre: string; telefono: string | null; direccion: string | null } | null;
  pedido_items: ItemPedido[];
  vendedor: { nombre: string } | null;
}

function dibujarHeader(doc: jsPDF, config: ConfigEmpresa, pageW: number, margin: number) {
  doc.setFillColor(AZUL_OSCURO[0], AZUL_OSCURO[1], AZUL_OSCURO[2]);
  doc.rect(0, 0, pageW, 28, 'F');

  let xTexto = margin;

  if (config.logo) {
    try {
      doc.addImage(config.logo, 'PNG', margin, 4, 24, 20);
      xTexto = margin + 28;
    } catch {
      // Si el logo falla,continuamos sin él
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(config.nombre.toUpperCase(), xTexto, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Venta de maderas · Poda de árboles', xTexto, 19);
}

function dibujarInfoEmisor(
  doc: jsPDF,
  config: ConfigEmpresa,
  margin: number,
  y: number,
  contentW: number
): number {
  doc.setFillColor(248, 249, 251);
  doc.roundedRect(margin, y - 3, contentW, 18, 2, 2, 'FD');
  doc.setDrawColor(220, 225, 230);
  doc.roundedRect(margin, y - 3, contentW, 18, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 110, 120);
  doc.text('EMISOR', margin + 4, y + 1);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);

  let lineaEmisor = config.nombre;
  if (config.cuit) lineaEmisor += ` · CUIT: ${config.cuit}`;
  if (config.direccion) lineaEmisor += ` · ${config.direccion}`;
  if (config.telefono) lineaEmisor += ` · Tel: ${config.telefono}`;
  if (config.email) lineaEmisor += ` · ${config.email}`;

  doc.text(lineaEmisor, margin + 4, y + 8);

  return y + 22;
}

function dibujarInfoCliente(
  doc: jsPDF,
  cliente: PedidoParaPDF['clientes'],
  margin: number,
  y: number,
  contentW: number
): number {
  doc.setFillColor(248, 249, 251);
  doc.roundedRect(margin, y - 3, contentW, 16, 2, 2, 'FD');
  doc.setDrawColor(220, 225, 230);
  doc.roundedRect(margin, y - 3, contentW, 16, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 110, 120);
  doc.text('CLIENTE', margin + 4, y + 1);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);

  const nombre = cliente?.nombre || 'Sin cliente';
  let lineaCliente = nombre;
  if (cliente?.telefono) lineaCliente += ` · Tel: ${cliente.telefono}`;
  if (cliente?.direccion) lineaCliente += ` · ${cliente.direccion}`;

  doc.text(lineaCliente, margin + 4, y + 8);

  return y + 20;
}

function dibujarTablaItems(
  doc: jsPDF,
  items: ItemPedido[],
  mostrarPrecios: boolean,
  margin: number,
  y: number,
  contentW: number,
  maxYPie: number
): number {
  const colCant = 18;
  const colDesc = mostrarPrecios ? contentW - colCant - 30 - 30 : contentW - colCant;
  const colPrecio = 30;
  const colTotal = 30;

  // Header de tabla
  doc.setFillColor(AZUL_OSCURO[0], AZUL_OSCURO[1], AZUL_OSCURO[2]);
  doc.roundedRect(margin, y, contentW, 8, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  doc.text('Cant.', margin + 4, y + 5.5);
  doc.text('Descripción', margin + colCant + 4, y + 5.5);

  if (mostrarPrecios) {
    doc.text('Precio', margin + colCant + colDesc + 4, y + 5.5, { align: 'right' });
    doc.text('Total', margin + colCant + colDesc + colPrecio + colTotal - 4, y + 5.5, { align: 'right' });
  }

  y += 10;

  // Filas
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);

  for (const item of items) {
    if (y + 7 > maxYPie) {
      doc.addPage();
      y = 20;
    }

    const nombre = item.productos?.nombre || 'Producto';
    const cantidad = item.cantidad;
    const precio = item.precio_unitario;
    const total = cantidad * precio;

    // Fila alternada
    if (items.indexOf(item) % 2 === 0) {
      doc.setFillColor(245, 247, 250);
      doc.rect(margin, y - 3, contentW, 7, 'F');
    }

    doc.text(String(cantidad), margin + 4, y + 2);
    doc.text(nombre, margin + colCant + 4, y + 2);

    if (mostrarPrecios) {
      doc.text(ARS(precio), margin + colCant + colDesc + 4, y + 2, { align: 'right' });
      doc.text(ARS(total), margin + colCant + colDesc + colPrecio + colTotal - 4, y + 2, { align: 'right' });
    }

    y += 7;
  }

  return y;
}

function dibujarTotales(
  doc: jsPDF,
  pedido: PedidoParaPDF,
  config: ConfigEmpresa,
  margin: number,
  y: number,
  contentW: number,
  mostrarIVA: boolean
): number {
  const subtotal = pedido.pedido_items.reduce((acc, it) => acc + it.cantidad * it.precio_unitario, 0);
  const descuento = pedido.descuento || 0;
  const baseImponible = subtotal - descuento;
  const montoIVA = mostrarIVA ? baseImponible * (config.iva / 100) : 0;
  const total = baseImponible + montoIVA;

  const colLabel = margin + contentW - 60;
  const colValue = margin + contentW - 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  doc.text('Subtotal:', colLabel, y);
  doc.text(ARS(subtotal), colValue, y, { align: 'right' });
  y += 6;

  if (mostrarIVA && config.iva > 0) {
    doc.text(`IVA (${config.iva}%):`, colLabel, y);
    doc.text(ARS(montoIVA), colValue, y, { align: 'right' });
    y += 6;
  }

  if (descuento > 0) {
    doc.text('Descuento:', colLabel, y);
    doc.text(`-${ARS(descuento)}`, colValue, y, { align: 'right' });
    y += 6;
  }

  // Línea separadora
  doc.setDrawColor(AZUL_OSCURO[0], AZUL_OSCURO[1], AZUL_OSCURO[2]);
  doc.setLineWidth(0.5);
  doc.line(colLabel, y - 2, colValue, y - 2);
  y += 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL:', colLabel, y);
  doc.text(ARS(total), colValue, y, { align: 'right' });
  y += 8;

  return y;
}

function dibujarEstadoPago(
  doc: jsPDF,
  pedido: PedidoParaPDF,
  margin: number,
  y: number,
  contentW: number
): number {
  doc.setFillColor(248, 249, 251);
  doc.roundedRect(margin, y - 3, contentW, 10, 2, 2, 'FD');
  doc.setDrawColor(220, 225, 230);
  doc.roundedRect(margin, y - 3, contentW, 10, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 110, 120);
  doc.text('ESTADO DE PAGO', margin + 4, y + 1);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  const estado = pedido.estado_pago === 'pagado' ? 'PAGADO' : 'PENDIENTE DE PAGO';
  doc.text(estado, margin + 4, y + 7);

  if (pedido.estado_pago === 'pagado' && pedido.monto_pagado > 0) {
    const colValue = margin + contentW - 4;
    doc.text(`Pagado: ${ARS(pedido.monto_pagado)}`, colValue, y + 7, { align: 'right' });
  }

  return y + 14;
}

function dibujarPie(
  doc: jsPDF,
  _pageW: number,
  margin: number,
  y: number,
  _config: ConfigEmpresa,
  _cliente: PedidoParaPDF['clientes'],
  esRemito: boolean
): number {
  if (esRemito) {
    // Línea de firma para remito
    y += 10;
    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.25);
    doc.line(margin, y, margin + 80, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(GRIS_TEXTO[0], GRIS_TEXTO[1], GRIS_TEXTO[2]);
    doc.text('Firma de recepción', margin, y);
    y += 8;
    doc.line(margin, y, margin + 80, y);
    y += 5;
    doc.text('Aclaración', margin, y);
  }

  return y;
}

function dibujarFooter(doc: jsPDF, pageW: number, config: ConfigEmpresa) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(GRIS_TEXTO[0], GRIS_TEXTO[1], GRIS_TEXTO[2]);
    doc.text(`${config.nombre} · Página ${i} de ${total}`, pageW / 2, 291, { align: 'center' });
  }
}

export function generarFacturaPDF(
  pedido: PedidoParaPDF,
  config: ConfigEmpresa
): void {
  const pageW = 210;
  const margin = 14;
  const contentW = pageW - margin * 2;
  const maxYPie = 275;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 38;

  doc.setProperties({
    title: `Factura - ${pedido.clientes?.nombre || 'Sin cliente'}`,
    subject: 'Factura de venta',
    author: config.nombre,
  });

  // Header
  dibujarHeader(doc, config, pageW, margin);

  // Número de factura y fecha
  doc.setFillColor(240, 242, 245);
  doc.roundedRect(pageW - margin - 42, 5, 42, 18, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(80, 90, 100);
  doc.text('FACTURA N°', pageW - margin - 21, 10, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(AZUL_OSCURO[0], AZUL_OSCURO[1], AZUL_OSCURO[2]);
  doc.text(pedido.id.slice(0, 8).toUpperCase(), pageW - margin - 21, 15.5, { align: 'center' });
  doc.setFontSize(7.5);
  doc.setTextColor(GRIS_TEXTO[0], GRIS_TEXTO[1], GRIS_TEXTO[2]);
  doc.text(fmtFechaCorta(pedido.created_at), pageW - margin - 21, 20, { align: 'center' });

  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(AZUL_OSCURO[0], AZUL_OSCURO[1], AZUL_OSCURO[2]);
  doc.text('FACTURA', pageW / 2, y, { align: 'center' });
  y += 10;

  // Info emisor
  y = dibujarInfoEmisor(doc, config, margin, y, contentW);

  // Info cliente
  y = dibujarInfoCliente(doc, pedido.clientes, margin, y, contentW);
  y += 4;

  // Tabla de items
  y = dibujarTablaItems(doc, pedido.pedido_items, true, margin, y, contentW, maxYPie);
  y += 4;

  // Totales con IVA
  y = dibujarTotales(doc, pedido, config, margin, y, contentW, true);

  // Estado de pago
  y = dibujarEstadoPago(doc, pedido, margin, y, contentW);

  // Notas
  if (pedido.notas) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 110, 120);
    doc.text('NOTAS', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    const lineas = doc.splitTextToSize(pedido.notas, contentW);
    for (const linea of lineas) {
      if (y > maxYPie) {
        doc.addPage();
        y = 20;
      }
      doc.text(linea, margin, y);
      y += 4;
    }
    y += 4;
  }

  // Vendedor
  if (pedido.vendedor?.nombre) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    doc.text(`Vendedor: ${pedido.vendedor.nombre}`, margin, y);
    y += 6;
  }

  // Footer
  dibujarFooter(doc, pageW, config);

  const nombreCliente = pedido.clientes?.nombre || 'sin_cliente';
  doc.save(`factura_${slugArchivo(nombreCliente)}_${pedido.id.slice(0, 8)}.pdf`);
}

export function generarRemitoPDF(
  pedido: PedidoParaPDF,
  config: ConfigEmpresa
): void {
  const pageW = 210;
  const margin = 14;
  const contentW = pageW - margin * 2;
  const maxYPie = 275;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 38;

  doc.setProperties({
    title: `Remito - ${pedido.clientes?.nombre || 'Sin cliente'}`,
    subject: 'Remito de entrega',
    author: config.nombre,
  });

  // Header
  dibujarHeader(doc, config, pageW, margin);

  // Número de remito y fecha
  doc.setFillColor(240, 242, 245);
  doc.roundedRect(pageW - margin - 42, 5, 42, 18, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(80, 90, 100);
  doc.text('REMITO N°', pageW - margin - 21, 10, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(AZUL_OSCURO[0], AZUL_OSCURO[1], AZUL_OSCURO[2]);
  doc.text(pedido.id.slice(0, 8).toUpperCase(), pageW - margin - 21, 15.5, { align: 'center' });
  doc.setFontSize(7.5);
  doc.setTextColor(GRIS_TEXTO[0], GRIS_TEXTO[1], GRIS_TEXTO[2]);
  doc.text(fmtFechaCorta(pedido.created_at), pageW - margin - 21, 20, { align: 'center' });

  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(AZUL_OSCURO[0], AZUL_OSCURO[1], AZUL_OSCURO[2]);
  doc.text('REMITO DE ENTREGA', pageW / 2, y, { align: 'center' });
  y += 10;

  // Info emisor
  y = dibujarInfoEmisor(doc, config, margin, y, contentW);

  // Info cliente
  y = dibujarInfoCliente(doc, pedido.clientes, margin, y, contentW);
  y += 4;

  // Tabla de items (sin precios)
  y = dibujarTablaItems(doc, pedido.pedido_items, false, margin, y, contentW, maxYPie);
  y += 10;

  // Firma de recepción
  dibujarPie(doc, pageW, margin, y, config, pedido.clientes, true);

  // Footer
  dibujarFooter(doc, pageW, config);

  const nombreCliente = pedido.clientes?.nombre || 'sin_cliente';
  doc.save(`remito_${slugArchivo(nombreCliente)}_${pedido.id.slice(0, 8)}.pdf`);
}
