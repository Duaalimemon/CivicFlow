import { Request, Response } from 'express';
import { db, DatabaseUnavailableError, PersistenceError } from '../db/store.js';
import { processMultiAgentTriage } from '../services/gemini.service.js';

export const triggerReportTriage = async (req: Request, res: Response) => {
  try {
    const reportId = String(req.params.reportId);
    const report = db.getReportById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: `Civic report with ID ${reportId} not found.` });
    }
    const insight = await processMultiAgentTriage(reportId);
    res.json({
      success: true,
      message: 'Multi-agent triage completed successfully',
      data: insight,
    });
  } catch (error: any) {
    if (error instanceof DatabaseUnavailableError || error.statusCode === 503) {
      return res.status(503).json({
        success: false,
        error: 'DatabaseUnavailable',
        message: 'Municipal database service is currently unavailable.',
      });
    }
    if (error instanceof PersistenceError || error.statusCode === 500) {
      return res.status(500).json({
        success: false,
        error: 'PersistenceFailure',
        message: error.message || 'An unexpected persistence failure occurred.',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReportInsights = async (req: Request, res: Response) => {
  try {
    const reportId = String(req.params.reportId);
    const insights = db.getInsightsForReport(reportId);
    res.json({
      success: true,
      data: insights,
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
