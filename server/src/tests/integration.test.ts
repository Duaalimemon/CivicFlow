/**
 * CivicSense AI - End-to-End Comprehensive Integration & Functionality Test Suite
 * Tests all REST endpoints, Database State Mutations, Audit Logs, Role Separation, and AI Multi-Agent Triage.
 */
process.env.NODE_ENV = 'test';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import type { Server } from 'http';

const BASE_URL = 'http://localhost:5000/api/v1';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    results.push({ name, passed: true, durationMs });
    console.log(`[PASS] ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    results.push({ name, passed: false, details: err.message, durationMs });
    console.error(`[FAIL] ${name} (${durationMs}ms): ${err.message}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function ensureServerRunning(): Promise<Server | null> {
  try {
    const check = await fetch(`${BASE_URL}/health`);
    if (check.ok) return null;
  } catch {
    // Server is not running, spawn listener
  }

  const { app } = await import('../server.js');
  return new Promise((resolve) => {
    const server = app.listen(5000, () => {
      console.log('[Test Harness] Spawned CivicSense test server on port 5000');
      resolve(server);
    });
  });
}

async function runTestSuite() {
  console.log('===============================================================');
  console.log('   CIVICSENSE AI - COMPREHENSIVE SYSTEM VERIFICATION SUITE    ');
  console.log('===============================================================\n');

  const runningServer = await ensureServerRunning();
  let createdReportId = '';
  let adminToken = '';
  let citizenToken = '';
  let authCookie = '';

  try {
    // 1. Health Endpoint
    await test('1. Health Check (GET /health)', async () => {
      const res = await fetch(`${BASE_URL}/health`);
      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      const data = await res.json();
      assert(data.status === 'OPERATIONAL', `Expected status OPERATIONAL, got ${data.status}`);
      assert(data.version === '1.0.0', `Expected version 1.0.0, got ${data.version}`);
    });

    // 2. Fetch All Reports
    await test('2. List Reports (GET /reports)', async () => {
      const res = await fetch(`${BASE_URL}/reports`);
      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      const data = await res.json();
      assert(data.success === true, 'Expected success: true');
      assert(Array.isArray(data.data), 'Expected data to be an array');
      assert(data.count > 0, 'Expected non-empty seeded reports');
    });

    // 3. Filter Reports by Category & Priority
    await test('3. Query Filtering (GET /reports?category=Water Grid&priority=CRITICAL)', async () => {
      const res = await fetch(`${BASE_URL}/reports?category=Water Grid&priority=CRITICAL`);
      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      const data = await res.json();
      assert(data.success === true, 'Expected success: true');
      for (const report of data.data) {
        assert(report.category.toLowerCase() === 'water grid', `Expected Water Grid, got ${report.category}`);
        assert(report.priority === 'CRITICAL', `Expected CRITICAL, got ${report.priority}`);
      }
    });

    // 4. Create New Civic Report (Zod Validation & Auto AI Triage Dispatch)
    await test('4. Ingest Civic Report (POST /reports)', async () => {
      const payload = {
        title: 'Chemical Solvent Leak Near Harbor Basin',
        category: 'Hazardous Materials',
        locationAddress: 'Pier 18 Industrial Berth',
        description: 'Pungent odor and blue chemical slick discharging into marine canal from decommissioned refinery valve.',
        latitude: 40.6892,
        longitude: -74.0445,
      };

      const res = await fetch(`${BASE_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      assert(res.status === 201, `Expected 201 Created, got ${res.status}`);
      const data = await res.json();
      assert(data.success === true, 'Expected success: true');
      assert(data.data.id, 'Expected report ID');
      assert(data.data.trackingCode.startsWith('CIV-'), 'Expected trackingCode with CIV- prefix');
      createdReportId = data.data.id;
    });

    // 5. Validation Failure on Invalid Payload
    await test('5. Validation Error Handling (POST /reports with invalid data)', async () => {
      const res = await fetch(`${BASE_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'A' }), // missing description, category, address
      });

      assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
      const data = await res.json();
      assert(data.success === false, 'Expected success: false');
      assert(Array.isArray(data.errors), 'Expected Zod validation errors array');
    });

    // 6. Inspect Created Report & Verify Database State
    await test('6. Retrieve Report by ID (GET /reports/:id)', async () => {
      assert(Boolean(createdReportId), 'createdReportId should not be empty');
      const res = await fetch(`${BASE_URL}/reports/${createdReportId}`);
      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      const data = await res.json();
      assert(data.success === true, 'Expected success: true');
      assert(data.data.id === createdReportId, 'Expected matching report ID');
      assert(data.data.category === 'Hazardous Materials', 'Expected category Hazardous Materials');
    });

    // Authenticate Admin & Citizen for Protected Operational & AI Triage Tests
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@city.gov', password: 'CivicSense2026!' }),
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.token;
    const cookieHeader = adminLoginRes.headers.get('set-cookie');
    if (cookieHeader) authCookie = cookieHeader.split(';')[0];

    const citizenLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'citizen@civicsense.org', password: 'CivicSense2026!' }),
    });
    const citizenLoginData = await citizenLoginRes.json();
    citizenToken = citizenLoginData.token;

    // 7. Verify AI Multi-Agent Triage Insights Generation
    await test('7. AI Multi-Agent Triage Verification (GET /ai/insights/:reportId)', async () => {
      let insight: any = null;
      for (let attempt = 0; attempt < 30; attempt++) {
        const res = await fetch(`${BASE_URL}/ai/insights/${createdReportId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.data) && data.data.length > 0) {
            insight = data.data[0];
            break;
          }
        }
        await new Promise((r) => setTimeout(r, 100));
      }

      assert(Boolean(insight), 'Expected at least 1 AI insight generated for report');
      assert(insight.reportId === createdReportId, 'Expected insight to match reportId');
      assert(insight.triagePriority === 'CATASTROPHIC' || insight.triagePriority === 'CRITICAL', `Expected high priority for hazmat leak, got ${insight.triagePriority}`);
      assert(typeof insight.urgencyScore === 'number' && insight.urgencyScore >= 0.8, 'Expected urgency score >= 0.8');
      assert(typeof insight.sentimentIndex === 'number' && insight.sentimentIndex <= 0, 'Expected negative sentiment index for hazmat distress');
      assert(insight.targetDepartment.length > 0, 'Expected targetDepartment specified');
      assert(insight.confidenceScore >= 0.9, 'Expected confidenceScore >= 0.9');

      assert(Boolean(insight.agentEvaluations?.triageAgent), 'Expected Agent 1: Triage Agent evaluation');
      assert(Boolean(insight.agentEvaluations?.sentimentAgent), 'Expected Agent 2: Sentiment Agent evaluation');
      assert(Boolean(insight.agentEvaluations?.dispatchAgent), 'Expected Agent 3: Dispatch Agent evaluation');
    });

    // 8. Re-trigger On-Demand Multi-Agent Triage
    await test('8. Manual AI Triage Re-execution (POST /ai/triage/:reportId)', async () => {
      const res = await fetch(`${BASE_URL}/ai/triage/${createdReportId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      const data = await res.json();
      assert(data.success === true, 'Expected success: true');
      assert(data.data.reportId === createdReportId, 'Expected insight for created report');
    });

    // 9a. Authorization Guard: Reject Unauthenticated Status Update (401)
    await test('9a. Auth Guard: Reject Unauthenticated Status Update (401)', async () => {
      const res = await fetch(`${BASE_URL}/reports/${createdReportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DISPATCHED' }),
      });
      assert(res.status === 401, `Expected 401 Unauthorized without token, got ${res.status}`);
    });

    // 9b. Authorization Guard: Reject Citizen Status Update (403)
    await test('9b. Auth Guard: Reject Citizen Status Update (403)', async () => {
      const res = await fetch(`${BASE_URL}/reports/${createdReportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${citizenToken}`,
        },
        body: JSON.stringify({ status: 'DISPATCHED' }),
      });
      assert(res.status === 403, `Expected 403 Forbidden for Citizen, got ${res.status}`);
    });

    // 9. Update Report Status with Official/Admin Credentials
    await test('9. Status Transition to DISPATCHED by Authorized Staff (PATCH /reports/:id/status)', async () => {
      const res = await fetch(`${BASE_URL}/reports/${createdReportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'DISPATCHED' }),
      });

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      const data = await res.json();
      assert(data.success === true, 'Expected success: true');
      assert(data.data.status === 'DISPATCHED', `Expected DISPATCHED, got ${data.data.status}`);
    });

    // 10. Status Transition to RESOLVED with Official/Admin Credentials
    await test('10. Status Transition to RESOLVED by Authorized Staff (PATCH /reports/:id/status)', async () => {
      const res = await fetch(`${BASE_URL}/reports/${createdReportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'RESOLVED' }),
      });

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      const data = await res.json();
      assert(data.success === true, 'Expected success: true');
      assert(data.data.status === 'RESOLVED', `Expected RESOLVED, got ${data.data.status}`);
    });

    // 11. Fetch Telemetry Streams
    let targetSensorId = '';
    await test('11. Live Telemetry Inspection (GET /telemetry)', async () => {
      const res = await fetch(`${BASE_URL}/telemetry`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      const data = await res.json();
      assert(data.success === true, 'Expected success: true');
      assert(data.totalSensors >= 5, 'Expected at least 5 registered sensors');
      assert(Array.isArray(data.data), 'Expected telemetry array');
      targetSensorId = data.data[0].id;
    });

    // 12. Simulate Live Telemetry Spike & Anomaly Detection
    await test('12. Telemetry Anomaly Injection (POST /telemetry/simulate)', async () => {
      const res = await fetch(`${BASE_URL}/telemetry/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });
      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      const data = await res.json();
      assert(data.success === true, 'Expected success: true');
      assert(data.data.isAnomaly === true, 'Expected sensor to report isAnomaly: true');
      assert(data.data.metricValue > data.data.threshold, 'Expected metricValue > threshold');
    });

    // 13. Direct Sensor Calibration / Update
    await test('13. Sensor Reading Calibration (PATCH /telemetry/:id)', async () => {
      const res = await fetch(`${BASE_URL}/telemetry/${targetSensorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ metricValue: 95.0 }),
      });

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      const data = await res.json();
      assert(data.success === true, 'Expected success: true');
      assert(data.data.metricValue === 95.0, 'Expected metricValue to be 95.0');
    });

    // 14. Analytics Overview & Audit Log Verification
    await test('14. Analytics Overview & Audit Verification (GET /analytics/overview)', async () => {
      const res = await fetch(`${BASE_URL}/analytics/overview`);
      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      const data = await res.json();
      assert(data.success === true, 'Expected success: true');
      assert(typeof data.kpis.activeIncidents === 'number', 'Expected activeIncidents');
      assert(typeof data.kpis.totalSensors === 'number', 'Expected totalSensors');
      assert(typeof data.categoryDistribution === 'object', 'Expected categoryDistribution object');
      assert(Array.isArray(data.recentAuditLogs), 'Expected recentAuditLogs array');
      assert(data.recentAuditLogs.length > 0, 'Expected populated audit logs');
    });

    // 15. User Authentication - Login with Pre-seeded Administrator
    await test('15. Institutional Login & HttpOnly Cookie Set (POST /auth/login)', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@city.gov',
          password: 'CivicSense2026!',
        }),
      });

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      const data = await res.json();
      assert(data.success === true, 'Expected success: true');
      assert(data.user.role === 'ADMINISTRATOR', `Expected role ADMINISTRATOR, got ${data.user.role}`);
      assert(Boolean(data.token), 'Expected JWT token in response');

      const setCookie = res.headers.get('set-cookie');
      if (setCookie) {
        assert(setCookie.includes('HttpOnly'), 'Expected HttpOnly flag in cookie header');
      }
    });

    // 16. Authenticated Identity Verification via JWT Cookie / Token
    await test('16. Profile Verification (GET /auth/me)', async () => {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          ...(authCookie ? { Cookie: authCookie } : {}),
        },
      });

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      const data = await res.json();
      assert(data.success === true, 'Expected success: true');
      assert(data.user.email === 'admin@city.gov', 'Expected user email admin@city.gov');
      assert(data.user.role === 'ADMINISTRATOR', 'Expected user role ADMINISTRATOR');
    });

    // 17. Citizen User Registration with Role Escalation Prevention
    await test('17. Citizen Registration & Role Escalation Prevention (POST /auth/register)', async () => {
      const newCitizenEmail = `citizen.${Date.now()}@civicsense.org`;
      // Attempt to register as ADMINISTRATOR - server MUST force CITIZEN
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newCitizenEmail,
          password: 'CitizenSecurePass2026!',
          fullName: 'Alex Mercer',
          role: 'ADMINISTRATOR',
        }),
      });

      assert(res.status === 201, `Expected 201 Created, got ${res.status}`);
      const data = await res.json();
      assert(data.success === true, 'Expected success: true');
      assert(data.user.email === newCitizenEmail, 'Expected matching email');
      assert(data.user.role === 'CITIZEN', `Expected server to force CITIZEN role, got ${data.user.role}`);
    });

    // 18. Invalid Credentials Rejection
    await test('18. Invalid Password Rejection (POST /auth/login with wrong pass)', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@city.gov',
          password: 'WrongPassword!',
        }),
      });

      assert(res.status === 401, `Expected 401 Unauthorized, got ${res.status}`);
      const data = await res.json();
      assert(data.success === false, 'Expected success: false');
    });

    // 19. Institutional Logout & Cookie Clearing
    await test('19. Session Logout (POST /auth/logout)', async () => {
      const res = await fetch(`${BASE_URL}/auth/logout`, { method: 'POST' });
      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      const data = await res.json();
      assert(data.success === true, 'Expected success: true');
    });

    // 20. Development Seed Records & Bcrypt Verification in supabase/seed.sql
    await test('20. Development Seed Data in supabase/seed.sql & Bcrypt Hash Verification', async () => {
      const seedPath = path.resolve(process.cwd(), '../supabase/seed.sql');
      assert(fs.existsSync(seedPath), 'supabase/seed.sql must exist');

      const seedSql = fs.readFileSync(seedPath, 'utf-8');

      const accountsToVerify = [
        {
          id: 'usr-admin-01',
          email: 'admin@city.gov',
          password: 'CivicSense2026!',
          expectedRole: 'ADMINISTRATOR',
        },
        {
          id: 'usr-official-01',
          email: 'official@city.gov',
          password: 'CivicSense2026!',
          expectedRole: 'CIVIC_OFFICIAL',
        },
        {
          id: 'usr-citizen-01',
          email: 'citizen@civicsense.org',
          password: 'CivicSense2026!',
          expectedRole: 'CITIZEN',
        },
        {
          id: 'usr-citizen-demo',
          email: 'alex.rivera@community.org',
          password: 'citizen1234',
          expectedRole: 'CITIZEN',
        },
        {
          id: 'usr-official-demo',
          email: 'a.pendelton@cityfix.gov',
          password: 'director2026',
          expectedRole: 'CIVIC_OFFICIAL',
        },
      ];

      for (const account of accountsToVerify) {
        // Find line in seed.sql for account.id
        const userLineRegex = new RegExp(`'${account.id}',\\s*\\r?\\n\\s*'${account.email}',\\s*\\r?\\n\\s*'([^']+)'`, 'm');
        const match = seedSql.match(userLineRegex);
        assert(Boolean(match), `Could not find seeded user record for ${account.id} in supabase/seed.sql`);

        const hash = match![1];
        assert(hash.startsWith('$2b$10$'), `Hash for ${account.id} in seed.sql is not a valid bcrypt format`);

        const isMatch = await bcrypt.compare(account.password, hash);
        assert(isMatch, `Bcrypt verification failed for account ${account.id} (${account.email}) with intended password`);

        // Test login API endpoint with this account in development/test environment
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: account.email, password: account.password }),
        });
        assert(loginRes.status === 200, `Login API failed for seeded account ${account.id}: HTTP ${loginRes.status}`);
        const loginData = await loginRes.json();
        assert(loginData.user.role === account.expectedRole, `Expected role ${account.expectedRole}, got ${loginData.user.role}`);
      }
    });

    // 21. API Role Escalation Guard Verification
    await test('21. API Role Escalation Guard: Prevent Privilege Escalation on Registration & State Changes', async () => {
      // 21a. Attempt to register as ADMINISTRATOR
      const adminAttemptRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `admin.attack.${Date.now()}@example.org`,
          password: 'Password12345!',
          fullName: 'Malicious Attacker',
          role: 'ADMINISTRATOR',
        }),
      });
      assert(adminAttemptRes.status === 201, `Expected 201, got ${adminAttemptRes.status}`);
      const adminAttemptData = await adminAttemptRes.json();
      assert(adminAttemptData.user.role === 'CITIZEN', `Server allowed privilege escalation to ${adminAttemptData.user.role}`);

      // 21b. Attempt to register as CIVIC_OFFICIAL
      const officialAttemptRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `official.attack.${Date.now()}@example.org`,
          password: 'Password12345!',
          fullName: 'Malicious Official',
          role: 'CIVIC_OFFICIAL',
        }),
      });
      assert(officialAttemptRes.status === 201, `Expected 201, got ${officialAttemptRes.status}`);
      const officialAttemptData = await officialAttemptRes.json();
      assert(officialAttemptData.user.role === 'CITIZEN', `Server allowed privilege escalation to ${officialAttemptData.user.role}`);

      // 21c. Citizen token cannot update report status
      const citizenLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'citizen@civicsense.org', password: 'CivicSense2026!' }),
      });
      const citizenLoginData = await citizenLoginRes.json();
      const nonPrivilegedToken = citizenLoginData.token;

      const forbiddenRes = await fetch(`${BASE_URL}/reports/${createdReportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${nonPrivilegedToken}`,
        },
        body: JSON.stringify({ status: 'RESOLVED' }),
      });
      assert(forbiddenRes.status === 403, `Expected 403 Forbidden for non-privileged citizen role, got ${forbiddenRes.status}`);
    });

    // 22. Supabase Migration RLS Security Audit & Access Revocation
    await test('22. Supabase Migration RLS Audit: Anonymous Access Revoked & Broad Public SELECT Policies Removed', async () => {
      const serverMigrationPath = path.resolve(process.cwd(), 'src/db/migrations/20261013000000_civicflow_schema.sql');
      const rootMigrationPath = path.resolve(process.cwd(), '../supabase/migrations/20261013000000_civicflow_schema.sql');

      assert(fs.existsSync(serverMigrationPath), 'Server migration file must exist');
      assert(fs.existsSync(rootMigrationPath), 'Root supabase migration file must exist');

      const serverSql = fs.readFileSync(serverMigrationPath, 'utf-8');
      const requiredTables = ['civic_users', 'civic_reports', 'telemetry_streams', 'ai_insights', 'audit_logs'];

      // 22a. Verify RLS is enabled on all 5 required tables
      for (const table of requiredTables) {
        assert(
          serverSql.includes(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`),
          `Table ${table} must have ROW LEVEL SECURITY explicitly enabled`
        );
      }

      // 22b. Verify REVOKE ALL from anon, authenticated, public on all 5 tables
      for (const table of requiredTables) {
        assert(
          serverSql.includes(`REVOKE ALL ON ${table} FROM anon, authenticated, public;`),
          `All privileges on ${table} must be explicitly revoked from anon, authenticated, and public`
        );
      }

      // 22c. Verify service_role privileges are granted
      for (const table of requiredTables) {
        assert(
          serverSql.includes(`GRANT ALL ON ${table} TO service_role;`),
          `service_role must be granted ALL permissions on ${table}`
        );
      }

      // 22d. Verify legacy permissive SELECT policies are dropped
      const unsafeDroppedPolicies = [
        'Public & authenticated can read reports',
        'Allow public read-only access to reports',
        'Allow public read-only access to telemetry',
        'Allow public read-only access to AI insights',
      ];
      for (const policy of unsafeDroppedPolicies) {
        assert(
          serverSql.includes(`DROP POLICY IF EXISTS "${policy}"`),
          `Migration must explicitly drop unsafe legacy policy "${policy}"`
        );
      }

      // 22e. Verify NO permissive USING (true) policies exist for anon/public
      assert(!serverSql.includes('TO anon, authenticated\n  USING (true)'), 'Must not grant permissive access to anon');
      assert(!serverSql.includes('TO anon\n  USING (true)'), 'Must not grant permissive access to anon');
      assert(!serverSql.includes('TO public\n  USING (true)'), 'Must not grant permissive access to public');

      // 22f. Verify explicit restrictive denial policies exist for all 5 tables
      for (const table of requiredTables) {
        assert(
          serverSql.includes(`ON ${table} AS RESTRICTIVE FOR ALL TO anon, authenticated\n  USING (false)\n  WITH CHECK (false);`),
          `Table ${table} must have an explicit restrictive denial policy for anon and authenticated`
        );
      }
    });

    // 23. Complete Removal of Demo Seeds & Environment Guards from Migration SQL
    await test('23. Migration SQL Contains Zero Demo INSERT Statements or Unreliable Guards', async () => {
      const serverMigrationPath = path.resolve(process.cwd(), 'src/db/migrations/20261013000000_civicflow_schema.sql');
      const rootMigrationPath = path.resolve(process.cwd(), '../supabase/migrations/20261013000000_civicflow_schema.sql');

      for (const filePath of [serverMigrationPath, rootMigrationPath]) {
        const sql = fs.readFileSync(filePath, 'utf-8');

        // Must not contain any demo table inserts
        assert(!sql.includes('INSERT INTO civic_users'), `${filePath} must not contain demo INSERT INTO civic_users`);
        assert(!sql.includes('INSERT INTO civic_reports'), `${filePath} must not contain demo INSERT INTO civic_reports`);
        assert(!sql.includes('INSERT INTO telemetry_streams'), `${filePath} must not contain demo INSERT INTO telemetry_streams`);
        assert(!sql.includes('INSERT INTO ai_insights'), `${filePath} must not contain demo INSERT INTO ai_insights`);

        // Must not contain unreliable environment guard
        assert(!sql.includes("current_setting('app.environment'"), `${filePath} must not contain unreliable environment guard`);

        // Must not contain predictable demo account identifiers
        assert(!sql.includes('admin@city.gov'), `${filePath} must not contain demo admin email`);
        assert(!sql.includes('CivicSense2026!'), `${filePath} must not contain demo password hashes`);
      }
    });

    // 24. Mirrored Migration Byte-for-Byte Synchronization
    await test('24. Server and Supabase Schema Migrations are Byte-for-Byte Identical', async () => {
      const serverMigrationPath = path.resolve(process.cwd(), 'src/db/migrations/20261013000000_civicflow_schema.sql');
      const rootMigrationPath = path.resolve(process.cwd(), '../supabase/migrations/20261013000000_civicflow_schema.sql');

      const serverSql = fs.readFileSync(serverMigrationPath, 'utf-8');
      const rootSql = fs.readFileSync(rootMigrationPath, 'utf-8');

      assert(serverSql === rootSql, 'Server migration and Supabase migration must be 100% byte-for-byte identical');
    });

    // 25. Supabase CLI Configuration Workflow (supabase/config.toml)
    await test('25. Supabase CLI Configuration: Seed Path Configured Only for Development Reset', async () => {
      const configPath = path.resolve(process.cwd(), '../supabase/config.toml');
      assert(fs.existsSync(configPath), 'supabase/config.toml must exist');

      const configToml = fs.readFileSync(configPath, 'utf-8');
      assert(configToml.includes('[db.seed]'), 'config.toml must configure [db.seed]');
      assert(configToml.includes('enabled = true'), 'config.toml must enable [db.seed]');
      assert(configToml.includes('sql_paths = ["supabase/seed.sql"]'), 'config.toml must specify supabase/seed.sql path');
    });

    // 26. Production Configuration Fail-Safe Enforcement
    await test('26. Production Configuration Fail-Safe: Enforce SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY', async () => {
      const { validateSupabaseConfig } = await import('../config/supabase.js');

      // Case 1: Missing SUPABASE_URL in production -> throws
      let threwUrl = false;
      try {
        validateSupabaseConfig({
          NODE_ENV: 'production',
          SUPABASE_URL: '',
          SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
        } as any);
      } catch (err: any) {
        threwUrl = true;
        assert(err.message.includes('Missing or invalid SUPABASE_URL'), `Unexpected error message: ${err.message}`);
      }
      assert(threwUrl, 'Must throw error when SUPABASE_URL is missing in production');

      // Case 2: Missing SUPABASE_SERVICE_ROLE_KEY in production -> throws
      let threwKey = false;
      try {
        validateSupabaseConfig({
          NODE_ENV: 'production',
          SUPABASE_URL: 'https://example.supabase.co',
          SUPABASE_SERVICE_ROLE_KEY: '',
        } as any);
      } catch (err: any) {
        threwKey = true;
        assert(err.message.includes('Missing SUPABASE_SERVICE_ROLE_KEY'), `Unexpected error message: ${err.message}`);
      }
      assert(threwKey, 'Must throw error when SUPABASE_SERVICE_ROLE_KEY is missing in production');

      // Case 3: Valid production configuration -> succeeds
      let passedValid = false;
      try {
        validateSupabaseConfig({
          NODE_ENV: 'production',
          SUPABASE_URL: 'https://example.supabase.co',
          SUPABASE_SERVICE_ROLE_KEY: 'valid-secret-service-role-key',
        } as any);
        passedValid = true;
      } catch {
        passedValid = false;
      }
      assert(passedValid, 'Must pass validation when production configuration is fully provided');
    });

    // 27. Production Hydration Failure & Unreadiness Gate
    await test('27. Production Startup Readiness Gate: Database Hydration Failure Blocks Unready Traffic', async () => {
      const { InMemoryStore, DatabaseUnavailableError } = await import('../db/store.js');

      // Save environment state before simulating unconfigured production database
      const originalEnv = process.env.NODE_ENV;
      const originalUrl = process.env.SUPABASE_URL;
      const originalServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const originalAnonKey = process.env.SUPABASE_ANON_KEY;

      process.env.NODE_ENV = 'production';
      process.env.SUPABASE_URL = 'https://placeholder-project.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = '';
      delete process.env.SUPABASE_ANON_KEY;

      try {
        const prodStore = new InMemoryStore();
        // In production, isReady starts false until hydration succeeds
        assert(prodStore.isReady === false, 'Production store must not be marked ready before hydration completes');

        // Trying to wait for hydration with invalid config must reject with DatabaseUnavailableError
        let hydrationFailed = false;
        try {
          await prodStore.waitForHydration();
        } catch (err: any) {
          hydrationFailed = true;
          assert(
            err instanceof DatabaseUnavailableError || err.statusCode === 503,
            `Expected DatabaseUnavailableError (503), got: ${err.name}`
          );
        }
        assert(hydrationFailed, 'Production store must reject hydration when database connection is unconfigured or failed');
      } finally {
        if (originalEnv !== undefined) {
          process.env.NODE_ENV = originalEnv;
        } else {
          delete process.env.NODE_ENV;
        }

        if (originalUrl !== undefined) {
          process.env.SUPABASE_URL = originalUrl;
        } else {
          delete process.env.SUPABASE_URL;
        }

        if (originalServiceKey !== undefined) {
          process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceKey;
        } else {
          delete process.env.SUPABASE_SERVICE_ROLE_KEY;
        }

        if (originalAnonKey !== undefined) {
          process.env.SUPABASE_ANON_KEY = originalAnonKey;
        } else {
          delete process.env.SUPABASE_ANON_KEY;
        }
      }
    });

    // 28. Zero Silent Fallback & Strict Persistence Error Propagation
    await test('28. Strict Persistence Enforcement: Reject Write Operations with 503/500 When Database Unavailable', async () => {
      const { InMemoryStore, DatabaseUnavailableError } = await import('../db/store.js');

      const originalEnv = process.env.NODE_ENV;
      const originalUrl = process.env.SUPABASE_URL;
      const originalServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const originalAnonKey = process.env.SUPABASE_ANON_KEY;

      process.env.NODE_ENV = 'production';
      process.env.SUPABASE_URL = 'https://placeholder-project.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = '';
      delete process.env.SUPABASE_ANON_KEY;

      try {
        const prodStore = new InMemoryStore();

        // 28a. User creation must throw DatabaseUnavailableError, not silently succeed
        let userFailed = false;
        try {
          await prodStore.createUserAsync({
            id: 'usr-test-prod',
            email: 'test.prod@example.org',
            passwordHash: 'dummyhash',
            fullName: 'Prod Test',
            role: 'CITIZEN',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } catch (err: any) {
          userFailed = true;
          assert(
            err instanceof DatabaseUnavailableError || err.statusCode === 503,
            `Expected 503 DatabaseUnavailableError, got ${err}`
          );
        }
        assert(userFailed, 'createUserAsync must propagate database failure instead of silently writing to memory');

        // 28b. Report creation must throw DatabaseUnavailableError, not silently succeed
        let reportFailed = false;
        try {
          await prodStore.addReportAsync({
            id: 'rep-test-prod',
            trackingCode: 'CIV-2026-TEST',
            title: 'Test Incident',
            description: 'Incident report under DB outage',
            category: 'Sanitation',
            priority: 'LOW',
            status: 'RECEIVED',
            latitude: 40.71,
            longitude: -74.00,
            locationAddress: 'Test Ave',
            mediaUrls: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } catch (err: any) {
          reportFailed = true;
          assert(
            err instanceof DatabaseUnavailableError || err.statusCode === 503,
            `Expected 503 DatabaseUnavailableError, got ${err}`
          );
        }
        assert(reportFailed, 'addReportAsync must propagate database failure instead of silently writing to memory');

        // 28c. Telemetry update must throw DatabaseUnavailableError
        let telemetryFailed = false;
        try {
          await prodStore.updateTelemetryAsync('tel-1', 99.9);
        } catch (err: any) {
          telemetryFailed = true;
          assert(
            err instanceof DatabaseUnavailableError || err.statusCode === 503,
            `Expected 503 DatabaseUnavailableError, got ${err}`
          );
        }
        assert(telemetryFailed, 'updateTelemetryAsync must propagate database failure instead of silently updating memory');

        // 28d. AI Insight creation must throw DatabaseUnavailableError
        let insightFailed = false;
        try {
          await prodStore.addInsightAsync({
            id: 'ins-test-prod',
            reportId: 'rep-test',
            triagePriority: 'LOW',
            urgencyScore: 0.1,
            sentimentIndex: 0.0,
            summary: 'Test summary',
            suggestedAction: 'Action',
            targetDepartment: 'Dept',
            confidenceScore: 0.9,
            agentEvaluations: {
              triageAgent: { hazardSeverity: 'Low', infrastructuralVulnerability: 'None' },
              sentimentAgent: { publicAgitation: 'Low', cascadeRisk: 'None' },
              dispatchAgent: { workOrderType: 'ROUTINE', crewTierRequired: 'Tier 3', estimatedResolutionHours: 24 },
            },
            createdAt: new Date().toISOString(),
          });
        } catch (err: any) {
          insightFailed = true;
          assert(
            err instanceof DatabaseUnavailableError || err.statusCode === 503,
            `Expected 503 DatabaseUnavailableError, got ${err}`
          );
        }
        assert(insightFailed, 'addInsightAsync must propagate database failure instead of silently adding to memory');

        // 28e. findUserByEmailAsync must throw DatabaseUnavailableError
        let lookupFailed = false;
        try {
          await prodStore.findUserByEmailAsync('admin@city.gov');
        } catch (err: any) {
          lookupFailed = true;
          assert(
            err instanceof DatabaseUnavailableError || err.statusCode === 503,
            `Expected 503 DatabaseUnavailableError, got ${err}`
          );
        }
        assert(lookupFailed, 'findUserByEmailAsync must propagate database failure in production');
      } finally {
        if (originalEnv !== undefined) {
          process.env.NODE_ENV = originalEnv;
        } else {
          delete process.env.NODE_ENV;
        }

        if (originalUrl !== undefined) {
          process.env.SUPABASE_URL = originalUrl;
        } else {
          delete process.env.SUPABASE_URL;
        }

        if (originalServiceKey !== undefined) {
          process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceKey;
        } else {
          delete process.env.SUPABASE_SERVICE_ROLE_KEY;
        }

        if (originalAnonKey !== undefined) {
          process.env.SUPABASE_ANON_KEY = originalAnonKey;
        } else {
          delete process.env.SUPABASE_ANON_KEY;
        }
      }
    });

    // 29. Client-Side Security & Zero Secret Exposure
    await test('29. Client Library Security: No Direct Anon Database Access or Secret Key Exposure', async () => {
      const clientLibPath = path.resolve(process.cwd(), '../client/src/lib/supabase.ts');
      assert(fs.existsSync(clientLibPath), 'client/src/lib/supabase.ts must exist');

      const clientContent = fs.readFileSync(clientLibPath, 'utf-8');

      // Must not create direct Supabase client in the browser
      assert(!clientContent.includes('createClient('), 'client/src/lib/supabase.ts must not instantiate direct createClient');

      // Must not expose service-role key or hardcoded tokens
      assert(!clientContent.includes('service_role'), 'client/src/lib/supabase.ts must not contain service_role');
      assert(!clientContent.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'), 'client/src/lib/supabase.ts must not contain hardcoded JWTs');

      // Health check must be mediated through Express backend
      assert(clientContent.includes('/api/v1/health'), 'Health check must be mediated via /api/v1/health');
    });

    // 30. Local Development & Automated Tests Operate Without Remote Database
    await test('30. Local Development & Test Isolation: Operates Smoothly Offline Without Supabase Connection', async () => {
      assert(process.env.NODE_ENV === 'test', 'Test environment must be set to test');
      const res = await fetch(`${BASE_URL}/health`);
      assert(res.status === 200, 'Test server must remain healthy in local test mode');
      const data = await res.json();
      assert(data.status === 'OPERATIONAL', 'Status must be OPERATIONAL in test mode');
    });

    // 31. Telemetry Route Access Control & Role Enforcement
    await test('31. Telemetry Security: Authentication and Role Enforcement (401 / 403 / 200)', async () => {
      // 31a. Unauthenticated GET /telemetry -> 401
      const unauthGet = await fetch(`${BASE_URL}/telemetry`);
      assert(unauthGet.status === 401, `Unauthenticated GET /telemetry must return 401, got ${unauthGet.status}`);

      // Authenticate citizen
      const citizenLogin = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'citizen@civicsense.org', password: 'CivicSense2026!' }),
      });
      assert(citizenLogin.status === 200, 'Citizen login failed');
      const citizenData = await citizenLogin.json();
      const citizenAuthHeader = { Authorization: `Bearer ${citizenData.token}` };

      // 31b. Authenticated citizen GET /telemetry -> 200
      const citizenGet = await fetch(`${BASE_URL}/telemetry`, { headers: citizenAuthHeader });
      assert(citizenGet.status === 200, `Citizen GET /telemetry must return 200, got ${citizenGet.status}`);

      // 31c. Unauthenticated PATCH /telemetry/tel-1 -> 401
      const unauthPatch = await fetch(`${BASE_URL}/telemetry/tel-1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metricValue: 99.5 }),
      });
      assert(unauthPatch.status === 401, `Unauthenticated PATCH /telemetry must return 401, got ${unauthPatch.status}`);

      // 31d. Citizen PATCH /telemetry/tel-1 -> 403 Forbidden
      const citizenPatch = await fetch(`${BASE_URL}/telemetry/tel-1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...citizenAuthHeader },
        body: JSON.stringify({ metricValue: 99.5 }),
      });
      assert(citizenPatch.status === 403, `Citizen PATCH /telemetry must return 403, got ${citizenPatch.status}`);

      // Authenticate official
      const officialLogin = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'official@city.gov', password: 'CivicSense2026!' }),
      });
      assert(officialLogin.status === 200, 'Official login failed');
      const officialData = await officialLogin.json();
      const officialAuthHeader = { Authorization: `Bearer ${officialData.token}` };

      // 31e. Official PATCH /telemetry/tel-1 -> 200 OK
      const officialPatch = await fetch(`${BASE_URL}/telemetry/tel-1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...officialAuthHeader },
        body: JSON.stringify({ metricValue: 125.0 }),
      });
      assert(officialPatch.status === 200, `Official PATCH /telemetry must return 200, got ${officialPatch.status}`);

      // 31f. Citizen POST /telemetry/simulate -> 403 Forbidden
      const citizenSimulate = await fetch(`${BASE_URL}/telemetry/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...citizenAuthHeader },
        body: JSON.stringify({ sensorId: 'tel-1', spikeDelta: 40 }),
      });
      assert(citizenSimulate.status === 403, `Citizen POST /telemetry/simulate must return 403, got ${citizenSimulate.status}`);

      // 31g. Official POST /telemetry/simulate -> 200 OK
      const officialSimulate = await fetch(`${BASE_URL}/telemetry/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...officialAuthHeader },
        body: JSON.stringify({ sensorId: 'tel-1', spikeDelta: 40 }),
      });
      assert(officialSimulate.status === 200, `Official POST /telemetry/simulate must return 200, got ${officialSimulate.status}`);
    });

    // 32. AI Triage Route Security & Role Enforcement
    await test('32. AI Triage Security: Authentication, Role Authorization, and Report Validation', async () => {
      // 32a. Unauthenticated POST /ai/triage/rep-1 -> 401
      const unauthTriage = await fetch(`${BASE_URL}/ai/triage/rep-1`, { method: 'POST' });
      assert(unauthTriage.status === 401, `Unauthenticated POST /ai/triage must return 401, got ${unauthTriage.status}`);

      // Authenticate citizen & official
      const citizenLogin = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'citizen@civicsense.org', password: 'CivicSense2026!' }),
      });
      const citizenData = await citizenLogin.json();
      const citizenAuthHeader = { Authorization: `Bearer ${citizenData.token}` };

      const officialLogin = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'official@city.gov', password: 'CivicSense2026!' }),
      });
      const officialData = await officialLogin.json();
      const officialAuthHeader = { Authorization: `Bearer ${officialData.token}` };

      // 32b. Citizen POST /ai/triage/rep-1 -> 403 Forbidden
      const citizenTriage = await fetch(`${BASE_URL}/ai/triage/rep-1`, {
        method: 'POST',
        headers: citizenAuthHeader,
      });
      assert(citizenTriage.status === 403, `Citizen POST /ai/triage must return 403, got ${citizenTriage.status}`);

      // 32c. Unauthenticated GET /ai/insights/rep-1 -> 401
      const unauthInsights = await fetch(`${BASE_URL}/ai/insights/rep-1`);
      assert(unauthInsights.status === 401, `Unauthenticated GET /ai/insights must return 401, got ${unauthInsights.status}`);

      // 32d. Authenticated GET /ai/insights/rep-1 -> 200
      const authInsights = await fetch(`${BASE_URL}/ai/insights/rep-1`, { headers: citizenAuthHeader });
      assert(authInsights.status === 200, `Authenticated GET /ai/insights must return 200, got ${authInsights.status}`);

      // 32e. Official POST /ai/triage with non-existent reportId -> 404
      const nonExistentTriage = await fetch(`${BASE_URL}/ai/triage/rep-nonexistent-999`, {
        method: 'POST',
        headers: officialAuthHeader,
      });
      assert(nonExistentTriage.status === 404, `Non-existent report triage must return 404, got ${nonExistentTriage.status}`);
    });

  } finally {
    if (runningServer) {
      runningServer.close();
    }
  }

  // Summary
  console.log('\n===============================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  console.log(`   TEST EXECUTION COMPLETED: ${passedCount}/${totalCount} TESTS PASSED`);
  console.log('===============================================================');

  if (passedCount !== totalCount) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite runner crashed:', err);
  process.exit(1);
});
