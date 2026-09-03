import { Router } from 'express';
import { SellerController } from '../controllers/sellerController';
import { authMiddleware, requireAdmin, requireAdminOrManager } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware as any);

router.get('/', SellerController.getAllSellers as any);
router.post('/', requireAdminOrManager as any, SellerController.createSeller as any);
router.get('/:id', SellerController.getSellerById as any);
router.put('/:id', requireAdmin as any, SellerController.updateSeller as any);
router.delete('/:id', requireAdmin as any, SellerController.deleteSeller as any);

export default router;
