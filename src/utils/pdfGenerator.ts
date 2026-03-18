import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Store, Sale } from '../types';
import { format } from 'date-fns';

export const generateReceiptPDF = (sale: Sale, store: Store | null) => {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 200] // Typical thermal printer width
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 10;

  // Header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(store?.name || 'LUDY soft', pageWidth / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  if (store?.receiptHeader) {
    const headerLines = doc.splitTextToSize(store.receiptHeader, 70);
    doc.text(headerLines, pageWidth / 2, y, { align: 'center' });
    y += (headerLines.length * 4);
  }

  y += 2;
  doc.setLineWidth(0.1);
  doc.line(5, y, 75, y);
  y += 5;

  // Sale Info
  doc.text(`Venda: #${sale.id.slice(-6).toUpperCase()}`, 5, y);
  y += 4;
  doc.text(`Data: ${format(new Date(sale.timestamp), 'dd/MM/yyyy HH:mm')}`, 5, y);
  y += 4;
  doc.text(`Metodo: ${sale.paymentMethod.toUpperCase()}`, 5, y);
  y += 6;

  // Items Table
  autoTable(doc, {
    startY: y,
    head: [['Item', 'Qtd', 'Preco', 'Total']],
    body: sale.items.map(item => [
      item.name,
      item.quantity,
      item.price.toLocaleString(),
      item.total.toLocaleString()
    ]),
    theme: 'plain',
    styles: { fontSize: 7, cellPadding: 1 },
    headStyles: { fontStyle: 'bold' },
    margin: { left: 5, right: 5 }
  });

  y = (doc as any).lastAutoTable.finalY + 5;

  // Total
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL: Kz ${sale.total.toLocaleString()}`, 75, y, { align: 'right' });
  y += 8;

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  if (store?.receiptFooter) {
    const footerLines = doc.splitTextToSize(store.receiptFooter, 70);
    doc.text(footerLines, pageWidth / 2, y, { align: 'center' });
    y += (footerLines.length * 4);
  }

  y += 4;
  doc.setFontSize(6);
  doc.text('Processado por LUDY soft', pageWidth / 2, y, { align: 'center' });

  doc.save(`recibo_${sale.id.slice(-6)}.pdf`);
};

export const generateInvoicePDF = (sale: Sale, store: Store | null) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Store Info (Top Left)
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(store?.name || 'LUDY soft', 20, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (store?.receiptHeader) {
    const headerLines = doc.splitTextToSize(store.receiptHeader, 80);
    doc.text(headerLines, 20, y);
    y += (headerLines.length * 5);
  }

  // Invoice Info (Top Right)
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FATURA / RECIBO', pageWidth - 20, 20, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nº: ${sale.id.slice(-8).toUpperCase()}`, pageWidth - 20, 30, { align: 'right' });
  doc.text(`Data: ${format(new Date(sale.timestamp), 'dd/MM/yyyy')}`, pageWidth - 20, 35, { align: 'right' });
  doc.text(`Pagamento: ${sale.paymentMethod.toUpperCase()}`, pageWidth - 20, 40, { align: 'right' });

  y = Math.max(y, 50);
  doc.line(20, y, pageWidth - 20, y);
  y += 15;

  // Items Table
  autoTable(doc, {
    startY: y,
    head: [['Descricao', 'Quantidade', 'Preco Unitario', 'Total']],
    body: sale.items.map(item => [
      item.name,
      item.quantity,
      `Kz ${item.price.toLocaleString()}`,
      `Kz ${item.total.toLocaleString()}`
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [185, 28, 28] } // Red-700
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Totals
  const totalX = pageWidth - 20;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Geral: Kz ${sale.total.toLocaleString()}`, totalX, y, { align: 'right' });
  
  y += 20;
  
  // Footer
  if (store?.receiptFooter) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    const footerLines = doc.splitTextToSize(store.receiptFooter, pageWidth - 40);
    doc.text(footerLines, 20, y);
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Este documento nao serve de fatura.', 20, doc.internal.pageSize.getHeight() - 10);

  doc.save(`fatura_${sale.id.slice(-6)}.pdf`);
};
