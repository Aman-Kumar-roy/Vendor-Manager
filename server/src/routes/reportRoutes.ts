import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware as any);

router.get('/summary', ReportController.getSummaryReport as any);
router.get('/tank-summary', ReportController.getTankSummaryReport as any);

export default router;
