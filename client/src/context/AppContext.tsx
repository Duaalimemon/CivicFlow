import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  Department,
  StaffMember,
  User,
  UserRole,
  NotificationItem,
  AuditEvent
} from '../types';
import {
  SEED_COMPLAINTS,
  SEED_DEPARTMENTS,
  SEED_STAFF,
  DEMO_USERS,
  INITIAL_NOTIFICATIONS
} from '../data/seedData';
import { detectDuplicates } from '../utils/triage';
import { useAuth } from './AuthContext';

interface AppContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  currentUser: User;
  switchRole: (role: UserRole) => void;
  complaints: Complaint[];
  departments: Department[];
  staff: StaffMember[];
  notifications: NotificationItem[];
  auditLogs: AuditEvent[];
  unreadNotifCount: number;

  // Complaint operations
  createComplaint: (data: {
    title: string;
    description: string;
    category: ComplaintCategory;
    suggestedCategory: ComplaintCategory;
    categoryExplanation: string;
    priority: ComplaintPriority;
    priorityScore: number;
    priorityExplanation: any;
    location: { address: string; lat: number; lng: number };
    safetyConcern: boolean;
    attachments: any[];
  }) => Complaint;

  updateStatus: (complaintId: string, newStatus: ComplaintStatus, note?: string) => void;
  assignDepartment: (complaintId: string, departmentId: string) => void;
  assignStaff: (complaintId: string, staffId: string) => void;
  overridePriority: (complaintId: string, newPriority: ComplaintPriority, reason: string) => void;
  addInternalNote: (complaintId: string, text: string) => void;
  addResolutionEvidence: (complaintId: string, notes: string, evidenceUrl?: string) => void;
  dismissDuplicateSuggestion: (complaintId: string, duplicateComplaintId: string) => void;

  // Notification operations
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Helpers
  getComplaintById: (idOrTrackingId: string) => Complaint | undefined;
  resetDemoData: () => void;

  // Global search modal
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  COMPLAINTS: 'cityfix_complaints_v1',
  ROLE: 'cityfix_role_v1',
  THEME: 'cityfix_theme_v1',
  NOTIFICATIONS: 'cityfix_notifs_v1',
  AUDIT: 'cityfix_audit_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser } = useAuth();

  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  // Perspective toggle for verified Administrator
  const [viewPerspective, setViewPerspective] = useState<UserRole | null>(null);

  // Clear preview perspective when unauthenticated or when the authenticated user is not an Administrator
  useEffect(() => {
    if (!authUser || authUser.role !== 'ADMINISTRATOR') {
      setViewPerspective(null);
    }
  }, [authUser]);

  const actualRole: UserRole = authUser
    ? (authUser.role === 'CIVIC_OFFICIAL' || authUser.role === 'ADMINISTRATOR' ? 'official' : 'citizen')
    : 'citizen';

  const role: UserRole = viewPerspective && authUser?.role === 'ADMINISTRATOR' ? viewPerspective : actualRole;

  const currentUser: User = authUser
    ? {
        id: authUser.id,
        name: authUser.fullName,
        email: authUser.email,
        role,
        departmentName: authUser.department,
        avatar: actualRole === 'official' ? DEMO_USERS.official.avatar : DEMO_USERS.citizen.avatar,
      }
    : {
        id: '',
        name: 'Guest Resident',
        email: '',
        role: 'citizen',
        avatar: DEMO_USERS.citizen.avatar,
      };


  // Complaints state with safe JSON parsing
  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMPLAINTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved complaints, resetting to seed data', e);
    }
    return SEED_COMPLAINTS;
  });

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_NOTIFICATIONS;
  });

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUDIT);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [
      {
        id: 'aud-1',
        complaintId: 'c-1001',
        trackingId: 'CF-2026-8942',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        actorName: 'Arthur Pendelton',
        actorRole: 'Director RPW',
        action: 'ASSIGNED_STAFF',
        details: 'Assigned complaint to Sarah Jenkins (Field Inspection Lead).',
      },
      {
        id: 'aud-2',
        complaintId: 'c-1004',
        trackingId: 'CF-2026-5512',
        timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
        actorName: 'David Chen',
        actorRole: 'District Route Supervisor',
        action: 'STATUS_UPDATED',
        details: 'Status changed from In Progress to Resolved with photographic evidence.',
      },
    ];
  });

  // Search modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Synchronize HTML class with theme
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    } catch {}
  }, [theme]);

  // Synchronize complaints with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));
    } catch (e) {
      console.error('Failed to persist complaints', e);
    }
  }, [complaints]);

  // Synchronize notifications with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  // Synchronize audit with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs));
    } catch {}
  }, [auditLogs]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const switchRole = (newRole: UserRole) => {
    // Only verified Administrators can change perspective for previewing.
    // Regular officials and citizens cannot switch roles.
    if (authUser?.role === 'ADMINISTRATOR') {
      setViewPerspective(newRole);
    }
  };

  // Fetch verified backend reports on mount and synchronize with local cache
  useEffect(() => {
    let isMounted = true;
    const fetchBackendReports = async () => {
      try {
        const res = await fetch('/api/v1/reports', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (res.ok && isMounted) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const mappedReports: Complaint[] = json.data.map((r: any) => {
              const priorityMap: Record<string, ComplaintPriority> = {
                LOW: 'Low',
                ELEVATED: 'Medium',
                CRITICAL: 'High',
                CATASTROPHIC: 'Urgent',
              };
              const statusMap: Record<string, ComplaintStatus> = {
                RECEIVED: 'Submitted',
                TRIAGED: 'Categorized',
                DISPATCHED: 'Assigned',
                IN_PROGRESS: 'In Progress',
                RESOLVED: 'Resolved',
                CLOSED: 'Resolved',
              };

              const cat = (['Roads', 'Street Lighting', 'Sanitation', 'Water Supply', 'Traffic Signals'].includes(r.category)
                ? r.category
                : r.category.toLowerCase().includes('water') ? 'Water Supply'
                : r.category.toLowerCase().includes('transit') || r.category.toLowerCase().includes('traffic') ? 'Traffic Signals'
                : r.category.toLowerCase().includes('power') || r.category.toLowerCase().includes('light') ? 'Street Lighting'
                : r.category.toLowerCase().includes('sanitation') ? 'Sanitation'
                : 'Roads') as ComplaintCategory;

              const prio: ComplaintPriority = priorityMap[r.priority] || 'Medium';
              const stat: ComplaintStatus = statusMap[r.status] || 'Submitted';

              return {
                id: r.id,
                trackingId: r.trackingCode || `CF-2026-${r.id.slice(-4)}`,
                citizenId: r.authorId || 'citizen-demo',
                citizenName: r.authorId ? 'Verified Citizen' : 'Community Resident',
                citizenEmail: 'citizen@civicsense.org',
                title: r.title,
                description: r.description,
                category: cat,
                suggestedCategory: cat,
                categoryExplanation: r.aiInsights?.[0]?.summary || 'Automated classification by institutional intake engine.',
                priority: prio,
                priorityScore: r.priority === 'CRITICAL' || r.priority === 'CATASTROPHIC' ? 90 : r.priority === 'ELEVATED' ? 65 : 30,
                priorityExplanation: {
                  baseScore: 50,
                  safetyBonus: r.priority === 'CRITICAL' ? 30 : 0,
                  keywordBonus: 10,
                  totalScore: 70,
                  factors: ['Municipal Infrastructure Sensor Grid'],
                  level: prio,
                },
                status: stat,
                location: {
                  address: r.locationAddress || 'Municipal Sector Vault',
                  lat: typeof r.latitude === 'number' ? r.latitude : 40.7128,
                  lng: typeof r.longitude === 'number' ? r.longitude : -74.0060,
                },
                attachments: Array.isArray(r.mediaUrls)
                  ? r.mediaUrls.map((url: string, idx: number) => ({
                      id: `att-${idx}`,
                      name: `Evidence-${idx + 1}.jpg`,
                      size: 204800,
                      type: 'image/jpeg',
                      previewUrl: url,
                      uploadedAt: r.createdAt || new Date().toISOString(),
                    }))
                  : [],
                safetyConcern: r.priority === 'CRITICAL' || r.priority === 'CATASTROPHIC',
                possibleDuplicates: [],
                internalNotes: [],
                createdAt: r.createdAt || new Date().toISOString(),
                updatedAt: r.updatedAt || new Date().toISOString(),
                statusHistory: [
                  {
                    id: `sh-${r.id}-1`,
                    status: stat,
                    timestamp: r.createdAt || new Date().toISOString(),
                    actorName: 'Municipal Operations',
                    actorRole: 'System',
                    note: `Report registered in system with initial status ${stat}.`,
                  },
                ],
              };
            });

            setComplaints(prev => {
              const prevIds = new Set(prev.map(c => c.id));
              const prevTrackings = new Set(prev.map(c => c.trackingId.toLowerCase()));
              const newItems = mappedReports.filter(r => !prevIds.has(r.id) && !prevTrackings.has(r.trackingId.toLowerCase()));
              return [...newItems, ...prev];
            });
          }
        }
      } catch (err) {
        console.warn('[Complaint Fetch] Backend sync skipped or unavailable:', err);
      }
    };

    void fetchBackendReports();
    return () => {
      isMounted = false;
    };
  }, []);

  const appendAudit = (complaintId: string, trackingId: string, action: string, details: string) => {
    const newAudit: AuditEvent = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      complaintId,
      trackingId,
      timestamp: new Date().toISOString(),
      actorName: currentUser.name,
      actorRole: currentUser.role === 'official' ? (currentUser.departmentName || 'Municipal Official') : 'Citizen',
      action,
      details,
    };
    setAuditLogs(prev => [newAudit, ...prev]);
  };

  const createComplaint = (data: {
    title: string;
    description: string;
    category: ComplaintCategory;
    suggestedCategory: ComplaintCategory;
    categoryExplanation: string;
    priority: ComplaintPriority;
    priorityScore: number;
    priorityExplanation: any;
    location: { address: string; lat: number; lng: number };
    safetyConcern: boolean;
    attachments: any[];
  }): Complaint => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const trackingId = `CF-2026-${randomSuffix}`;
    const newId = `c-${Date.now()}`;
    const nowIso = new Date().toISOString();

    // Check duplicates against existing dataset
    const detectedDuplicates = detectDuplicates(
      {
        id: newId,
        title: data.title,
        description: data.description,
        category: data.category,
        lat: data.location.lat,
        lng: data.location.lng,
      },
      complaints
    );

    const newRecord: Complaint = {
      id: newId,
      trackingId,
      citizenId: currentUser.id || 'usr-citizen-demo',
      citizenName: currentUser.name,
      citizenEmail: currentUser.email,
      title: data.title,
      description: data.description,
      category: data.category,
      suggestedCategory: data.suggestedCategory,
      categoryExplanation: data.categoryExplanation,
      priority: data.priority,
      priorityScore: data.priorityScore,
      priorityExplanation: data.priorityExplanation,
      status: 'Submitted',
      location: data.location,
      attachments: data.attachments || [],
      safetyConcern: data.safetyConcern,
      possibleDuplicates: detectedDuplicates,
      internalNotes: [],
      createdAt: nowIso,
      updatedAt: nowIso,
      statusHistory: [
        {
          id: `sh-${Date.now()}`,
          status: 'Submitted',
          timestamp: nowIso,
          actorName: currentUser.name,
          actorRole: 'Citizen',
          note: 'Complaint officially registered in CityFix municipal ledger.',
        },
      ],
    };

    setComplaints(prev => [newRecord, ...prev]);

    // Asynchronously synchronize report creation with backend
    void (async () => {
      try {
        const res = await fetch('/api/v1/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: data.title,
            description: data.description,
            category: data.category,
            latitude: data.location.lat,
            longitude: data.location.lng,
            locationAddress: data.location.address,
            mediaUrls: data.attachments?.map((a: any) => a.previewUrl).filter(Boolean) || [],
          }),
        });

        if (res.ok) {
          const resData = await res.json();
          if (resData.success && resData.data) {
            setComplaints(prev =>
              prev.map(c =>
                c.id === newId
                  ? {
                      ...c,
                      id: resData.data.id || c.id,
                      trackingId: resData.data.trackingCode || c.trackingId,
                    }
                  : c
              )
            );
          }
        }
      } catch (err) {
        console.warn('[Complaint Backend Sync] Could not sync new report:', err);
      }
    })();

    // Create notification
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'New Complaint Filed',
      message: `${trackingId}: "${data.title.substring(0, 40)}..." submitted.`,
      type: data.priority === 'Urgent' ? 'urgent' : 'info',
      timestamp: 'Just now',
      read: false,
      link: `/my-complaints`,
    };
    setNotifications(prev => [newNotif, ...prev]);

    appendAudit(newId, trackingId, 'COMPLAINT_CREATED', `Complaint ${trackingId} submitted by ${currentUser.name}.`);

    return newRecord;
  };

  const updateStatus = (complaintId: string, newStatus: ComplaintStatus, note?: string) => {
    // Map status for backend REST call
    const statusMap: Record<ComplaintStatus, string> = {
      Submitted: 'RECEIVED',
      Categorized: 'TRIAGED',
      Assigned: 'DISPATCHED',
      'In Progress': 'IN_PROGRESS',
      Resolved: 'RESOLVED',
    };
    const backendStatus = statusMap[newStatus] || 'RECEIVED';

    void (async () => {
      try {
        await fetch(`/api/v1/reports/${complaintId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: backendStatus }),
        });
      } catch (err) {
        console.warn('[Complaint Status Sync] Could not sync status update:', err);
      }
    })();

    setComplaints(prev =>
      prev.map(item => {
        if (item.id !== complaintId) return item;
        const nowIso = new Date().toISOString();
        const updatedHistory = [
          ...item.statusHistory,
          {
            id: `sh-${Date.now()}`,
            status: newStatus,
            timestamp: nowIso,
            actorName: currentUser.name,
            actorRole: currentUser.role === 'official' ? 'Municipal Official' : 'Citizen',
            note: note || `Status updated from ${item.status} to ${newStatus}.`,
          },
        ];

        appendAudit(
          item.id,
          item.trackingId,
          'STATUS_UPDATED',
          `Status transitioned from "${item.status}" to "${newStatus}". Note: ${note || 'No notes specified.'}`
        );

        return {
          ...item,
          status: newStatus,
          updatedAt: nowIso,
          statusHistory: updatedHistory,
        };
      })
    );
  };

  const assignDepartment = (complaintId: string, departmentId: string) => {
    const dept = SEED_DEPARTMENTS.find(d => d.id === departmentId);
    if (!dept) return;

    setComplaints(prev =>
      prev.map(item => {
        if (item.id !== complaintId) return item;
        const nowIso = new Date().toISOString();
        const newStatus: ComplaintStatus = item.status === 'Submitted' ? 'Categorized' : item.status;

        appendAudit(
          item.id,
          item.trackingId,
          'DEPARTMENT_ASSIGNED',
          `Routing assigned to ${dept.name} (${dept.code}).`
        );

        return {
          ...item,
          departmentId: dept.id,
          departmentName: dept.name,
          status: newStatus,
          updatedAt: nowIso,
        };
      })
    );
  };

  const assignStaff = (complaintId: string, staffId: string) => {
    const member = SEED_STAFF.find(s => s.id === staffId);
    if (!member) return;

    setComplaints(prev =>
      prev.map(item => {
        if (item.id !== complaintId) return item;
        const nowIso = new Date().toISOString();
        const newStatus: ComplaintStatus =
          item.status === 'Submitted' || item.status === 'Categorized' ? 'Assigned' : item.status;

        appendAudit(
          item.id,
          item.trackingId,
          'STAFF_ASSIGNED',
          `Assigned to officer ${member.name} (${member.role}).`
        );

        return {
          ...item,
          departmentId: member.departmentId,
          departmentName: member.departmentName,
          assignedStaffId: member.id,
          assignedStaffName: member.name,
          status: newStatus,
          updatedAt: nowIso,
        };
      })
    );
  };

  const overridePriority = (complaintId: string, newPriority: ComplaintPriority, reason: string) => {
    setComplaints(prev =>
      prev.map(item => {
        if (item.id !== complaintId) return item;
        const nowIso = new Date().toISOString();
        const updatedExplanation = {
          ...item.priorityExplanation,
          level: newPriority,
          overridden: true,
          overrideReason: reason,
          overriddenBy: currentUser.name,
        };

        appendAudit(
          item.id,
          item.trackingId,
          'PRIORITY_OVERRIDE',
          `Priority manually altered from ${item.priority} to ${newPriority}. Justification: "${reason}".`
        );

        return {
          ...item,
          priority: newPriority,
          priorityExplanation: updatedExplanation,
          updatedAt: nowIso,
        };
      })
    );
  };

  const addInternalNote = (complaintId: string, text: string) => {
    setComplaints(prev =>
      prev.map(item => {
        if (item.id !== complaintId) return item;
        const newNote = {
          id: `note-${Date.now()}`,
          author: currentUser.name,
          authorRole: currentUser.role === 'official' ? (currentUser.departmentName || 'Official') : 'Citizen',
          timestamp: new Date().toISOString(),
          text,
        };

        appendAudit(
          item.id,
          item.trackingId,
          'INTERNAL_NOTE_ADDED',
          `Confidential internal note appended by ${currentUser.name}.`
        );

        return {
          ...item,
          internalNotes: [...item.internalNotes, newNote],
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const addResolutionEvidence = (complaintId: string, notes: string, evidenceUrl?: string) => {
    setComplaints(prev =>
      prev.map(item => {
        if (item.id !== complaintId) return item;
        const nowIso = new Date().toISOString();
        const newStatus: ComplaintStatus = 'Resolved';
        const updatedHistory = [
          ...item.statusHistory,
          {
            id: `sh-${Date.now()}`,
            status: newStatus,
            timestamp: nowIso,
            actorName: currentUser.name,
            actorRole: 'Municipal Official',
            note: `Complaint closed and resolved. Verification notes: ${notes}`,
          },
        ];

        appendAudit(
          item.id,
          item.trackingId,
          'RESOLVED_WITH_EVIDENCE',
          `Case closed by ${currentUser.name}. Resolution remarks: "${notes}".`
        );

        return {
          ...item,
          status: newStatus,
          resolutionDetails: {
            resolvedAt: nowIso,
            resolvedBy: currentUser.name,
            resolutionNotes: notes,
            resolutionEvidenceUrl: evidenceUrl,
          },
          updatedAt: nowIso,
          statusHistory: updatedHistory,
        };
      })
    );
  };

  const dismissDuplicateSuggestion = (complaintId: string, duplicateComplaintId: string) => {
    setComplaints(prev =>
      prev.map(item => {
        if (item.id !== complaintId) return item;
        return {
          ...item,
          possibleDuplicates: item.possibleDuplicates.map(d =>
            d.complaintId === duplicateComplaintId ? { ...d, dismissed: true } : d
          ),
        };
      })
    );
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getComplaintById = (idOrTrackingId: string): Complaint | undefined => {
    return complaints.find(
      c => c.id === idOrTrackingId || c.trackingId.toLowerCase() === idOrTrackingId.toLowerCase()
    );
  };

  const resetDemoData = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.COMPLAINTS);
      localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
      localStorage.removeItem(STORAGE_KEYS.AUDIT);
    } catch {}
    setComplaints(SEED_COMPLAINTS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setViewPerspective(null);
  };

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        currentUser,
        switchRole,
        complaints,
        departments: SEED_DEPARTMENTS,
        staff: SEED_STAFF,
        notifications,
        auditLogs,
        unreadNotifCount,
        createComplaint,
        updateStatus,
        assignDepartment,
        assignStaff,
        overridePriority,
        addInternalNote,
        addResolutionEvidence,
        dismissDuplicateSuggestion,
        markNotificationRead,
        markAllNotificationsRead,
        getComplaintById,
        resetDemoData,
        isSearchOpen,
        setIsSearchOpen,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
