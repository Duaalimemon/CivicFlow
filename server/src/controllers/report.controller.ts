import { Request, Response } from 'express';
import { z } from 'zod';
import { db, DatabaseUnavailableError, PersistenceError } from '../db/store.js';
import { processMultiAgentTriage } from '../services/gemini.service.js';
import { IncidentPriority, IncidentStatus } from '../types/index.js';

const CreateReportSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  category: z.string().min(2, 'Category is required'),
  latitude: z.number().min(-90).max(90).default(40.7128),
  longitude: z.number().min(-180).max(180).default(-74.0060),
  locationAddress: z.string().min(3, 'Address is required'),
  mediaUrls: z.array(z.string()).optional().default([]),
});

const UpdateReportStatusSchema = z.object({
  status: z.enum(['RECEIVED', 'TRIAGED', 'DISPATCHED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'ELEVATED', 'CRITICAL', 'CATASTROPHIC']).optional(),
}).refine(data => data.status !== undefined || data.priority !== undefined, {
  message: 'Either status or priority must be provided.',
});

export const getReports = async (req: Request, res: Response) => {
  try {
    const { status, priority, category, authorId, scope } = req.query;
    let reports = db.getAllReports();

    // If scope=mine or citizen filtering their own reports
    if (scope === 'mine' && req.user) {
      reports = reports.filter(r => r.authorId === req.user?.id);
    } else if (authorId) {
      reports = reports.filter(r => r.authorId === String(authorId));
    }

    if (status) {
      reports = reports.filter(r => r.status === status);
    }
    if (priority) {
      reports = reports.filter(r => r.priority === priority);
    }
    if (category) {
      reports = reports.filter(r => r.category.toLowerCase() === String(category).toLowerCase());
    }

    res.json({
      success: true,
      count: reports.length,
      data: reports,
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

export const getReportById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const report = db.getReportById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Civic report not found' });
    }
    res.json({ success: true, data: report });
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

export const createReport = async (req: Request, res: Response) => {
  try {
    const validated = CreateReportSchema.parse(req.body);
    const trackingCode = `CIV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // SECURITY: Assign authorId exclusively from server-side authenticated user, never from request body
    const authorId = req.user?.id;

    const newReport = await db.addReportAsync({
      id: `rep-${Date.now()}`,
      trackingCode,
      title: validated.title,
      description: validated.description,
      category: validated.category,
      priority: 'LOW',
      status: 'RECEIVED',
      latitude: validated.latitude,
      longitude: validated.longitude,
      locationAddress: validated.locationAddress,
      mediaUrls: validated.mediaUrls,
      authorId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Run AI triage: await execution so Vercel Serverless containers do not freeze mid-flight
    try {
      await processMultiAgentTriage(newReport.id);
    } catch (err: any) {
      console.error(`[Background Triage Error for ${newReport.id}]:`, err?.message || err);
    }

    const finalReport = db.getReportById(newReport.id) || newReport;

    res.status(201).json({
      success: true,
      message: 'Civic report logged. Multi-agent triage dispatched.',
      data: finalReport,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
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

export const updateReportStatus = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const validated = UpdateReportStatusSchema.parse(req.body);

    const updates: Partial<{ status: IncidentStatus; priority: IncidentPriority }> = {};
    if (validated.status) updates.status = validated.status as IncidentStatus;
    if (validated.priority) updates.priority = validated.priority as IncidentPriority;

    const updated = await db.updateReportAsync(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({
      success: true,
      message: `Report status updated to ${updated.status}`,
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
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
