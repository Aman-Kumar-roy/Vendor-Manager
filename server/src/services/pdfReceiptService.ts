import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';

export interface ReceiptDataInput {
  _id?: any;
  id?: string;
  type: string;
  amount: number;
  date?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  note?: string | null;
  tankItems?: Array<{
    size: 500 | 1000;
    quantity: number;
    layers: number;
    foam?: 'none' | 'single' | 'double';
  }>;
  tank500?: number;
  tank1000?: number;
  tank500_layers?: number | null;
  tank1000_layers?: number | null;
  tank1000_foam?: 'none' | 'single' | 'double' | null;
  previousDues?: number;
  currentDues?: number;
  vehicleNumber?: string | null;
  paymentMode?: string | null;
  parentDelivery?: {
    id?: string;
    date?: string | Date;
  } | null;
}

export interface SellerDataInput {
  _id?: any;
  id?: string;
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  gstNumber?: string | null;
}

export class PdfReceiptService {
  /**
   * Resolve logo file path across various runtime environments (local, dist, container)
   */
  private static getLogoPath(): string | null {
    const candidates = [
      path.resolve(__dirname, '../../assets/logo.jpg'),
      path.resolve(__dirname, '../assets/logo.jpg'),
      path.resolve(process.cwd(), 'server/assets/logo.jpg'),
      path.resolve(process.cwd(), 'assets/logo.jpg'),
      path.resolve(process.cwd(), 'client/dist/logo.jpg'),
      path.resolve(process.cwd(), 'client/public/logo.jpg'),
      path.resolve(process.cwd(), 'app/assets/logo.jpg'),
      path.resolve(__dirname, '../../client/dist/logo.jpg'),
      path.resolve(__dirname, '../../../client/dist/logo.jpg'),
      path.resolve(__dirname, '../../../client/public/logo.jpg'),
      path.resolve(__dirname, '../../../app/assets/logo.jpg'),
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  }

  private static formatDate(d?: string | Date | null): string {
    if (!d) return 'N/A';
    try {
      const dateObj = new Date(d);
      return dateObj.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return String(d);
    }
  }

  private static formatDateTime(d?: string | Date | null): string {
    if (!d) return '';
    try {
      const dateObj = new Date(d);
      return dateObj.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(d);
    }
  }

  private static formatCurrency(val: number = 0): string {
    const num = Math.abs(Number(val || 0));
    return 'Rs. ' + num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /**
   * Generate canonical receipt PDF buffer
   */
  public static async generateReceiptPdf(
    transaction: ReceiptDataInput,
    seller?: SellerDataInput | null,
    includeDues: boolean = true
  ): Promise<Buffer> {
    const txId = (transaction._id ? transaction._id.toString() : transaction.id || '').toUpperCase();
    const isDelivery = String(transaction.type).toUpperCase() === 'DELIVERY';
    const receiptNo = `RCP-${txId.slice(-8).toUpperCase()}`;

    // Company credentials from live .env / env config
    const companyName = (env.COMPANY_NAME || '').toUpperCase();
    const companyAddress = env.COMPANY_ADDRESS || '';
    const companyPhone = env.COMPANY_PHONE || '';
    const companyGst = env.COMPANY_GST || '';

    // Vendor details
    const vendorName = seller?.name || 'Valued Vendor';
    const vendorGst = seller?.gstNumber || '';
    const vendorPhone = seller?.phone || '';
    const vendorEmail = seller?.email || '';
    const vendorAddress = seller?.address || '';

    // Tank breakdown strictly 500L and 1000L
    const t500 = Number(transaction.tank500) || 0;
    const t1000 = Number(transaction.tank1000) || 0;
    const hasTanks = isDelivery && ((transaction.tankItems && transaction.tankItems.length > 0) || t500 > 0 || t1000 > 0);

    interface DeliveryItem {
      description: string;
      size: number;
      layers: number | null;
      foam?: string | null;
      quantity: number;
    }

    const deliveryItems: DeliveryItem[] = [];
    if (isDelivery) {
      if (transaction.tankItems && transaction.tankItems.length > 0) {
        for (const item of transaction.tankItems) {
          const qty = Number(item.quantity) || 0;
          if (qty <= 0) continue;
          deliveryItems.push({
            description: 'Polymer Water Tank',
            size: Number(item.size),
            layers: item.layers || null,
            foam: item.size === 1000 && item.foam && item.foam !== 'none' ? item.foam : null,
            quantity: qty,
          });
        }
      } else {
        if (t500 > 0) {
          deliveryItems.push({
            description: 'Polymer Water Tank',
            size: 500,
            layers: transaction.tank500_layers || null,
            quantity: t500,
          });
        }
        if (t1000 > 0) {
          deliveryItems.push({
            description: 'Polymer Water Tank',
            size: 1000,
            layers: transaction.tank1000_layers || null,
            foam: transaction.tank1000_foam && transaction.tank1000_foam !== 'none' ? transaction.tank1000_foam : null,
            quantity: t1000,
          });
        }
      }
    }

    const previousDues = Number(transaction.previousDues) || 0;
    const txAmount = Number(transaction.amount) || 0;
    const currentDues = Number(transaction.currentDues) || 0;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        info: {
          Title: `Receipt ${receiptNo}`,
          Author: `${companyName} VTMS`,
          Subject: isDelivery ? 'Delivery Receipt' : 'Payment Receipt',
          Creator: `${companyName} VTMS Server`,
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => {
        const fullBuffer = Buffer.concat(buffers);
        resolve(fullBuffer);
      });
      doc.on('error', (err) => reject(err));

      // Page dimensions
      const pageWidth = doc.page.width; // 595.28 pt
      const cardX = 36;
      const cardWidth = pageWidth - 72; // 523.28 pt
      let curY = 36;

      // Outer Receipt Card Frame
      doc.save();

      // ── 1. HEADER BAND (Navy Slate: #0f172a) ──
      const headerHeight = 76;
      doc.rect(cardX, curY, cardWidth, headerHeight).fill('#0f172a');

      // Logo Box: 48x48 rounded container with strict fit to avoid any image stretch
      const logoBoxSize = 48;
      const logoBoxX = cardX + 14;
      const logoBoxY = curY + 14;

      doc.roundedRect(logoBoxX, logoBoxY, logoBoxSize, logoBoxSize, 8).fill('#ffffff');
      doc.roundedRect(logoBoxX, logoBoxY, logoBoxSize, logoBoxSize, 8).lineWidth(1).stroke('#334155');

      const logoPath = PdfReceiptService.getLogoPath();
      if (logoPath) {
        try {
          doc.image(logoPath, logoBoxX + 2, logoBoxY + 2, {
            width: logoBoxSize - 4,
            height: logoBoxSize - 4,
            fit: [logoBoxSize - 4, logoBoxSize - 4],
            align: 'center',
            valign: 'center',
          });
        } catch {
          // Fallback text monogram if image decoding fails
          doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f172a');
          doc.text('VP', logoBoxX + 11, logoBoxY + 15);
        }
      } else {
        doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f172a');
        doc.text('VP', logoBoxX + 11, logoBoxY + 15);
      }

      // Company Info Text
      const compTextX = logoBoxX + logoBoxSize + 12;
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#38bdf8');
      doc.text(companyName, compTextX, curY + 14, { characterSpacing: 1 });

      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#cbd5e1');
      doc.text(companyAddress, compTextX, curY + 30, { width: 260, lineBreak: false });

      doc.font('Helvetica').fontSize(7.5).fillColor('#94a3b8');
      doc.text(`Phone: ${companyPhone}   •   GSTIN: `, compTextX, curY + 46, { continued: true });
      doc.font('Helvetica-Bold').fillColor('#f1f5f9').text(companyGst);

      // Voucher Type Badge & Number (Right Aligned)
      const badgeWidth = 120;
      const badgeHeight = 20;
      const badgeX = cardX + cardWidth - badgeWidth - 14;
      const badgeY = curY + 14;
      const badgeColor = isDelivery ? '#4f46e5' : '#059669';

      doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 10).fill(badgeColor);
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff');
      doc.text(isDelivery ? 'DELIVERY RECEIPT' : 'PAYMENT RECEIPT', badgeX, badgeY + 6, {
        width: badgeWidth,
        align: 'center',
        characterSpacing: 0.5,
      });

      doc.font('Courier-Bold').fontSize(10).fillColor('#f1f5f9');
      doc.text(receiptNo, badgeX, curY + 38, { width: badgeWidth, align: 'center' });

      const orderDateStr = PdfReceiptService.formatDate(transaction.date || transaction.createdAt);
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#cbd5e1');
      doc.text(isDelivery ? `Order Date: ${orderDateStr}` : `Payment Date: ${orderDateStr}`, badgeX - 30, curY + 54, {
        width: badgeWidth + 60,
        align: 'center',
      });

      curY += headerHeight + 14;

      // ── 2. SELLER / VENDOR DETAILS BOX (Background: #f8fafc) ──
      const vendorBoxX = cardX + 12;
      const vendorBoxWidth = cardWidth - 24;
      const vendorBoxY = curY;

      // Compute vendor details height dynamically
      let vendorBoxContentHeight = 62;
      if (vendorAddress) vendorBoxContentHeight += 12;

      doc.roundedRect(vendorBoxX, vendorBoxY, vendorBoxWidth, vendorBoxContentHeight, 8).fill('#f8fafc');
      doc.roundedRect(vendorBoxX, vendorBoxY, vendorBoxWidth, vendorBoxContentHeight, 8).lineWidth(1).stroke('#e2e8f0');

      // Vendor header icon and label
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#64748b');
      doc.text('SELLER / VENDOR DETAILS', vendorBoxX + 12, vendorBoxY + 10, { characterSpacing: 0.8 });

      // GSTIN badge if present
      if (vendorGst) {
        const gstBadgeWidth = 135;
        const gstBadgeX = vendorBoxX + vendorBoxWidth - gstBadgeWidth - 12;
        doc.roundedRect(gstBadgeX, vendorBoxY + 8, gstBadgeWidth, 14, 3).fill('#e2e8f0');
        doc.font('Courier-Bold').fontSize(7.5).fillColor('#1e293b');
        doc.text(`GSTIN: ${vendorGst}`, gstBadgeX, vendorBoxY + 11, { width: gstBadgeWidth, align: 'center' });
      }

      // Vendor Name
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f172a');
      doc.text(vendorName, vendorBoxX + 12, vendorBoxY + 25);

      // Contact meta row
      let metaY = vendorBoxY + 42;
      doc.font('Helvetica').fontSize(8).fillColor('#475569');
      if (vendorPhone && vendorEmail) {
        doc.text(`Phone: `, vendorBoxX + 12, metaY, { continued: true });
        doc.font('Helvetica-Bold').fillColor('#0f172a').text(vendorPhone, { continued: true });
        doc.font('Helvetica').fillColor('#94a3b8').text('   |   ', { continued: true });
        doc.font('Helvetica').fillColor('#475569').text(`Email: ${vendorEmail}`);
      } else if (vendorPhone) {
        doc.text(`Phone: `, vendorBoxX + 12, metaY, { continued: true });
        doc.font('Helvetica-Bold').fillColor('#0f172a').text(vendorPhone);
      } else if (vendorEmail) {
        doc.text(`Email: ${vendorEmail}`, vendorBoxX + 12, metaY);
      }

      if (vendorAddress) {
        metaY += 13;
        doc.font('Helvetica').fontSize(7.5).fillColor('#64748b');
        doc.text(`Address: ${vendorAddress}`, vendorBoxX + 12, metaY, { width: vendorBoxWidth - 24, lineBreak: false });
      }

      curY += vendorBoxContentHeight + 14;

      // ── 3. TRANSACTION DETAILS KEY-VALUE TABLE ──
      const tableX = cardX + 12;
      const tableWidth = cardWidth - 24;

      const drawTableRow = (
        label: string,
        value: string,
        isMono = false,
        badgeText?: string,
        badgeBg?: string,
        badgeColor?: string,
        isParagraph = false
      ) => {
        // Divider line
        doc.moveTo(tableX, curY).lineTo(tableX + tableWidth, curY).lineWidth(0.5).stroke('#f1f5f9');

        const labelX = tableX + 4;
        const labelWidth = 135;
        const valX = tableX + 145;
        const valWidth = tableWidth - 150;

        let thisRowHeight = 22;

        // Value or Badge
        if (badgeText && badgeBg && badgeColor) {
          const bw = 130;
          const bx = tableX + tableWidth - bw - 4;
          doc.roundedRect(bx, curY + 3, bw, 16, 8).fill(badgeBg);
          doc.roundedRect(bx, curY + 3, bw, 16, 8).lineWidth(0.5).stroke(badgeColor);
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor(badgeColor);
          doc.text(badgeText, bx, curY + 7, { width: bw, align: 'center' });

          doc.font('Helvetica').fontSize(8.5).fillColor('#64748b');
          doc.text(label, labelX, curY + 6, { width: labelWidth });
        } else if (isParagraph) {
          doc.font('Helvetica').fontSize(8.5);
          const measuredHeight = doc.heightOfString(value, { width: valWidth, lineGap: 2 });
          thisRowHeight = Math.max(22, Math.ceil(measuredHeight) + 12);

          // Label
          doc.font('Helvetica').fontSize(8.5).fillColor('#64748b');
          doc.text(label, labelX, curY + 6, { width: labelWidth });

          // Paragraph value left-aligned with line gap
          doc.font('Helvetica').fontSize(8.5).fillColor('#0f172a');
          doc.text(value, valX, curY + 6, { width: valWidth, align: 'left', lineGap: 2 });
        } else {
          doc.font(isMono ? 'Courier-Bold' : 'Helvetica-Bold').fontSize(8.5);
          const measuredHeight = doc.heightOfString(value, { width: valWidth, align: 'right' });
          thisRowHeight = Math.max(22, Math.ceil(measuredHeight) + 10);

          // Label
          doc.font('Helvetica').fontSize(8.5).fillColor('#64748b');
          doc.text(label, labelX, curY + 6, { width: labelWidth });

          // Value strictly confined to right column so it never wraps over the label
          doc.font(isMono ? 'Courier-Bold' : 'Helvetica-Bold').fontSize(8.5).fillColor('#0f172a');
          doc.text(value, valX, curY + 6, { width: valWidth, align: 'right' });
        }

        curY += thisRowHeight;
      };

      // Table Rows
      drawTableRow('Transaction ID', txId || 'N/A', true);
      drawTableRow(
        'Transaction Type',
        '',
        false,
        isDelivery ? 'Delivery Order (Goods)' : 'Payment Settlement',
        isDelivery ? '#eef2ff' : '#ecfdf5',
        isDelivery ? '#3730a3' : '#065f46'
      );
      drawTableRow(isDelivery ? 'Order Date' : 'Payment Date', orderDateStr);

      if (isDelivery && transaction.vehicleNumber) {
        drawTableRow('Vehicle / Transport', transaction.vehicleNumber, true);
      }

      if (!isDelivery && transaction.paymentMode) {
        const pMode = String(transaction.paymentMode).replace(/_/g, ' ').toUpperCase();
        drawTableRow('Payment Mode', '', false, pMode, '#ecfdf5', '#065f46');
      }

      if (!isDelivery && transaction.parentDelivery?.date) {
        drawTableRow('Linked Order Date', PdfReceiptService.formatDate(transaction.parentDelivery.date));
      }

      if (transaction.note && transaction.note.trim()) {
        const cleanNote = transaction.note.trim();
        const safeNote = cleanNote.length > 500 ? cleanNote.slice(0, 497) + '...' : cleanNote;
        drawTableRow('Reference / Note', safeNote, false, undefined, undefined, undefined, true);
      }

      // ── ITEMIZED TANKS DELIVERED TABLE (CLEAN TABLE FORMAT) ──
      if (isDelivery && deliveryItems.length > 0) {
        doc.moveTo(tableX, curY).lineTo(tableX + tableWidth, curY).lineWidth(0.5).stroke('#e2e8f0');
        curY += 8;

        const totalDeliveredQty = deliveryItems.reduce((acc, item) => acc + item.quantity, 0);

        // Header Section Banner
        const itemHeaderHeight = 18;
        doc.roundedRect(tableX, curY, tableWidth, itemHeaderHeight, 4).fill('#f1f5f9');

        // Blue vector water drop icon
        const dropX = tableX + 8;
        const dropY = curY + 4;
        doc.save();
        doc.path(`M ${dropX + 3.5} ${dropY} C ${dropX + 1.5} ${dropY + 3.5} ${dropX} ${dropY + 5.5} ${dropX} ${dropY + 7} C ${dropX} ${dropY + 9} ${dropX + 1.5} ${dropY + 10} ${dropX + 3.5} ${dropY + 10} C ${dropX + 5.5} ${dropY + 10} ${dropX + 7} ${dropY + 9} ${dropX + 7} ${dropY + 7} C ${dropX + 7} ${dropY + 5.5} ${dropX + 5.5} ${dropY + 3.5} ${dropX + 3.5} ${dropY} Z`).fill('#2563eb');
        doc.restore();

        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#475569');
        doc.text('ITEMIZED TANKS DELIVERED', tableX + 19, curY + 5, { characterSpacing: 0.5 });
        curY += itemHeaderHeight + 4;

        // Column Titles
        const col1X = tableX + 6;
        const col2X = tableX + 28;
        const col3X = tableX + 175;
        const col3W = 60;
        const col4X = tableX + 245;
        const col4W = 165;
        const col5X = tableX + 415;
        const col5W = tableWidth - 421;

        doc.font('Helvetica-Bold').fontSize(7).fillColor('#64748b');
        doc.text('#', col1X, curY);
        doc.text('ITEM', col2X, curY);
        doc.text('CAPACITY', col3X, curY, { width: col3W, align: 'center' });
        doc.text('SPECIFICATION', col4X, curY);
        doc.text('QUANTITY', col5X, curY, { width: col5W, align: 'right' });
        curY += 12;

        doc.moveTo(tableX, curY).lineTo(tableX + tableWidth, curY).lineWidth(0.5).stroke('#cbd5e1');
        curY += 3;

        // Table Rows
        for (let i = 0; i < deliveryItems.length; i++) {
          const item = deliveryItems[i];
          const rowY = curY;
          const itemRowH = 17;

          if (i % 2 === 1) {
            doc.rect(tableX, rowY - 1, tableWidth, itemRowH).fill('#f8fafc');
          }

          // Index
          doc.font('Courier-Bold').fontSize(7.5).fillColor('#94a3b8');
          doc.text(String(i + 1), col1X, rowY + 3);

          // Item Description
          doc.font('Helvetica-Bold').fontSize(8).fillColor('#1e293b');
          doc.text(item.description, col2X, rowY + 3);

          // Capacity
          doc.font('Helvetica-Bold').fontSize(8).fillColor('#2563eb');
          doc.text(`${item.size}L`, col3X, rowY + 3, { width: col3W, align: 'center' });

          // Specification
          const specParts: string[] = [];
          if (item.layers) specParts.push(`${item.layers} Layers`);
          if (item.foam) specParts.push(`${item.foam} foam`);
          const specText = specParts.length > 0 ? specParts.join(' • ') : 'Standard';

          doc.font('Helvetica').fontSize(8).fillColor('#475569');
          doc.text(specText, col4X, rowY + 3);

          // Quantity
          doc.font('Courier-Bold').fontSize(8.5).fillColor('#0f172a');
          doc.text(`${item.quantity} ${item.quantity === 1 ? 'Unit' : 'Units'}`, col5X, rowY + 3, { width: col5W, align: 'right' });

          curY += itemRowH;
        }

        // Table footer divider
        doc.moveTo(tableX, curY).lineTo(tableX + tableWidth, curY).lineWidth(0.5).stroke('#cbd5e1');
        curY += 4;
      }

      // Closing divider
      doc.moveTo(tableX, curY).lineTo(tableX + tableWidth, curY).lineWidth(0.5).stroke('#f1f5f9');
      curY += 10;

      // ── 4. HIGHLIGHT AMOUNT CARD ──
      const amountCardHeight = 52;
      const amountCardBg = isDelivery ? '#eef2ff' : '#ecfdf5';
      const amountCardBorder = isDelivery ? '#c7d2fe' : '#a7f3d0';
      const amountTextColor = isDelivery ? '#312e81' : '#065f46';

      doc.roundedRect(tableX, curY, tableWidth, amountCardHeight, 8).fill(amountCardBg);
      doc.roundedRect(tableX, curY, tableWidth, amountCardHeight, 8).lineWidth(1).stroke(amountCardBorder);

      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#64748b');
      doc.text(
        isDelivery ? 'TOTAL DELIVERY AMOUNT' : 'AMOUNT CLEARED / SETTLED',
        tableX,
        curY + 8,
        { width: tableWidth, align: 'center', characterSpacing: 1 }
      );

      doc.font('Helvetica-Bold').fontSize(17).fillColor(amountTextColor);
      doc.text(
        PdfReceiptService.formatCurrency(transaction.amount),
        tableX,
        curY + 22,
        { width: tableWidth, align: 'center' }
      );

      curY += amountCardHeight + 10;

      // ── 5. FINANCIAL BALANCE SUMMARY (3-COLUMN EXACT PREVIEW PARITY) ──
      if (includeDues && transaction.previousDues !== undefined && transaction.previousDues !== null) {
        const duesCardHeight = 44;
        const colW = tableWidth / 3;

        doc.roundedRect(tableX, curY, tableWidth, duesCardHeight, 6).fill('#f8fafc');
        doc.roundedRect(tableX, curY, tableWidth, duesCardHeight, 6).lineWidth(1).stroke('#e2e8f0');

        // Vertical dividers between 3 columns
        doc.moveTo(tableX + colW, curY + 6).lineTo(tableX + colW, curY + duesCardHeight - 6).lineWidth(0.5).stroke('#cbd5e1');
        doc.moveTo(tableX + colW * 2, curY + 6).lineTo(tableX + colW * 2, curY + duesCardHeight - 6).lineWidth(0.5).stroke('#cbd5e1');

        const prev = Number(transaction.previousDues || 0);
        const curr = transaction.currentDues !== undefined && transaction.currentDues !== null
          ? Number(transaction.currentDues)
          : (isDelivery ? prev + Number(transaction.amount || 0) : prev - Number(transaction.amount || 0));
        const txAmt = Number(transaction.amount || 0);

        // Column 1: Previous Dues / Advance
        const prevLabel = prev < 0 ? 'PREVIOUS ADVANCE' : 'PREVIOUS DUES';
        const prevVal = prev < 0 ? `+ ${PdfReceiptService.formatCurrency(prev)}` : PdfReceiptService.formatCurrency(prev);
        const prevColor = prev < 0 ? '#047857' : '#1e293b';

        doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#64748b');
        doc.text(prevLabel, tableX, curY + 8, { width: colW, align: 'center', characterSpacing: 0.5 });
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(prevColor);
        doc.text(prevVal, tableX, curY + 22, { width: colW, align: 'center' });

        // Column 2: Bill / Paid
        const midLabel = isDelivery ? 'DELIVERY BILL' : 'PAYMENT PAID';
        const midVal = (isDelivery ? '+ ' : '- ') + PdfReceiptService.formatCurrency(txAmt);
        const midColor = isDelivery ? '#4338ca' : '#047857';

        doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#64748b');
        doc.text(midLabel, tableX + colW, curY + 8, { width: colW, align: 'center', characterSpacing: 0.5 });
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(midColor);
        doc.text(midVal, tableX + colW, curY + 22, { width: colW, align: 'center' });

        // Column 3: Closing Balance / Advance
        const currLabel = curr < 0 ? 'CLOSING ADVANCE' : 'CLOSING BALANCE';
        const currVal = curr < 0 ? `+ ${PdfReceiptService.formatCurrency(curr)}` : PdfReceiptService.formatCurrency(curr);
        const currColor = curr < 0 ? '#047857' : '#0f172a';

        doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#64748b');
        doc.text(currLabel, tableX + colW * 2, curY + 8, { width: colW, align: 'center', characterSpacing: 0.5 });
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(currColor);
        doc.text(currVal, tableX + colW * 2, curY + 22, { width: colW, align: 'center' });

        curY += duesCardHeight + 16;
      } else {
        curY += 16;
      }

      // ── 5. SIGNATURE BLOCK ──
      const sigColWidth = (tableWidth - 40) / 2;
      const sig1X = tableX + 10;
      const sig2X = tableX + sigColWidth + 30;
      const sigLineY = curY + 28;

      // Dashed signature line 1
      doc.moveTo(sig1X, sigLineY).lineTo(sig1X + sigColWidth, sigLineY).lineWidth(0.8).dash(3, { space: 3 }).stroke('#cbd5e1');
      doc.undash();
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#64748b');
      doc.text('Recipient / Vendor Sign', sig1X, sigLineY + 6, { width: sigColWidth, align: 'center' });

      // Dashed signature line 2
      doc.moveTo(sig2X, sigLineY).lineTo(sig2X + sigColWidth, sigLineY).lineWidth(0.8).dash(3, { space: 3 }).stroke('#cbd5e1');
      doc.undash();
      doc.font('Helvetica-Oblique').fontSize(7).fillColor('#94a3b8');
      doc.text('Authorized Signature', sig2X, sigLineY - 10, { width: sigColWidth, align: 'center' });
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#334155');
      doc.text(`For ${companyName}`, sig2X, sigLineY + 6, { width: sigColWidth, align: 'center' });

      curY += 56;

      // ── 6. FOOTER NOTE ──
      doc.moveTo(tableX, curY).lineTo(tableX + tableWidth, curY).lineWidth(0.5).dash(2, { space: 2 }).stroke('#e2e8f0');
      doc.undash();

      doc.font('Helvetica').fontSize(7.5).fillColor('#64748b');
      doc.text(`Official Computer Generated Document  •  ${companyName}`, tableX, curY + 8, {
        width: tableWidth,
        align: 'center',
      });

      doc.font('Helvetica').fontSize(7).fillColor('#94a3b8');
      doc.text(PdfReceiptService.formatDateTime(new Date()), tableX, curY + 20, {
        width: tableWidth,
        align: 'center',
      });

      doc.font('Helvetica-Bold').fontSize(8).fillColor('#1e293b');
      doc.text('Thank you for your business!', tableX, curY + 31, {
        width: tableWidth,
        align: 'center',
      });

      // Outer card border
      const totalCardHeight = curY + 44 - 36;
      doc.roundedRect(cardX, 36, cardWidth, totalCardHeight, 10).lineWidth(1).stroke('#cbd5e1');

      doc.restore();
      doc.end();
    });
  }

  /**
   * Invalidate cache for a transaction when updated (No-op: caching is disabled)
   */
  public static invalidateCache(_transactionId: string): void {
    // No-op: PDFs are always dynamically rendered fresh on-the-fly without cache
  }
}
