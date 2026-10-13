import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../../db/store.js';
import authRoutes from './auth.routes.js';
import reportRoutes from './report.routes.js';
import telemetryRoutes from './telemetry.routes.js';
import aiRoutes from './ai.routes.js';
import analyticsRoutes from './analytics.routes.js';

const router = Router();

// Readiness and Health Check
router.get('/health', (_req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && !db.isReady) {
    return res.status(503).json({
      status: 'DEGRADED',
      persistence: 'UNAVAILABLE',
      system: 'CivicSense AI Institutional Engine',
      message: 'Database persistence layer is unavailable. Service not ready.',
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    status: 'OPERATIONAL',
    persistence: db.isReady ? 'CONNECTED' : 'LOCAL_DEVELOPMENT',
    system: 'CivicSense AI Institutional Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Production Readiness Gate: Deny all operations with 503 if database persistence is not ready
router.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/health') return next();
  if (process.env.NODE_ENV === 'production' && !db.isReady) {
    return res.status(503).json({
      success: false,
      error: 'DatabaseUnavailable',
      message: 'Service Temporarily Unavailable: Municipal persistence layer is not ready.',
      timestamp: new Date().toISOString(),
    });
  }
  next();
});

router.use('/auth', authRoutes);
router.use('/reports', reportRoutes);
router.use('/telemetry', telemetryRoutes);
router.use('/ai', aiRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
