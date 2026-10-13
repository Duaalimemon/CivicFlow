import dotenv from 'dotenv';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

dotenv.config();
if (typeof __dirname !== 'undefined') {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const isProduction = process.env.NODE_ENV === 'production';
const supabaseUrl = process.env.SUPABASE_URL;

/**
 * Validates required Supabase configuration for the current environment.
 * In production, fails startup immediately if the URL or service-role key is missing.
 */
export function validateSupabaseConfig(env: NodeJS.ProcessEnv = process.env): void {
  const isProd = env.NODE_ENV === 'production';
  if (isProd) {
    if (!env.SUPABASE_URL || env.SUPABASE_URL.trim() === '' || env.SUPABASE_URL.includes('placeholder-project')) {
      throw new Error('[Supabase Config Error] Missing or invalid SUPABASE_URL environment variable in production.');
    }
    if (!env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY.trim() === '') {
      throw new Error(
        '[Supabase Config Error] Missing SUPABASE_SERVICE_ROLE_KEY environment variable in production. ' +
        'Backend requires service-role clearance for privileged database operations and cannot fall back to anon key.'
      );
    }
  }
}

// Execute production configuration validation at module load
if (isProduction) {
  validateSupabaseConfig();
} else {
  if (!supabaseUrl || (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_ANON_KEY)) {
    console.warn(
      '[Supabase Config Warning] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY is not defined. ' +
      'Running in development/test mode with local fallback store.'
    );
  }
}

// In production, strictly use SUPABASE_SERVICE_ROLE_KEY. In development/testing, allow service-role or anon fallback.
const supabaseKey = isProduction
  ? (process.env.SUPABASE_SERVICE_ROLE_KEY || '')
  : (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key');

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseKey || 'placeholder-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

if (supabaseUrl && !supabaseUrl.includes('placeholder-project')) {
  try {
    const parsed = new URL(supabaseUrl);
    console.log(`[Supabase Config] Initialized connection to Supabase instance (${parsed.hostname})`);
  } catch {
    console.log('[Supabase Config] Initialized connection to Supabase instance');
  }
}
