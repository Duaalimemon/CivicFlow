import { Request, Response } from 'express';
import { db, DatabaseUnavailableError, PersistenceError } from '../db/store.js';

export const getTelemetry = async (_req: Request, res: Response) => {
  try {
    const data = db.getAllTelemetry();
    res.json({
      success: true,
      totalSensors: data.length,
      anomalies: data.filter(s => s.isAnomaly).length,
      data,
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

export const updateSensorReading = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { metricValue } = req.body;

    if (typeof metricValue !== 'number') {
      return res.status(400).json({ success: false, message: 'metricValue must be a numeric value' });
    }

    const updated = await db.updateTelemetryAsync(id, metricValue);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Sensor not found' });
    }

    res.json({
      success: true,
      message: 'Telemetry updated',
      data: updated,
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

export const simulateTelemetryAnomaly = async (_req: Request, res: Response) => {
  try {
    const all = db.getAllTelemetry();
    if (all.length === 0) {
      return res.status(400).json({ success: false, message: 'No telemetry sensors registered' });
    }

    // Pick a random sensor and trigger an anomaly spike
    const randomIndex = Math.floor(Math.random() * all.length);
    const targetSensor = all[randomIndex];
    const spikeValue = Number((targetSensor.threshold * (1.2 + Math.random() * 0.4)).toFixed(2));

    const updated = await db.updateTelemetryAsync(targetSensor.id, spikeValue);

    res.json({
      success: true,
      message: `Telemetry anomaly simulated on ${targetSensor.sensorName}`,
      data: updated,
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
