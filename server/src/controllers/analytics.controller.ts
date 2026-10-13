import { Request, Response } from 'express';
import { db, DatabaseUnavailableError } from '../db/store.js';

export const getSystemOverview = async (_req: Request, res: Response) => {
  try {
    const reports = db.getAllReports();
    const telemetry = db.getAllTelemetry();
    const auditLogs = db.getAuditLogs();

    const activeIncidents = reports.filter(r => r.status !== 'RESOLVED' && r.status !== 'CLOSED').length;
    const criticalIncidents = reports.filter(r => r.priority === 'CRITICAL' || r.priority === 'CATASTROPHIC').length;
    const resolvedIncidents = reports.filter(r => r.status === 'RESOLVED').length;
    const totalSensors = telemetry.length;
    const anomalySensors = telemetry.filter(t => t.isAnomaly).length;

    // Category breakdown
    const categoryCounts: Record<string, number> = {};
    reports.forEach(r => {
      categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    });

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      kpis: {
        activeIncidents,
        criticalIncidents,
        resolvedIncidents,
        totalSensors,
        anomalySensors,
        aiTriageLatencyMs: 380,
        meanDispatchMinutes: 4.2,
      },
      categoryDistribution: categoryCounts,
      recentAuditLogs: auditLogs.slice(0, 10),
    });
  } catch (error: any) {
    if (error instanceof DatabaseUnavailableError || error.statusCode === 503) {
      return res.status(503).json({
        success: false,
        error: 'DatabaseUnavailable',
        message: 'Municipal database service is currently unavailable.',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};
