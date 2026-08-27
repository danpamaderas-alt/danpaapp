# SPEC: Generación de Facturas/Remitos para Pedidos

## Problem Statement

Como usuario de la app de Servicios Integrales, necesito poder generar facturas y remitos PDF para cada pedido, ya que actualmente solo los contratos generan documentos PDF. Los pedidos no tienen forma de generar comprobantes para enviar a los clientes.

## Solution

Agregar funcionalidad de generación de PDFs para pedidos, incluyendo:
- **Factura**: documento con datos del emisor, cliente, items, totales, datos de pago
- **Remito**: documento de entrega con items y cantidades
- Botón "Generar Factura" y "Generar Remito" en el detalle del pedido
- Opción de personalizar datos del emisor (nombre, CUIT, dirección)

## User Stories

1. As a usuario, I want to see a "Generar Factura" button in the order detail modal, so that I can create a PDF invoice for the client
2. As a usuario, I want to see a "Generar Remito" button in the order detail modal, so that I can create a delivery slip
3. As a usuario, I want the invoice PDF to include my company info (name, CUIT, address, phone), so that it looks professional
4. As a usuario, I want the invoice PDF to include client info (name, phone, address), so that the client knows who it's for
5. As a usuario, I want the invoice PDF to include all order items with quantities and prices, so that the client sees what they're paying for
6. As a usuario, I want the invoice PDF to include subtotal, discount, and total, so that the financial summary is clear
7. As a usuario, I want the invoice PDF to include payment status (pagado/pendiente), so that the client knows what they owe
8. As a usuario, I want the invoice PDF to include the order date and order number, so that it's traceable
9. As a usuario, I want the remito PDF to include item quantities (without prices), so that it's a delivery confirmation
10. As a usuario, I want to customize my company info before generating the PDF, so that it appears correctly on the document
11. As a usuario, I want the PDF to be branded with my company colors and logo style, so that it looks professional
12. As a usuario, I want the PDF to include a footer with page numbers, so that multi-page documents are organized
13. As a usuario, I want the PDF to be downloadable with a descriptive filename, so that I can find it later
14. As a usuario, I want the invoice to show the vendor/seller name if assigned, so that the client knows who handled their order
15. As a usuario, I want the invoice to include notes from the order, so that special conditions are documented
16. As a usuario, I want the remito to include a signature line for the client, so that delivery is confirmed
17. As a usuario, I want the invoice to include our company contact info, so that the client can reach us
18. As a usuario, I want the PDF generation to work offline (client-side), so that I don't need internet to create documents
19. As a usuario, I want the invoice number to be auto-generated from the order ID, so that it's unique
20. As a usuario, I want to see both buttons (Factura and Remito) in the order detail, so that I can choose which document to generate
21. As a usuario, I want to upload my company logo to appear on invoices, so that they look professional and branded
22. As a usuario, I want the invoice to calculate IVA automatically, so that tax information is included
23. As a usuario, I want to see the IVA breakdown (subtotal, IVA, total), so that the client understands the tax
24. As a usuario, I want to configure the IVA percentage (0%, 21%, 10.5%), so that it matches my tax regime
25. As a usuario, I want the logo to appear in the header next to the company name, so that the document is branded
26. As a usuario, I want to remove or change the logo later, so that I can update my branding
27. As a usuario, I want the IVA to be calculated before applying discounts, so that the tax base is correct

## Implementation Decisions

### Architecture
- **Client-side PDF generation** using jsPDF (already in the project)
- New file: `src/lib/facturaPdf.ts` - invoice/remito PDF generation logic
- Modify: `src/components/MisPedidos.tsx` - add buttons in order detail modal
- Modify: `src/components/Dashboard.tsx` - add buttons in order detail modal

### Data Sources
- **Pedido data**: from `PedidoConDetalles` type (already fetched in both components)
- **Company info**: stored in localStorage (user configures once)
- **No new database tables needed** - all data comes from existing pedidos + pedido_items + clientes

### PDF Structure - Factura
```
┌─────────────────────────────────────┐
│ [LOGO] SERVICIOS INTEGRALES         │
│ Venta de maderas · Poda de árboles  │
├─────────────────────────────────────┤
│ FACTURA N° [auto-generated]         │
│ Fecha: [order date]                 │
├─────────────────────────────────────┤
│ EMISOR: [company name]              │
│ CUIT: [company CUIT]                │
│ Dirección: [company address]        │
├─────────────────────────────────────┤
│ CLIENTE: [client name]              │
│ Teléfono: [client phone]            │
│ Dirección: [client address]         │
├─────────────────────────────────────┤
│ DETALLE:                            │
│ ┌─────┬────────────┬──────┬────────┐│
│ │ Cant│ Descripción│ Precio│ Total ││
│ ├─────┼────────────┼──────┼────────┤│
│ │  10 │ MADERITAS  │ $800 │ $8000 ││
│ └─────┴────────────┴──────┴────────┘│
│                      Subtotal: $8000│
│                      IVA (21%): $1680│
│                      Descuento: -$0 │
│                      TOTAL: $9680   │
├─────────────────────────────────────┤
│ Estado de pago: PAGADO / PENDIENTE  │
│ Notas: [order notes]                │
├─────────────────────────────────────┤
│ Vendedor: [vendor name]             │
├─────────────────────────────────────┤
│ Servicios Integrales · Página 1 de 1│
└─────────────────────────────────────┘
```

### PDF Structure - Remito
```
┌─────────────────────────────────────┐
│ SERVICIOS INTEGRALES                │
│ REMITO DE ENTREGA                   │
├─────────────────────────────────────┤
│ Remito N°: [auto-generated]         │
│ Fecha: [order date]                 │
├─────────────────────────────────────┤
│ CLIENTE: [client name]              │
│ Dirección: [client address]         │
├─────────────────────────────────────┤
│ DETALLE:                            │
│ ┌─────┬────────────┐                │
│ │ Cant│ Descripción│                │
│ ├─────┼────────────┤                │
│ │  10 │ MADERITAS  │                │
│ └─────┴────────────┘                │
├─────────────────────────────────────┤
│ Firma de recepción: _______________ │
│ Fecha de entrega: _________________ │
├─────────────────────────────────────┤
│ Servicios Integrales · Página 1 de 1│
└─────────────────────────────────────┘
```

### Company Config (localStorage)
```typescript
interface ConfigEmpresa {
  nombre: string;
  cuit: string;
  direccion: string;
  telefono: string;
  email: string;
  logo: string | null;  // base64 data URL o null
  iva: number;          // porcentaje IVA (ej: 21)
}
```

### IVA Calculation
- IVA se calcula sobre el subtotal (antes de descuento)
- Se muestra desglose: Subtotal → IVA (21%) → Total con IVA
- El descuento se aplica ANTES del IVA
- Fórmula: `total = (subtotal - descuento) * (1 + iva/100)`
- Si IVA = 0, no se muestra la línea de IVA

### Logo
- El usuario sube su logo (máximo 200KB, formatos: PNG, JPG, SVG)
- Se guarda como base64 data URL en localStorage
- Se muestra en el header del PDF, junto al nombre de la empresa
- Tamaño máximo en PDF: 30mm de ancho × 15mm de alto
- Si no hay logo, solo se muestra el nombre de la empresa

### UI Changes
- In `MisPedidos.tsx` order detail modal: add two buttons below the status section
- In `Dashboard.tsx` order detail modal: add two buttons below the status section
- Buttons styled consistently with existing UI (using CSS variables)
- Icons: `FileText` for factura, `Truck` for remito (from lucide-react)

## Testing Decisions

- **Manual testing**: generate PDF for a test order and verify all data appears correctly
- **Edge cases to test**:
  - Order with no client assigned
  - Order with discount
  - Order with many items (multi-page)
  - Order with notes
  - Order without vendor
  - Order with payment (pagado) vs pending (no_pagado)
- **No unit tests needed** for PDF generation (visual output)

## Out of Scope

- Email sending of invoices (future feature)
- Invoice numbering system (use order ID for now)
- Tax calculations (IVA, etc.) - use simple totals
- Multi-company support (single company config)
- Invoice templates/customization beyond company info
- Digital signatures
- Accounting integration

## Further Notes

- Follow the same PDF generation pattern as `contratoPdf.ts`
- Use the same color scheme (dark blue header: rgb(22, 40, 57))
- Use the same font (helvetica) and sizing conventions
- Include the same footer style as contracts
- The `generarPDFContrato` function can be used as reference for structure
