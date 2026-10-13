import { CivicReport, TelemetryStream, AIInsight, AuditLog, User } from '../types/index.js';
import bcrypt from 'bcrypt';
import { supabase } from '../config/supabase.js';
import { DatabaseUnavailableError, PersistenceError, mapDatabaseError } from './errors.js';

export { DatabaseUnavailableError, PersistenceError, mapDatabaseError };

export class InMemoryStore {
  private users: Map<string, User> = new Map();
  private reports: Map<string, CivicReport> = new Map();
  private telemetry: Map<string, TelemetryStream> = new Map();
  private insights: Map<string, AIInsight> = new Map();
  private auditLogs: AuditLog[] = [];
  private pendingReportSyncs: Map<string, Promise<void>> = new Map();

  public isReady: boolean = false;
  public isHydrated: boolean = false;
  public hydrationError: Error | null = null;
  public hydrationPromise: Promise<void> | null = null;

  constructor() {
    const isProd = process.env.NODE_ENV === 'production';
    if (!isProd) {
      // Local development and test environments use local mock data
      this.seedInitialData();
      this.isReady = true;
      if (!this.isTest()) {
        this.hydrationPromise = this.hydrateFromSupabase().catch((err) => {
          // Non-production environments log warning and continue using memory store
          console.warn('[Supabase Dev Hydration] Non-critical warning:', err?.message || err);
        });
      }
    } else {
      // Production strictly requires verified remote database hydration
      this.isReady = false;
      this.hydrationPromise = this.hydrateFromSupabase().catch((err) => {
        this.hydrationError = err;
        this.isReady = false;
      });
    }
  }

  public async waitForHydration(): Promise<void> {
    if (this.isTest()) {
      this.isReady = true;
      this.isHydrated = true;
      return;
    }
    if (this.hydrationPromise) {
      await this.hydrationPromise;
    }
    if (process.env.NODE_ENV === 'production' && !this.isReady) {
      throw this.hydrationError || new DatabaseUnavailableError('Production database hydration failed.');
    }
  }

  private isTest(): boolean {
    return process.env.NODE_ENV === 'test';
  }

  private isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  private seedInitialData() {
    // 0. Seeded Institutional Users with Bcrypt Hashes (Development & Testing only)
    const passwordHash = bcrypt.hashSync('CivicSense2026!', 10);
    const initialUsers: User[] = [
      {
        id: 'usr-admin-01',
        email: 'admin@city.gov',
        passwordHash,
        fullName: 'Chief Director Marcus Vance',
        role: 'ADMINISTRATOR',
        badgeNumber: 'DIR-001',
        department: 'Municipal Operations Bureau',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'usr-official-01',
        email: 'official@city.gov',
        passwordHash,
        fullName: 'Commander Elena Vance',
        role: 'CIVIC_OFFICIAL',
        badgeNumber: 'DSP-442',
        department: 'Bureau of Water & Municipal Engineering',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'usr-citizen-01',
        email: 'citizen@civicsense.org',
        passwordHash,
        fullName: 'Sarah Jenkins',
        role: 'CITIZEN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'usr-citizen-demo',
        email: 'alex.rivera@community.org',
        passwordHash: bcrypt.hashSync('citizen1234', 10),
        fullName: 'Alex Rivera',
        role: 'CITIZEN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'usr-official-demo',
        email: 'a.pendelton@cityfix.gov',
        passwordHash: bcrypt.hashSync('director2026', 10),
        fullName: 'Director Arthur Pendelton',
        role: 'CIVIC_OFFICIAL',
        badgeNumber: 'DIR-RPW',
        department: 'Roads Directorate',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    initialUsers.forEach(u => this.users.set(u.id, u));

    // 1. Initial Municipal Telemetry Sensors
    const initialSensors: TelemetryStream[] = [
      {
        id: 'tel-1',
        sensorId: 'SNSR-WTR-042',
        sensorName: 'Central Aqueduct Main Pipeline',
        sensorType: 'WATER_LEVEL_METRIC',
        metricValue: 148.5,
        unit: 'psi',
        threshold: 120.0,
        isAnomaly: true,
        latitude: 40.7128,
        longitude: -74.0060,
        location: 'Sector 4 Aqueduct Vault',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'tel-2',
        sensorId: 'SNSR-PWR-901',
        sensorName: 'East Grid Substation 12 kV Bus',
        sensorType: 'POWER_GRID_VOLTAGE',
        metricValue: 12.1,
        unit: 'kV',
        threshold: 13.5,
        isAnomaly: false,
        latitude: 40.7282,
        longitude: -73.9942,
        location: 'District 2 Power Transfer Node',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'tel-3',
        sensorId: 'SNSR-AQI-108',
        sensorName: 'Industrial Corridor Particulate Sensor',
        sensorType: 'AIR_QUALITY_PPM',
        metricValue: 42.4,
        unit: 'ppm',
        threshold: 75.0,
        isAnomaly: false,
        latitude: 40.7410,
        longitude: -74.0120,
        location: 'West Logistics Terminal',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'tel-4',
        sensorId: 'SNSR-TRF-505',
        sensorName: 'Grand Boulevard Arterial Flow',
        sensorType: 'TRAFFIC_SENSOR',
        metricValue: 88.0,
        unit: 'dens/km',
        threshold: 80.0,
        isAnomaly: true,
        latitude: 40.7505,
        longitude: -73.9850,
        location: 'Grand Blvd & 34th Intersection',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'tel-5',
        sensorId: 'SNSR-VIB-221',
        sensorName: 'Harbor Bridge Pylon Vibration Array',
        sensorType: 'STRUCTURAL_VIBRATION',
        metricValue: 1.15,
        unit: 'mm/s²',
        threshold: 2.50,
        isAnomaly: false,
        latitude: 40.7061,
        longitude: -73.9969,
        location: 'South Suspension Anchor Point',
        timestamp: new Date().toISOString(),
      },
    ];
    initialSensors.forEach(s => this.telemetry.set(s.id, s));

    // 2. Initial Reports
    const initialReports: CivicReport[] = [
      {
        id: 'rep-1',
        trackingCode: 'CIV-2026-1049',
        title: 'Severe High Pressure Aqueduct Valve Rupture',
        description: 'Underground conduit rupture releasing pressurized potable water onto pedestrian plaza. Sub-surface erosion hazard suspected.',
        category: 'Water Grid',
        priority: 'CRITICAL',
        status: 'DISPATCHED',
        latitude: 40.7128,
        longitude: -74.0060,
        locationAddress: 'Civic Plaza North, Sector 4 Aqueduct Vault',
        mediaUrls: [],
        authorId: 'usr-citizen-01',
        createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
      {
        id: 'rep-2',
        trackingCode: 'CIV-2026-1048',
        title: 'Autonomous Transit Lane Signal Synchronization Interruption',
        description: 'Repeated signal dropout at Bay Street node causing headway compression and bus queuing across 4 blocks.',
        category: 'Roads & Transit',
        priority: 'ELEVATED',
        status: 'TRIAGED',
        latitude: 40.7505,
        longitude: -73.9850,
        locationAddress: 'Bay Street Corridor & 34th Interchange',
        mediaUrls: [],
        authorId: 'usr-citizen-demo',
        createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      },
      {
        id: 'rep-3',
        trackingCode: 'CIV-2026-1047',
        title: 'Substation Transformer Phase Unbalance Alert',
        description: 'Telemetry triggered automated alert for phase delta surge on 12kV line following lightning strike.',
        category: 'Power Grid',
        priority: 'CRITICAL',
        status: 'TRIAGED',
        latitude: 40.7282,
        longitude: -73.9942,
        locationAddress: 'East District Power Transfer Node 3',
        mediaUrls: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
      {
        id: 'rep-4',
        trackingCode: 'CIV-2026-1046',
        title: 'Storm Drain Blockage Causing Low-Lying Street Pooling',
        description: 'Accumulation of organic debris obstructing dual storm intake grates after torrential rain front.',
        category: 'Sanitation',
        priority: 'LOW',
        status: 'RESOLVED',
        latitude: 40.7300,
        longitude: -74.0010,
        locationAddress: 'Elmwood Avenue at 9th Crossroad',
        mediaUrls: [],
        authorId: 'usr-citizen-01',
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
    ];
    initialReports.forEach(r => this.reports.set(r.id, r));

    // 3. Initial AI Insights
    const initialInsight: AIInsight = {
      id: 'ins-1',
      reportId: 'rep-1',
      triagePriority: 'CRITICAL',
      urgencyScore: 0.94,
      sentimentIndex: -0.82,
      summary: 'Critical hydraulic surge event posing immediate structural undermining risk to Civic Plaza foundation. Telemetry SNSR-WTR-042 confirms 148.5 psi spike.',
      suggestedAction: 'Immediate isolation of Section 4 valve gates; dispatch Rapid Emergency Repair Unit 4 with backflow containment gear.',
      targetDepartment: 'Bureau of Water Supply & Municipal Engineering',
      confidenceScore: 0.98,
      agentEvaluations: {
        triageAgent: {
          hazardSeverity: 'Level 4 (Severe Foundation & Hydraulic Loss)',
          infrastructuralVulnerability: 'High probability of roadway sinkhole formation',
        },
        sentimentAgent: {
          publicAgitation: 'Elevated distress reported on municipal social channels',
          cascadeRisk: 'Disruption to 14,000 downstream residential taps',
        },
        dispatchAgent: {
          workOrderType: 'HYDRAULIC_EMERGENCY_SHUTDOWN',
          crewTierRequired: 'Tier 1 Certified Utility Crew',
          estimatedResolutionHours: 3.5,
        },
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 16).toISOString(),
    };
    this.insights.set(initialInsight.id, initialInsight);
  }

  public isSupabaseConfigured(): boolean {
    if (this.isTest()) {
      return false;
    }
    const url = process.env.SUPABASE_URL;
    if (!url || url.includes('placeholder-project')) return false;
    if (this.isProduction()) {
      return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    }
    return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);
  }

  async hydrateFromSupabase(): Promise<void> {
    if (this.isTest()) {
      this.isReady = true;
      this.isHydrated = true;
      return;
    }
    if (!this.isSupabaseConfigured()) {
      if (this.isProduction()) {
        const err = new DatabaseUnavailableError('Supabase configuration is missing or incomplete in production.');
        this.hydrationError = err;
        this.isReady = false;
        throw err;
      }
      this.isReady = true;
      return;
    }

    try {
      // 1. Hydrate users
      const { data: usersData, error: userErr } = await supabase.from('civic_users').select('*');
      if (userErr) throw userErr;

      if (usersData && usersData.length > 0) {
        for (const u of usersData) {
          this.users.set(u.id, {
            id: u.id,
            email: u.email,
            passwordHash: u.password_hash,
            fullName: u.full_name,
            role: u.role,
            badgeNumber: u.badge_number || undefined,
            department: u.department || undefined,
            createdAt: u.created_at,
            updatedAt: u.updated_at,
          });
        }
      }

      // In non-production, ensure baseline mock users exist if table is empty
      if (!this.isProduction() && usersData) {
        for (const u of this.users.values()) {
          const alreadyInDb = usersData.some(dbUser => dbUser.id === u.id || dbUser.email === u.email);
          if (!alreadyInDb) {
            await supabase.from('civic_users').insert({
              id: u.id,
              email: u.email,
              password_hash: u.passwordHash,
              full_name: u.fullName,
              role: u.role,
              badge_number: u.badgeNumber || null,
              department: u.department || null,
              created_at: u.createdAt,
              updated_at: u.updatedAt,
            });
          }
        }
      }

      // 2. Hydrate reports
      const { data: reportsData, error: repErr } = await supabase.from('civic_reports').select('*');
      if (repErr) throw repErr;

      if (reportsData && reportsData.length > 0) {
        for (const r of reportsData) {
          const existing = this.reports.get(r.id);
          this.reports.set(r.id, {
            id: r.id,
            trackingCode: r.tracking_code,
            title: r.title,
            description: r.description,
            category: r.category,
            priority: r.priority,
            status: r.status,
            latitude: r.latitude,
            longitude: r.longitude,
            locationAddress: r.location_address,
            mediaUrls: existing?.mediaUrls || [],
            authorId: r.author_id || undefined,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          });
        }
      }

      // 3. Hydrate telemetry
      const { data: telemetryData, error: telErr } = await supabase.from('telemetry_streams').select('*');
      if (telErr) throw telErr;

      if (telemetryData && telemetryData.length > 0) {
        for (const t of telemetryData) {
          this.telemetry.set(t.id, {
            id: t.id,
            sensorId: t.sensor_id,
            sensorName: t.sensor_name,
            sensorType: t.sensor_type,
            metricValue: t.metric_value,
            unit: t.unit,
            threshold: t.threshold,
            isAnomaly: Boolean(t.is_anomaly),
            latitude: t.latitude,
            longitude: t.longitude,
            location: t.location,
            timestamp: t.timestamp,
          });
        }
      }

      // 4. Hydrate AI insights
      const { data: insightsData, error: insErr } = await supabase.from('ai_insights').select('*');
      if (insErr) throw insErr;

      if (insightsData && insightsData.length > 0) {
        for (const i of insightsData) {
          this.insights.set(i.id, {
            id: i.id,
            reportId: i.report_id,
            triagePriority: i.triage_priority,
            urgencyScore: i.urgency_score,
            sentimentIndex: i.sentiment_index,
            summary: i.summary,
            suggestedAction: i.suggested_action,
            targetDepartment: i.target_department,
            confidenceScore: i.confidence_score,
            agentEvaluations: i.agent_evaluations,
            createdAt: i.created_at,
          });
        }
      }

      // 5. Hydrate audit logs
      const { data: logsData, error: logErr } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(200);
      if (logErr) throw logErr;

      if (logsData && logsData.length > 0) {
        this.auditLogs = logsData.map(l => ({
          id: l.id,
          reportId: l.report_id || undefined,
          userId: l.user_id || undefined,
          action: l.action,
          deltaDiff: l.delta_diff || undefined,
          ipAddress: l.ip_address || undefined,
          timestamp: l.timestamp,
        }));
      }

      this.isReady = true;
      this.isHydrated = true;
      this.hydrationError = null;
    } catch (err: any) {
      const mapped = mapDatabaseError(err);
      this.hydrationError = mapped;
      this.isReady = false;
      if (this.isProduction()) {
        console.error('[Supabase Hydration] Critical production hydration failure:', mapped.message);
        throw mapped;
      } else {
        console.warn('[Supabase Dev Hydration] Warning during initial hydration:', err?.message || err);
      }
    }
  }

  // Reports Retrieval
  getAllReports(): CivicReport[] {
    if (this.isProduction() && !this.isReady) {
      throw new DatabaseUnavailableError('Persistence store is unready in production.');
    }
    return Array.from(this.reports.values()).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getReportById(id: string): CivicReport | undefined {
    if (this.isProduction() && !this.isReady) {
      throw new DatabaseUnavailableError('Persistence store is unready in production.');
    }
    const report = this.reports.get(id);
    if (!report) return undefined;
    const insights = Array.from(this.insights.values()).filter(i => i.reportId === id);
    return { ...report, aiInsights: insights };
  }

  // Report Mutation with Atomic Persistence & Audit Compensation
  async addReportAsync(report: CivicReport): Promise<CivicReport> {
    if (this.isProduction()) {
      if (!this.isSupabaseConfigured() || !this.isReady) {
        throw new DatabaseUnavailableError('Database service unavailable.');
      }

      // 1. Primary write to civic_reports
      const { error } = await supabase.from('civic_reports').insert({
        id: report.id,
        tracking_code: report.trackingCode,
        title: report.title,
        description: report.description,
        category: report.category,
        priority: report.priority,
        status: report.status,
        latitude: report.latitude,
        longitude: report.longitude,
        location_address: report.locationAddress,
        media_urls: report.mediaUrls || [],
        author_id: report.authorId || null,
        created_at: report.createdAt,
        updated_at: report.updatedAt,
      });

      if (error) {
        throw mapDatabaseError(error);
      }

      // 2. Audit log with safe compensation
      try {
        await this.addAuditLogAsync({
          id: `aud-${Date.now()}`,
          reportId: report.id,
          action: 'REPORT_CREATED',
          deltaDiff: { trackingCode: report.trackingCode, title: report.title },
          timestamp: new Date().toISOString(),
        });
      } catch (auditErr) {
        // Rollback report insert so audit trail remains consistent
        await supabase.from('civic_reports').delete().eq('id', report.id);
        throw new PersistenceError('Failed to record mandatory report creation audit log. Operation rolled back.');
      }

      this.reports.set(report.id, report);
      return report;
    }

    // Development / Test mode fallback
    if (this.isSupabaseConfigured()) {
      try {
        await supabase.from('civic_reports').insert({
          id: report.id,
          tracking_code: report.trackingCode,
          title: report.title,
          description: report.description,
          category: report.category,
          priority: report.priority,
          status: report.status,
          latitude: report.latitude,
          longitude: report.longitude,
          location_address: report.locationAddress,
          media_urls: report.mediaUrls || [],
          author_id: report.authorId || null,
          created_at: report.createdAt,
          updated_at: report.updatedAt,
        });
      } catch (err: any) {
        console.warn('[Supabase Dev Sync Warning]:', err?.message || err);
      }
    }

    this.reports.set(report.id, report);
    this.addAuditLog({
      id: `aud-${Date.now()}`,
      reportId: report.id,
      action: 'REPORT_CREATED',
      deltaDiff: { trackingCode: report.trackingCode, title: report.title },
      timestamp: new Date().toISOString(),
    });

    return report;
  }

  addReport(report: CivicReport): CivicReport {
    this.reports.set(report.id, report);
    this.addAuditLog({
      id: `aud-${Date.now()}`,
      reportId: report.id,
      action: 'REPORT_CREATED',
      deltaDiff: { trackingCode: report.trackingCode, title: report.title },
      timestamp: new Date().toISOString(),
    });
    return report;
  }

  async updateReportAsync(id: string, updates: Partial<CivicReport>): Promise<CivicReport | undefined> {
    if (this.isProduction()) {
      if (!this.isSupabaseConfigured() || !this.isReady) {
        throw new DatabaseUnavailableError('Database service unavailable.');
      }
    }

    const existing = this.reports.get(id);
    if (!existing) return undefined;

    const previousState: CivicReport = { ...existing };
    const updated: CivicReport = { ...existing, ...updates, updatedAt: new Date().toISOString() };

    if (this.isProduction()) {
      const { error } = await supabase
        .from('civic_reports')
        .update({
          priority: updated.priority,
          status: updated.status,
          updated_at: updated.updatedAt,
        })
        .eq('id', id);

      if (error) {
        throw mapDatabaseError(error);
      }

      // Safe compensation: Revert state if audit logging fails
      try {
        await this.addAuditLogAsync({
          id: `aud-${Date.now()}`,
          reportId: id,
          action: 'REPORT_UPDATED',
          deltaDiff: updates,
          timestamp: new Date().toISOString(),
        });
      } catch (auditErr) {
        await supabase
          .from('civic_reports')
          .update({
            priority: previousState.priority,
            status: previousState.status,
            updated_at: previousState.updatedAt,
          })
          .eq('id', id);
        throw new PersistenceError('Failed to record report update audit log. Transition rolled back.');
      }

      this.reports.set(id, updated);
      return updated;
    }

    // Development / Test mode fallback
    if (this.isSupabaseConfigured()) {
      try {
        await supabase
          .from('civic_reports')
          .update({
            priority: updated.priority,
            status: updated.status,
            updated_at: updated.updatedAt,
          })
          .eq('id', id);
      } catch (err: any) {
        console.warn('[Supabase Dev Sync Warning]:', err?.message || err);
      }
    }

    this.reports.set(id, updated);
    this.addAuditLog({
      id: `aud-${Date.now()}`,
      reportId: id,
      action: 'REPORT_UPDATED',
      deltaDiff: updates,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  updateReport(id: string, updates: Partial<CivicReport>): CivicReport | undefined {
    const existing = this.reports.get(id);
    if (!existing) return undefined;
    const updated: CivicReport = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.reports.set(id, updated);
    this.addAuditLog({
      id: `aud-${Date.now()}`,
      reportId: id,
      action: 'REPORT_UPDATED',
      deltaDiff: updates,
      timestamp: new Date().toISOString(),
    });
    return updated;
  }

  // Telemetry Retrieval & Calibration
  getAllTelemetry(): TelemetryStream[] {
    if (this.isProduction() && !this.isReady) {
      throw new DatabaseUnavailableError('Persistence store is unready in production.');
    }
    return Array.from(this.telemetry.values());
  }

  async updateTelemetryAsync(id: string, metricValue: number): Promise<TelemetryStream | undefined> {
    if (this.isProduction()) {
      if (!this.isSupabaseConfigured() || !this.isReady) {
        throw new DatabaseUnavailableError('Database service unavailable.');
      }
    }

    const sensor = this.telemetry.get(id);
    if (!sensor) return undefined;
    const isAnomaly = metricValue > sensor.threshold;
    const updated = {
      ...sensor,
      metricValue,
      isAnomaly,
      timestamp: new Date().toISOString(),
    };

    if (this.isProduction()) {
      const { error } = await supabase
        .from('telemetry_streams')
        .update({
          metric_value: metricValue,
          is_anomaly: isAnomaly,
          timestamp: updated.timestamp,
        })
        .eq('id', id);

      if (error) {
        throw mapDatabaseError(error);
      }

      this.telemetry.set(id, updated);
      return updated;
    }

    // Development / Test mode fallback
    if (this.isSupabaseConfigured()) {
      try {
        await supabase
          .from('telemetry_streams')
          .update({
            metric_value: metricValue,
            is_anomaly: isAnomaly,
            timestamp: updated.timestamp,
          })
          .eq('id', id);
      } catch (err: any) {
        console.warn('[Supabase Dev Sync Warning]:', err?.message || err);
      }
    }

    this.telemetry.set(id, updated);
    return updated;
  }

  updateTelemetry(id: string, metricValue: number): TelemetryStream | undefined {
    const sensor = this.telemetry.get(id);
    if (!sensor) return undefined;
    const isAnomaly = metricValue > sensor.threshold;
    const updated = {
      ...sensor,
      metricValue,
      isAnomaly,
      timestamp: new Date().toISOString(),
    };
    this.telemetry.set(id, updated);
    return updated;
  }

  // AI Insights
  async addInsightAsync(insight: AIInsight): Promise<AIInsight> {
    if (this.isProduction()) {
      if (!this.isSupabaseConfigured() || !this.isReady) {
        throw new DatabaseUnavailableError('Database service unavailable.');
      }

      const { error } = await supabase.from('ai_insights').insert({
        id: insight.id,
        report_id: insight.reportId,
        triage_priority: insight.triagePriority,
        urgency_score: insight.urgencyScore,
        sentiment_index: insight.sentimentIndex,
        summary: insight.summary,
        suggested_action: insight.suggestedAction,
        target_department: insight.targetDepartment,
        confidence_score: insight.confidenceScore,
        agent_evaluations: insight.agentEvaluations,
        created_at: insight.createdAt,
      });

      if (error) {
        throw mapDatabaseError(error);
      }

      this.insights.set(insight.id, insight);
      return insight;
    }

    // Development / Test mode fallback
    if (this.isSupabaseConfigured()) {
      try {
        await supabase.from('ai_insights').insert({
          id: insight.id,
          report_id: insight.reportId,
          triage_priority: insight.triagePriority,
          urgency_score: insight.urgencyScore,
          sentiment_index: insight.sentimentIndex,
          summary: insight.summary,
          suggested_action: insight.suggestedAction,
          target_department: insight.targetDepartment,
          confidence_score: insight.confidenceScore,
          agent_evaluations: insight.agentEvaluations,
          created_at: insight.createdAt,
        });
      } catch (err: any) {
        console.warn('[Supabase Dev Sync Warning]:', err?.message || err);
      }
    }

    this.insights.set(insight.id, insight);
    return insight;
  }

  addInsight(insight: AIInsight): AIInsight {
    this.insights.set(insight.id, insight);
    return insight;
  }

  getInsightsForReport(reportId: string): AIInsight[] {
    if (this.isProduction() && !this.isReady) {
      throw new DatabaseUnavailableError('Persistence store is unready in production.');
    }
    return Array.from(this.insights.values()).filter(i => i.reportId === reportId);
  }

  // User Lookup & Authentication Lookups
  findUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );
  }

  async findUserByEmailAsync(email: string): Promise<User | undefined> {
    if (this.isProduction()) {
      if (!this.isSupabaseConfigured() || !this.isReady) {
        throw new DatabaseUnavailableError('Database service unavailable.');
      }

      const { data, error } = await supabase
        .from('civic_users')
        .select('*')
        .ilike('email', email.trim())
        .limit(1)
        .maybeSingle();

      if (error) {
        throw mapDatabaseError(error);
      }

      if (data) {
        const user: User = {
          id: data.id,
          email: data.email,
          passwordHash: data.password_hash,
          fullName: data.full_name,
          role: data.role,
          badgeNumber: data.badge_number || undefined,
          department: data.department || undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        this.users.set(user.id, user);
        return user;
      }
      return undefined;
    }

    // Development / Test mode fallback
    const cached = this.findUserByEmail(email);
    if (cached) return cached;

    if (this.isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('civic_users')
          .select('*')
          .ilike('email', email.trim())
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          const user: User = {
            id: data.id,
            email: data.email,
            passwordHash: data.password_hash,
            fullName: data.full_name,
            role: data.role,
            badgeNumber: data.badge_number || undefined,
            department: data.department || undefined,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
          this.users.set(user.id, user);
          return user;
        }
      } catch {
        // Fall back gracefully in dev/test
      }
    }

    return undefined;
  }

  findUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  async findUserByIdAsync(id: string): Promise<User | undefined> {
    if (this.isProduction()) {
      if (!this.isSupabaseConfigured() || !this.isReady) {
        throw new DatabaseUnavailableError('Database service unavailable.');
      }

      const { data, error } = await supabase
        .from('civic_users')
        .select('*')
        .eq('id', id)
        .limit(1)
        .maybeSingle();

      if (error) {
        throw mapDatabaseError(error);
      }

      if (data) {
        const user: User = {
          id: data.id,
          email: data.email,
          passwordHash: data.password_hash,
          fullName: data.full_name,
          role: data.role,
          badgeNumber: data.badge_number || undefined,
          department: data.department || undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        this.users.set(user.id, user);
        return user;
      }
      return undefined;
    }

    // Development / Test mode fallback
    const cached = this.findUserById(id);
    if (cached) return cached;

    if (this.isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('civic_users')
          .select('*')
          .eq('id', id)
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          const user: User = {
            id: data.id,
            email: data.email,
            passwordHash: data.password_hash,
            fullName: data.full_name,
            role: data.role,
            badgeNumber: data.badge_number || undefined,
            department: data.department || undefined,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
          this.users.set(user.id, user);
          return user;
        }
      } catch {
        // Fall back gracefully in dev/test
      }
    }

    return undefined;
  }

  // User Registration with Audit Logging & Safe Compensation
  async createUserAsync(user: User): Promise<User> {
    if (this.isProduction()) {
      if (!this.isSupabaseConfigured() || !this.isReady) {
        throw new DatabaseUnavailableError('Database service unavailable.');
      }

      // 1. Primary write to civic_users
      const { error } = await supabase.from('civic_users').insert({
        id: user.id,
        email: user.email,
        password_hash: user.passwordHash,
        full_name: user.fullName,
        role: user.role,
        badge_number: user.badgeNumber || null,
        department: user.department || null,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      });

      if (error) {
        throw mapDatabaseError(error);
      }

      // 2. Mandatory audit log with rollback compensation
      try {
        await this.addAuditLogAsync({
          id: `aud-${Date.now()}`,
          userId: user.id,
          action: 'USER_REGISTERED',
          deltaDiff: { email: user.email, role: user.role },
          timestamp: new Date().toISOString(),
        });
      } catch (auditErr) {
        await supabase.from('civic_users').delete().eq('id', user.id);
        throw new PersistenceError('Failed to record mandatory user registration audit log. Registration rolled back.');
      }

      this.users.set(user.id, user);
      return user;
    }

    // Development / Test mode fallback
    if (this.isSupabaseConfigured()) {
      try {
        await supabase.from('civic_users').insert({
          id: user.id,
          email: user.email,
          password_hash: user.passwordHash,
          full_name: user.fullName,
          role: user.role,
          badge_number: user.badgeNumber || null,
          department: user.department || null,
          created_at: user.createdAt,
          updated_at: user.updatedAt,
        });
      } catch (err: any) {
        console.warn('[Supabase Dev Sync Warning]:', err?.message || err);
      }
    }

    this.users.set(user.id, user);
    this.addAuditLog({
      id: `aud-${Date.now()}`,
      userId: user.id,
      action: 'USER_REGISTERED',
      deltaDiff: { email: user.email, role: user.role },
      timestamp: new Date().toISOString(),
    });

    return user;
  }

  createUser(user: User): User {
    this.users.set(user.id, user);
    this.addAuditLog({
      id: `aud-${Date.now()}`,
      userId: user.id,
      action: 'USER_REGISTERED',
      deltaDiff: { email: user.email, role: user.role },
      timestamp: new Date().toISOString(),
    });
    return user;
  }

  // Audit Logs Persistence
  async addAuditLogAsync(log: AuditLog): Promise<void> {
    if (this.isProduction()) {
      if (!this.isSupabaseConfigured() || !this.isReady) {
        throw new DatabaseUnavailableError('Database service unavailable.');
      }

      const { error } = await supabase.from('audit_logs').insert({
        id: log.id,
        report_id: log.reportId || null,
        user_id: log.userId || null,
        action: log.action,
        delta_diff: log.deltaDiff || null,
        timestamp: log.timestamp,
      });

      if (error) {
        throw mapDatabaseError(error);
      }

      this.auditLogs.unshift(log);
      if (this.auditLogs.length > 500) this.auditLogs.pop();
      return;
    }

    // Dev/test fallback
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 500) this.auditLogs.pop();

    if (this.isSupabaseConfigured()) {
      try {
        await supabase.from('audit_logs').insert({
          id: log.id,
          report_id: log.reportId || null,
          user_id: log.userId || null,
          action: log.action,
          delta_diff: log.deltaDiff || null,
          timestamp: log.timestamp,
        });
      } catch (err: any) {
        console.warn('[Supabase Dev Sync Warning]:', err?.message || err);
      }
    }
  }

  addAuditLog(log: AuditLog): void {
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 500) this.auditLogs.pop();
  }

  getAuditLogs(): AuditLog[] {
    if (this.isProduction() && !this.isReady) {
      throw new DatabaseUnavailableError('Persistence store is unready in production.');
    }
    return this.auditLogs;
  }
}

export const db = new InMemoryStore();
