import { Router } from 'express';
import {
  getReports,
  getReportById,
  createReport,
  updateReportStatus,
} from '../../controllers/report.controller.js';
import {
  optionalAuthenticateJWT,
  authenticateJWT,
  requireRole,
} from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/', optionalAuthenticateJWT, getReports);
router.post('/', optionalAuthenticateJWT, createReport);
router.get('/:id', optionalAuthenticateJWT, getReportById);
router.patch(
  '/:id/status',
  authenticateJWT,
  requireRole('CIVIC_OFFICIAL', 'ADMINISTRATOR'),
  updateReportStatus
);

export default router;
