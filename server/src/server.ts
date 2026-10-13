import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
if (typeof __dirname !== 'undefined') {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import v1Router from './routes/v1/index.js';
import { validateSupabaseConfig } from './config/supabase.js';
import { db, DatabaseUnavailableError, PersistenceError } from './db/store.js';

const app: Application = express();

// Institutional Security Standard
app.use(helmet());

const isProduction = process.env.NODE_ENV === 'production';

// Production reverse proxy deployment: Trust the first reverse-proxy hop (e.g., Render, Railway, AWS ALB, Nginx)
// when running in production or when TRUST_PROXY is explicitly enabled.
if (isProduction || process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

const allowedOrigins = [
  ...(process.env.CLIENT_ORIGIN ? [process.env.CLIENT_ORIGIN] : []),
  ...(!isProduction ? ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'] : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // In development and test mode, allow local development ports
      if (!isProduction && (/^https?:\/\/localhost:\d+$/.test(origin) || /^https?:\/\/127\.0\.0\.1:\d+$/.test(origin))) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// Rate limiter for API telemetry
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Exceeded institutional request rate limit.' },
});
app.use('/api/', apiLimiter);

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'CivicSense AI Municipal Command Engine',
    status: 'ACTIVE',
    docs: '/api/v1/health',
  });
});

// Routing Mount
app.use('/api/v1', v1Router);

// Global Error Handler - Standardized HTTP 503 & 500 without Credential Leakage
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof DatabaseUnavailableError || (err as any).statusCode === 503) {
    return res.status(503).json({
      success: false,
      error: 'DatabaseUnavailable',
      message: 'Municipal database service is currently unavailable.',
      timestamp: new Date().toISOString(),
    });
  }

  if (err instanceof PersistenceError || (err as any).statusCode === 500) {
    return res.status(500).json({
      success: false,
      error: 'PersistenceFailure',
      message: 'An unexpected persistence failure occurred while recording institutional data.',
      timestamp: new Date().toISOString(),
    });
  }

  // Never log passwords, tokens, or service-role keys in unhandled exceptions
  const sanitizedMsg = err.message
    ? err.message.replace(/eyJ[a-zA-Z0-9_\-\.]+/g, '[REDACTED_JWT]').replace(/pass(word)?\s*[:=]\s*\S+/gi, 'password=[REDACTED]')
    : 'Unknown internal exception';
  console.error('[CivicSense Exception]', sanitizedMsg);

  res.status(500).json({
    status: 'error',
    message: 'Institutional Internal Server Exception',
    timestamp: new Date().toISOString(),
  });
});

export { app };

const PORT = process.env.PORT || 5000;
const isDirectRun = Boolean(
  process.argv[1] && (
    process.argv[1].endsWith('server.ts') ||
    process.argv[1].endsWith('server.js')
  )
);

if (isDirectRun && process.env.NODE_ENV !== 'test') {
  const startServer = async () => {
    if (process.env.NODE_ENV === 'production') {
      try {
        validateSupabaseConfig();
        await db.waitForHydration();
      } catch (err: any) {
        console.error('[CivicSense Production Startup Aborted]', err.message || err);
        process.exit(1);
      }
    }
    app.listen(PORT, () => {
      console.log(`[CivicSense AI Server] Live on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    });
  };

  void startServer();
}
