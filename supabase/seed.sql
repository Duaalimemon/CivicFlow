-- ==============================================================================
-- CivicFlow / CivicSense AI — Local Development & Testing Seed Data
-- File: supabase/seed.sql
-- Description: Baseline mock records for local development, UI demonstration,
--              and end-to-end integration testing workflows.
-- NOTE: This file is executed ONLY during local database reset workflows
--       (e.g., `supabase db reset`) as configured in `supabase/config.toml`.
--       It is NEVER executed during production schema migrations.
-- ==============================================================================

-- 1. Institutional Demo Users (Verified Bcrypt Hashes)
INSERT INTO civic_users (id, email, password_hash, full_name, role, badge_number, department, created_at, updated_at)
VALUES
  (
    'usr-admin-01',
    'admin@city.gov',
    '$2b$10$EBnjcWWXWPElHcsuukw4z.lgCi3KP7Ox9ki9w6XIF0ARnp/slbWpm', -- CivicSense2026!
    'Chief Director Marcus Vance',
    'ADMINISTRATOR',
    'DIR-001',
    'Municipal Operations Bureau',
    NOW(),
    NOW()
  ),
  (
    'usr-official-01',
    'official@city.gov',
    '$2b$10$EBnjcWWXWPElHcsuukw4z.lgCi3KP7Ox9ki9w6XIF0ARnp/slbWpm', -- CivicSense2026!
    'Commander Elena Vance',
    'CIVIC_OFFICIAL',
    'DSP-442',
    'Bureau of Water & Municipal Engineering',
    NOW(),
    NOW()
  ),
  (
    'usr-citizen-01',
    'citizen@civicsense.org',
    '$2b$10$EBnjcWWXWPElHcsuukw4z.lgCi3KP7Ox9ki9w6XIF0ARnp/slbWpm', -- CivicSense2026!
    'Sarah Jenkins',
    'CITIZEN',
    NULL,
    NULL,
    NOW(),
    NOW()
  ),
  (
    'usr-citizen-demo',
    'alex.rivera@community.org',
    '$2b$10$oVPOFJnETNdbW2s7h.jqTe0UEC0bbkB4G8XSXD5pXEAku.cCPnYr2', -- citizen1234
    'Alex Rivera',
    'CITIZEN',
    NULL,
    NULL,
    NOW(),
    NOW()
  ),
  (
    'usr-official-demo',
    'a.pendelton@cityfix.gov',
    '$2b$10$nmjOGs8AfsJgNLWz8.5nO.vrCe0pGi.Fe5g/Fmc3/ZUZ5oZ7lx1fO', -- director2026
    'Director Arthur Pendelton',
    'CIVIC_OFFICIAL',
    'DIR-RPW',
    'Roads Directorate',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  badge_number = EXCLUDED.badge_number,
  department = EXCLUDED.department,
  updated_at = NOW();

-- 2. Mock Telemetry Sensors
INSERT INTO telemetry_streams (id, sensor_id, sensor_name, sensor_type, metric_value, unit, threshold, is_anomaly, latitude, longitude, location, timestamp)
VALUES
  ('tel-1', 'SNSR-WTR-042', 'Central Aqueduct Main Pipeline', 'WATER_LEVEL_METRIC', 148.5, 'psi', 120.0, true, 40.7128, -74.0060, 'Sector 4 Aqueduct Vault', NOW()),
  ('tel-2', 'SNSR-PWR-901', 'East Grid Substation 12 kV Bus', 'POWER_GRID_VOLTAGE', 12.1, 'kV', 13.5, false, 40.7282, -73.9942, 'District 2 Power Transfer Node', NOW()),
  ('tel-3', 'SNSR-AQI-108', 'Industrial Corridor Particulate Sensor', 'AIR_QUALITY_PPM', 42.4, 'ppm', 75.0, false, 40.7410, -74.0120, 'West Logistics Terminal', NOW()),
  ('tel-4', 'SNSR-TRF-505', 'Grand Boulevard Arterial Flow', 'TRAFFIC_SENSOR', 88.0, 'dens/km', 80.0, true, 40.7505, -73.9850, 'Grand Blvd & 34th Intersection', NOW()),
  ('tel-5', 'SNSR-VIB-221', 'Harbor Bridge Pylon Vibration Array', 'STRUCTURAL_VIBRATION', 1.15, 'mm/s²', 2.50, false, 40.7061, -73.9969, 'South Suspension Anchor Point', NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Initial Civic Complaint Reports
INSERT INTO civic_reports (id, tracking_code, title, description, category, priority, status, latitude, longitude, location_address, media_urls, author_id, created_at, updated_at)
VALUES
  ('rep-1', 'CIV-2026-1049', 'Severe High Pressure Aqueduct Valve Rupture', 'Underground conduit rupture releasing pressurized potable water onto pedestrian plaza. Sub-surface erosion hazard suspected.', 'Water Grid', 'CRITICAL', 'DISPATCHED', 40.7128, -74.0060, 'Civic Plaza North, Sector 4 Aqueduct Vault', '{}', 'usr-citizen-01', NOW() - INTERVAL '18 minutes', NOW() - INTERVAL '5 minutes'),
  ('rep-2', 'CIV-2026-1048', 'Autonomous Transit Lane Signal Synchronization Interruption', 'Repeated signal dropout at Bay Street node causing headway compression and bus queuing across 4 blocks.', 'Roads & Transit', 'ELEVATED', 'TRIAGED', 40.7505, -73.9850, 'Bay Street Corridor & 34th Interchange', '{}', 'usr-citizen-demo', NOW() - INTERVAL '35 minutes', NOW() - INTERVAL '20 minutes'),
  ('rep-3', 'CIV-2026-1047', 'Substation Transformer Phase Unbalance Alert', 'Telemetry triggered automated alert for phase delta surge on 12kV line following lightning strike.', 'Power Grid', 'CRITICAL', 'TRIAGED', 40.7282, -73.9942, 'East District Power Transfer Node 3', '{}', NULL, NOW() - INTERVAL '55 minutes', NOW() - INTERVAL '45 minutes'),
  ('rep-4', 'CIV-2026-1046', 'Storm Drain Blockage Causing Low-Lying Street Pooling', 'Accumulation of organic debris obstructing dual storm intake grates after torrential rain front.', 'Sanitation', 'LOW', 'RESOLVED', 40.7300, -74.0010, 'Elmwood Avenue at 9th Crossroad', '{}', 'usr-citizen-01', NOW() - INTERVAL '120 minutes', NOW() - INTERVAL '15 minutes')
ON CONFLICT (id) DO NOTHING;

-- 4. Initial AI Incident Insight
INSERT INTO ai_insights (id, report_id, triage_priority, urgency_score, sentiment_index, summary, suggested_action, target_department, confidence_score, agent_evaluations, created_at)
VALUES
  (
    'ins-1',
    'rep-1',
    'CRITICAL',
    0.94,
    -0.82,
    'Critical hydraulic surge event posing immediate structural undermining risk to Civic Plaza foundation. Telemetry SNSR-WTR-042 confirms 148.5 psi spike.',
    'Immediate isolation of Section 4 valve gates; dispatch Rapid Emergency Repair Unit 4 with backflow containment gear.',
    'Bureau of Water Supply & Municipal Engineering',
    0.98,
    '{"triageAgent":{"hazardSeverity":"Level 4 (Severe Foundation & Hydraulic Loss)","infrastructuralVulnerability":"High probability of roadway sinkhole formation"},"sentimentAgent":{"publicAgitation":"Elevated distress reported on municipal social channels","cascadeRisk":"Disruption to 14,000 downstream residential taps"},"dispatchAgent":{"workOrderType":"HYDRAULIC_EMERGENCY_SHUTDOWN","crewTierRequired":"Tier 1 Certified Utility Crew","estimatedResolutionHours":3.5}}'::jsonb,
    NOW() - INTERVAL '16 minutes'
  )
ON CONFLICT (id) DO NOTHING;
