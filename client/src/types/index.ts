export type UserRole = 'citizen' | 'official' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  departmentName?: string;
  avatar?: string;
}

export type ComplaintCategory =
  | 'Roads'
  | 'Street Lighting'
  | 'Sanitation'
  | 'Water Supply'
  | 'Traffic Signals';

export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type ComplaintStatus =
  | 'Submitted'
  | 'Categorized'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved';

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl: string;
  uploadedAt: string;
}

export interface StatusHistoryEvent {
  id: string;
  status: ComplaintStatus;
  timestamp: string;
  actorName: string;
  actorRole: string;
  note: string;
}

export interface AuditEvent {
  id: string;
  complaintId: string;
  trackingId: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  details: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'urgent';
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface PriorityScoreExplanation {
  baseScore: number;
  safetyBonus: number;
  keywordBonus: number;
  totalScore: number;
  factors: string[];
  level: ComplaintPriority;
  overridden?: boolean;
  overrideReason?: string;
  overriddenBy?: string;
}

export interface DuplicateMatch {
  complaintId: string;
  trackingId: string;
  title: string;
  category: string;
  similarityScore: number; // 0 - 100
  reasons: string[];
  dismissed?: boolean;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  leadName: string;
  activeTickets: number;
  avgResolutionHours: number;
  color: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  departmentId: string;
  departmentName: string;
  role: string;
  activeAssigned: number;
}

export interface InternalNote {
  id: string;
  author: string;
  authorRole: string;
  timestamp: string;
  text: string;
}

export interface Complaint {
  id: string;
  trackingId: string;
  citizenId: string;
  citizenName: string;
  citizenEmail: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  suggestedCategory: ComplaintCategory;
  categoryExplanation: string;
  priority: ComplaintPriority;
  priorityScore: number;
  priorityExplanation: PriorityScoreExplanation;
  status: ComplaintStatus;
  departmentId?: string;
  departmentName?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  attachments: Attachment[];
  safetyConcern: boolean;
  possibleDuplicates: DuplicateMatch[];
  internalNotes: InternalNote[];
  resolutionDetails?: {
    resolvedAt: string;
    resolvedBy: string;
    resolutionNotes: string;
    resolutionEvidenceUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusHistoryEvent[];
}

// Backward-compatibility models for municipal telemetry components
export interface AIInsight {
  id: string;
  agentRole?: string;
  analysisTitle?: string;
  findings?: string[];
  confidenceScore: number;
  dispatchRecommendedAction?: string;
  suggestedDepartment?: string;
  suggestedTier?: string;
  targetDepartment?: string;
  summary?: string;
  suggestedAction?: string;
  agentEvaluations?: any;
  sentimentIndex?: any;
  urgencyScore?: any;
  [key: string]: any;
}

export interface CivicReport {
  id: string;
  trackingCode: string;
  title: string;
  description: string;
  category: string;
  priority: any;
  status: any;
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
  sensorType: string;
  metricValue: number;
  unit: string;
  threshold: number;
  isAnomaly: boolean;
  latitude: number;
  longitude: number;
  location: string;
  timestamp: string;
}
