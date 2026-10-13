export type Role = 'CITIZEN' | 'CIVIC_OFFICIAL' | 'ADMINISTRATOR';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: Role;
  badgeNumber?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
}

export type IncidentPriority = 'LOW' | 'ELEVATED' | 'CRITICAL' | 'CATASTROPHIC';

export type IncidentStatus = 'RECEIVED' | 'TRIAGED' | 'DISPATCHED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type TelemetryType =
  | 'WATER_LEVEL_METRIC'
  | 'TRAFFIC_SENSOR'
  | 'AIR_QUALITY_PPM'
  | 'POWER_GRID_VOLTAGE'
  | 'STRUCTURAL_VIBRATION';

export interface CivicReport {
  id: string;
  trackingCode: string;
  title: string;
  description: string;
  category: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  latitude: number;
  longitude: number;
  locationAddress: string;
  mediaUrls: string[];
  authorId?: string;
  createdAt: string;
  updatedAt: string;
  aiInsights?: AIInsight[];
}

export interface TelemetryStream {
  id: string;
  sensorId: string;
  sensorName: string;
  sensorType: TelemetryType;
  metricValue: number;
  unit: string;
  threshold: number;
  isAnomaly: boolean;
  latitude: number;
  longitude: number;
  location: string;
  timestamp: string;
}

export interface AIInsight {
  id: string;
  reportId: string;
  triagePriority: IncidentPriority;
  urgencyScore: number;       // 0.00 to 1.00
  sentimentIndex: number;     // -1.00 to 1.00
  summary: string;
  suggestedAction: string;
  targetDepartment: string;
  confidenceScore: number;
  agentEvaluations: {
    triageAgent: {
      hazardSeverity: string;
      infrastructuralVulnerability: string;
    };
    sentimentAgent: {
      publicAgitation: string;
      cascadeRisk: string;
    };
    dispatchAgent: {
      workOrderType: string;
      crewTierRequired: string;
      estimatedResolutionHours: number;
    };
  };
  createdAt: string;
}

export interface AuditLog {
  id: string;
  reportId?: string;
  userId?: string;
  action: string;
  deltaDiff?: Record<string, any>;
  ipAddress?: string;
  timestamp: string;
}
