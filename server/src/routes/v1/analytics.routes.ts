import { Router } from 'express';
import { getSystemOverview } from '../../controllers/analytics.controller.js';

const router = Router();

router.get('/overview', getSystemOverview);

export default router;
