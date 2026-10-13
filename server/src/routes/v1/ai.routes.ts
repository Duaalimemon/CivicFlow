import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { triggerReportTriage, getReportInsights } from '../../controllers/ai.controller.js';
import {
  authenticateJWT,
  requireRole,
} from '../../middlewares/auth.middleware.js';

const router = Router();

// Rate limiting for AI triage to protect paid Gemini quota
const aiTriageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 60, // 60 triage dispatches per window per user/IP
  message: {
    success: false,
    error: 'RateLimitExceeded',
    message: 'Municipal AI triage rate limit exceeded. Please wait before initiating additional AI jobs.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Trigger AI Triage: Restricted to authorized municipal staff (CIVIC_OFFICIAL or ADMINISTRATOR)
router.post(
  '/triage/:reportId',
  authenticateJWT,
  requireRole('CIVIC_OFFICIAL', 'ADMINISTRATOR'),
  aiTriageLimiter,
  triggerReportTriage
);

// View AI Insights for a report: Requires authentication
router.get(
  '/insights/:reportId',
  authenticateJWT,
  getReportInsights
);

export default router;
