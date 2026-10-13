-- ==============================================================================
-- CivicFlow / CivicSense AI — Supabase Database Migration
-- Migration: 20261013000000_civicflow_schema.sql
-- Description: Creates institutional municipal tables, constraints, indexes,
--              Row-Level Security (RLS) policies, and baseline seed records.
-- ==============================================================================

-- 1. ENUMS & DOMAINS
-- ------------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('CITIZEN', 'CIVIC_OFFICIAL', 'ADMINISTRATOR');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE incident_priority AS ENUM ('LOW', 'ELEVATED', 'CRITICAL', 'CATASTROPHIC');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE incident_status AS ENUM ('RECEIVED', 'TRIAGED', 'DISPATCHED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE telemetry_type AS ENUM (
    'WATER_LEVEL_METRIC',
    'TRAFFIC_SENSOR',
    'AIR_QUALITY_PPM',
    'POWER_GRID_VOLTAGE',
    'STRUCTURAL_VIBRATION'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


-- 2. CORE TABLES
-- ------------------------------------------------------------------------------

-- Users Table
CREATE TABLE IF NOT EXISTS civic_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'CITIZEN',
  badge_number TEXT,
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Civic Complaints & Reports Table
CREATE TABLE IF NOT EXISTS civic_reports (
  id TEXT PRIMARY KEY,
  tracking_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority incident_priority NOT NULL DEFAULT 'LOW',
  status incident_status NOT NULL DEFAULT 'RECEIVED',
  latitude DOUBLE PRECISION NOT NULL DEFAULT 40.7128,
  longitude DOUBLE PRECISION NOT NULL DEFAULT -74.0060,
  location_address TEXT NOT NULL,
  media_urls TEXT[] NOT NULL DEFAULT '{}',
  author_id TEXT REFERENCES civic_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Municipal IoT Telemetry Streams Table
CREATE TABLE IF NOT EXISTS telemetry_streams (
  id TEXT PRIMARY KEY,
  sensor_id TEXT UNIQUE NOT NULL,
  sensor_name TEXT NOT NULL,
  sensor_type telemetry_type NOT NULL,
  metric_value DOUBLE PRECISION NOT NULL,
  unit TEXT NOT NULL,
  threshold DOUBLE PRECISION NOT NULL,
  is_anomaly BOOLEAN NOT NULL DEFAULT FALSE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Multi-Agent Triage Insights Table
CREATE TABLE IF NOT EXISTS ai_insights (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES civic_reports(id) ON DELETE CASCADE,
  triage_priority incident_priority NOT NULL,
  urgency_score DOUBLE PRECISION NOT NULL CHECK (urgency_score >= 0.0 AND urgency_score <= 1.0),
  sentiment_index DOUBLE PRECISION NOT NULL CHECK (sentiment_index >= -1.0 AND sentiment_index <= 1.0),
  summary TEXT NOT NULL,
  suggested_action TEXT NOT NULL,
  target_department TEXT NOT NULL,
  confidence_score DOUBLE PRECISION NOT NULL CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
  agent_evaluations JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  report_id TEXT REFERENCES civic_reports(id) ON DELETE SET NULL,
  user_id TEXT REFERENCES civic_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  delta_diff JSONB,
  ip_address TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 3. INDEXES FOR HIGH-THROUGHPUT RETRIEVAL & FILTERING
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_civic_users_email ON civic_users (email);
CREATE INDEX IF NOT EXISTS idx_civic_users_role ON civic_users (role);

CREATE INDEX IF NOT EXISTS idx_civic_reports_tracking_code ON civic_reports (tracking_code);
CREATE INDEX IF NOT EXISTS idx_civic_reports_status_priority ON civic_reports (status, priority);
CREATE INDEX IF NOT EXISTS idx_civic_reports_category ON civic_reports (category);
CREATE INDEX IF NOT EXISTS idx_civic_reports_author_id ON civic_reports (author_id);
CREATE INDEX IF NOT EXISTS idx_civic_reports_created_at ON civic_reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_civic_reports_geo ON civic_reports (latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_telemetry_sensor_id ON telemetry_streams (sensor_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_is_anomaly ON telemetry_streams (is_anomaly);
CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON telemetry_streams (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_ai_insights_report_id ON ai_insights (report_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON ai_insights (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_report_id ON audit_logs (report_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp DESC);


-- 4. ROW-LEVEL SECURITY (RLS) POLICIES & ACCESS CONTROLS
-- ------------------------------------------------------------------------------
ALTER TABLE civic_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE civic_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 4.1 Drop all legacy and permissive policies across all tables
DROP POLICY IF EXISTS "Public & authenticated can read reports" ON civic_reports;
DROP POLICY IF EXISTS "Allow report creation" ON civic_reports;
DROP POLICY IF EXISTS "Allow report updates" ON civic_reports;
DROP POLICY IF EXISTS "Allow public read-only access to reports" ON civic_reports;
DROP POLICY IF EXISTS "Disallow public update access to reports" ON civic_reports;
DROP POLICY IF EXISTS "Disallow public delete access to reports" ON civic_reports;
DROP POLICY IF EXISTS "Disallow public anon access to reports" ON civic_reports;

DROP POLICY IF EXISTS "Allow telemetry read" ON telemetry_streams;
DROP POLICY IF EXISTS "Allow telemetry sensor updates" ON telemetry_streams;
DROP POLICY IF EXISTS "Allow telemetry sensor insert" ON telemetry_streams;
DROP POLICY IF EXISTS "Allow public read-only access to telemetry" ON telemetry_streams;
DROP POLICY IF EXISTS "Disallow public write access to telemetry" ON telemetry_streams;
DROP POLICY IF EXISTS "Disallow public update access to telemetry" ON telemetry_streams;
DROP POLICY IF EXISTS "Disallow public delete access to telemetry" ON telemetry_streams;
DROP POLICY IF EXISTS "Disallow public anon access to telemetry" ON telemetry_streams;

DROP POLICY IF EXISTS "Allow reading AI insights" ON ai_insights;
DROP POLICY IF EXISTS "Allow inserting AI insights" ON ai_insights;
DROP POLICY IF EXISTS "Allow public read-only access to AI insights" ON ai_insights;
DROP POLICY IF EXISTS "Disallow public write access to AI insights" ON ai_insights;
DROP POLICY IF EXISTS "Disallow public update access to AI insights" ON ai_insights;
DROP POLICY IF EXISTS "Disallow public delete access to AI insights" ON ai_insights;
DROP POLICY IF EXISTS "Disallow public anon access to AI insights" ON ai_insights;

DROP POLICY IF EXISTS "Allow reading audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow inserting audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Disallow public anon access to audit logs" ON audit_logs;

DROP POLICY IF EXISTS "Allow backend to query users" ON civic_users;
DROP POLICY IF EXISTS "Allow citizen registration" ON civic_users;
DROP POLICY IF EXISTS "Allow user profile updates" ON civic_users;
DROP POLICY IF EXISTS "Public & authenticated can read users" ON civic_users;
DROP POLICY IF EXISTS "Disallow public anon access to users" ON civic_users;

-- 4.2 Revoke all direct SQL privileges from public, anon, and authenticated roles on all tables
-- Institutional data is mediated exclusively through the trusted Express backend.
REVOKE ALL ON civic_users FROM anon, authenticated, public;
REVOKE ALL ON civic_reports FROM anon, authenticated, public;
REVOKE ALL ON telemetry_streams FROM anon, authenticated, public;
REVOKE ALL ON ai_insights FROM anon, authenticated, public;
REVOKE ALL ON audit_logs FROM anon, authenticated, public;

-- 4.3 Grant full administrative database privileges exclusively to service_role
GRANT ALL ON civic_users TO service_role;
GRANT ALL ON civic_reports TO service_role;
GRANT ALL ON telemetry_streams TO service_role;
GRANT ALL ON ai_insights TO service_role;
GRANT ALL ON audit_logs TO service_role;

-- 4.4 Explicit Restrictive Denial Policies (Defense-in-Depth against anonymous and direct public access)
CREATE POLICY "Disallow public anon access to users"
  ON civic_users AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Disallow public anon access to reports"
  ON civic_reports AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Disallow public anon access to telemetry"
  ON telemetry_streams AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Disallow public anon access to AI insights"
  ON ai_insights AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Disallow public anon access to audit logs"
  ON audit_logs AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);
