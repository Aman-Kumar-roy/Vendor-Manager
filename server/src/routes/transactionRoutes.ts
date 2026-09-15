import { Router } from 'express';
import { TransactionController } from '../controllers/transactionController';
import { authMiddleware, requireAdmin, requireAdminOrManager } from '../middleware/authMiddleware';

const router = Router();

// Canonical Vector PDF Receipt endpoint - Accessible without Bearer auth so Meta Cloud API can fetch document over HTTPS
router.get('/:id/receipt/pdf', TransactionController.getTransactionReceiptPdf as any);

router.use(authMiddleware as any);

router.get('/', TransactionController.getAllTransactions as any);
router.get('/:id/receipt', TransactionController.getTransactionReceipt as any);
router.post('/:id/send-receipt', TransactionController.sendWhatsAppReceipt as any);
router.post('/:id/whatsapp', TransactionController.sendWhatsAppReceipt as any);
router.post('/:id/send-whatsapp', TransactionController.sendWhatsAppReceipt as any);
router.post('/', requireAdminOrManager as any, TransactionController.createTransaction as any);
router.put('/:id', requireAdmin as any, TransactionController.updateTransaction as any);
router.delete('/:id', requireAdmin as any, TransactionController.deleteTransaction as any);

export default router;
