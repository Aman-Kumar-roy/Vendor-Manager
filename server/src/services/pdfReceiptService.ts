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
  tank500?: number;
  tank1000?: number;
  tank2000?: number;
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

interface CacheEntry {
  buffer: Buffer;
  cachedAt: number;
}

// In-memory cache keyed by transaction ID + updated timestamp
// Safe for Railway/ephemeral container deployments, sub-millisecond response on repeated requests
const pdfCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

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
    const num = Number(val || 0);
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
    seller?: SellerDataInput | null
  ): Promise<Buffer> {
    const txId = (transaction._id ? transaction._id.toString() : transaction.id || '').toUpperCase();
    const updateTime = transaction.updatedAt ? new Date(transaction.updatedAt).getTime() : 0;
    const cacheKey = `${txId}_${updateTime}`;

    // Return from cache if valid
    const cached = pdfCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.buffer;
    }

    const isDelivery = String(transaction.type).toUpperCase() === 'DELIVERY';
    const receiptNo = `RCP-${txId.slice(-8).toUpperCase()}`;

    // Company credentials from .env / env config
    const companyName = (env.COMPANY_NAME || 'Vasudha Polymer').toUpperCase();
    const companyAddress = env.COMPANY_ADDRESS || 'Plot 42, Industrial Zone, New Delhi - 110020';
    const companyPhone = env.COMPANY_PHONE || '+91 98765 43210';
    const companyGst = env.COMPANY_GST || '07AAAAA0000A1Z5';

    // Vendor details
    const vendorName = seller?.name || 'Valued Vendor';
    const vendorGst = seller?.gstNumber || '';
    const vendorPhone = seller?.phone || '';
    const vendorEmail = seller?.email || '';
    const vendorAddress = seller?.address || '';

    // Tank breakdown strictly 500L, 1000L, 2000L as per Critical Agent Instructions
    const t500 = Number(transaction.tank500) || 0;
    const t1000 = Number(transaction.tank1000) || 0;
    const t2000 = Number(transaction.tank2000) || 0;
    const hasTanks = isDelivery && (t500 > 0 || t1000 > 0 || t2000 > 0);
    const tankParts = [
      t500 > 0 ? `500L: ${t500}` : null,
      t1000 > 0 ? `1000L: ${t1000}` : null,
      t2000 > 0 ? `2000L: ${t2000}` : null,
    ].filter(Boolean).join('   •   ');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        info: {
          Title: `Receipt-${receiptNo}`,
          Author: companyName,
          Subject: isDelivery ? 'Delivery Receipt' : 'Payment Receipt',
          Creator: `${companyName} VTMS Server`,
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => {
        const fullBuffer = Buffer.concat(buffers);
        pdfCache.set(cacheKey, { buffer: fullBuffer, cachedAt: Date.now() });
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
      doc.text(receiptNo, badgeX, curY + 40, { width: badgeWidth, align: 'center' });

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
      const rowHeight = 22;

      const drawTableRow = (label: string, value: string, isMono = false, badgeText?: string, badgeBg?: string, badgeColor?: string) => {
        // Divider line
        doc.moveTo(tableX, curY).lineTo(tableX + tableWidth, curY).lineWidth(0.5).stroke('#f1f5f9');

        // Label
        doc.font('Helvetica').fontSize(8.5).fillColor('#64748b');
        doc.text(label, tableX + 4, curY + 6);

        // Value or Badge
        if (badgeText && badgeBg && badgeColor) {
          const bw = 130;
          const bx = tableX + tableWidth - bw - 4;
          doc.roundedRect(bx, curY + 3, bw, 16, 8).fill(badgeBg);
          doc.roundedRect(bx, curY + 3, bw, 16, 8).lineWidth(0.5).stroke(badgeColor);
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor(badgeColor);
          doc.text(badgeText, bx, curY + 7, { width: bw, align: 'center' });
        } else {
          doc.font(isMono ? 'Courier-Bold' : 'Helvetica-Bold').fontSize(8.5).fillColor('#0f172a');
          doc.text(value, tableX, curY + 6, { width: tableWidth - 4, align: 'right' });
        }

        curY += rowHeight;
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
      drawTableRow('Date of Record', PdfReceiptService.formatDate(transaction.date || transaction.createdAt));

      if (hasTanks) {
        drawTableRow('Tanks Delivered', tankParts, false);
      }

      if (isDelivery && transaction.vehicleNumber) {
        drawTableRow('Vehicle / Transport', transaction.vehicleNumber, true);
      }

      if (!isDelivery && transaction.paymentMode) {
        const pMode = String(transaction.paymentMode).replace(/_/g, ' ').toUpperCase();
        drawTableRow('Payment Mode', '', false, pMode, '#ecfdf5', '#065f46');
      }

      if (!isDelivery && transaction.parentDelivery?.date) {
        drawTableRow('Linked Delivery Order', PdfReceiptService.formatDate(transaction.parentDelivery.date));
      }

      if (transaction.note) {
        drawTableRow('Reference / Note', transaction.note);
      }

      // Closing divider
      doc.moveTo(tableX, curY).lineTo(tableX + tableWidth, curY).lineWidth(0.5).stroke('#f1f5f9');
      curY += 12;

      // ── 4. HIGHLIGHT AMOUNT CARD ──
      const amountCardHeight = 56;
      const amountCardBg = isDelivery ? '#eef2ff' : '#ecfdf5';
      const amountCardBorder = isDelivery ? '#c7d2fe' : '#a7f3d0';
      const amountTextColor = isDelivery ? '#312e81' : '#065f46';

      doc.roundedRect(tableX, curY, tableWidth, amountCardHeight, 8).fill(amountCardBg);
      doc.roundedRect(tableX, curY, tableWidth, amountCardHeight, 8).lineWidth(1).stroke(amountCardBorder);

      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#64748b');
      doc.text(
        isDelivery ? 'TOTAL DELIVERY AMOUNT' : 'AMOUNT CLEARED / SETTLED',
        tableX,
        curY + 9,
        { width: tableWidth, align: 'center', characterSpacing: 1 }
      );

      doc.font('Helvetica-Bold').fontSize(18).fillColor(amountTextColor);
      doc.text(
        PdfReceiptService.formatCurrency(transaction.amount),
        tableX,
        curY + 24,
        { width: tableWidth, align: 'center' }
      );

      curY += amountCardHeight + 20;

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
   * Invalidate cache for a transaction when updated
   */
  public static invalidateCache(transactionId: string): void {
    const prefix = transactionId.toUpperCase();
    for (const key of pdfCache.keys()) {
      if (key.startsWith(prefix)) {
        pdfCache.delete(key);
      }
    }
  }
}
