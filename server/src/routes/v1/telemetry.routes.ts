import { Router } from 'express';
import {
  getTelemetry,
  updateSensorReading,
  simulateTelemetryAnomaly,
} from '../../controllers/telemetry.controller.js';
import {
  authenticateJWT,
  requireRole,
} from '../../middlewares/auth.middleware.js';

const router = Router();

// Read-only sensor stream: Requires authenticated access
router.get('/', authenticateJWT, getTelemetry);

// Telemetry mutation: Restricted to authorized municipal officials and administrators
router.patch(
  '/:id',
  authenticateJWT,
  requireRole('CIVIC_OFFICIAL', 'ADMINISTRATOR'),
  updateSensorReading
);

// Telemetry anomaly simulation: Restricted to authorized municipal officials and administrators
router.post(
  '/simulate',
  authenticateJWT,
  requireRole('CIVIC_OFFICIAL', 'ADMINISTRATOR'),
  simulateTelemetryAnomaly
);

export default router;
