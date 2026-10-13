import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Building2,
  Layers,
  Send,
  ShieldAlert,
  Copy,
  Check,
  History,
  XCircle,
  FileCheck2,
  Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ComplaintPriority, ComplaintStatus } from '../types';
import { StatusBadge, PriorityBadge } from '../components/ui/StatusBadge';
import { CategoryBadge } from '../components/ui/CategoryBadge';
import { Button } from '../components/ui/Button';
import { LeafletMap } from '../components/map/LeafletMap';

export const ComplaintDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getComplaintById,
    departments,
    staff,
    updateStatus,
    assignDepartment,
    assignStaff,
    overridePriority,
    addInternalNote,
    addResolutionEvidence,
    dismissDuplicateSuggestion
  } = useApp();

  const complaint = id ? getComplaintById(id) : undefined;

  // Local interaction states
  const [newStatus, setNewStatus] = useState<ComplaintStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');

  // Priority override modal state
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState<ComplaintPriority>('High');
  const [overrideReason, setOverrideReason] = useState('');

  // Resolution form state
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionPhotoUrl, setResolutionPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&auto=format&fit=crop&q=80'
  );

  // Internal note state
  const [internalNoteText, setInternalNoteText] = useState('');

  // Copied indicator
  const [copied, setCopied] = useState(false);

  if (!complaint) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Complaint Not Found</h2>
        <p className="text-xs text-slate-500">The requested tracking code or ID does not exist in memory.</p>
        <Button onClick={() => navigate('/admin/complaints')}>Return to Queue</Button>
      </div>
    );
  }

  // Handle department assignment
  const handleAssignDept = (deptId: string) => {
    setSelectedDept(deptId);
    assignDepartment(complaint.id, deptId);
  };

  // Handle staff assignment
  const handleAssignStaff = (staffId: string) => {
    setSelectedStaff(staffId);
    assignStaff(complaint.id, staffId);
  };

  // Handle status update
  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus) return;
    updateStatus(complaint.id, newStatus as ComplaintStatus, statusNote);
    setNewStatus('');
    setStatusNote('');
  };

  // Handle priority override
  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) return;
    overridePriority(complaint.id, overrideTarget, overrideReason);
    setIsOverrideOpen(false);
    setOverrideReason('');
  };

  // Handle resolution submit
  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) return;
    addResolutionEvidence(complaint.id, resolutionNotes, resolutionPhotoUrl);
    setIsResolving(false);
  };

  // Handle internal note
  const handleInternalNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNoteText.trim()) return;
    addInternalNote(complaint.id, internalNoteText);
    setInternalNoteText('');
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(complaint.trackingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const deptStaff = staff.filter(s => !complaint.departmentId || s.departmentId === complaint.departmentId);

  return (
    <div className="space-y-8 py-4">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/complaints')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Queue
          </Button>

          <div className="h-5 w-px bg-slate-200 dark:bg-dark-border hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-extrabold text-brand-teal dark:text-brand-cyan">
              {complaint.trackingId}
            </span>
            <button
              type="button"
              onClick={handleCopyId}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Copy tracking code"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOverrideOpen(true)}
            leftIcon={<ShieldAlert className="h-3.5 w-3.5 text-amber-500" />}
          >
            Override Priority
          </Button>
          {complaint.status !== 'Resolved' && (
            <Button
              size="sm"
              onClick={() => setIsResolving(true)}
              leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
            >
              Mark Resolved
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Left Details & Right Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-4 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <CategoryBadge category={complaint.category} />
              <PriorityBadge priority={complaint.priority} score={complaint.priorityScore} />
              <StatusBadge status={complaint.status} />
              {complaint.safetyConcern && (
                <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  <AlertTriangle className="h-3.5 w-3.5" /> Public Safety Concern
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
              {complaint.title}
            </h1>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-canvas/70 border border-slate-200 dark:border-dark-border text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {complaint.description}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 text-slate-500">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Reporting Citizen
                </span>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {complaint.citizenName} ({complaint.citizenEmail})
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Submission Timestamp
                </span>
                <p className="font-mono text-slate-900 dark:text-white mt-0.5">
                  {new Date(complaint.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Automated Triage Explanation Card */}
          <div className="p-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 dark:bg-brand-cyan/5 space-y-3">
            <div className="flex items-center gap-2 text-brand-teal dark:text-brand-cyan">
              <Sparkles className="h-4 w-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Deterministic Triage Breakdown
              </h3>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                <strong>Categorization Reason:</strong> {complaint.categoryExplanation}
              </p>
            </div>

            <div className="space-y-1.5 pt-2 text-xs">
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Score Composition ({complaint.priorityScore}/100):
              </div>
              <ul className="space-y-1 pl-4 list-disc text-[11px] text-slate-600 dark:text-slate-400">
                {complaint.priorityExplanation.factors.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              {complaint.priorityExplanation.overridden && (
                <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[11px]">
                  <strong>Manual Priority Override:</strong> Justified by{' '}
                  {complaint.priorityExplanation.overriddenBy} as: "
                  {complaint.priorityExplanation.overrideReason}"
                </div>
              )}
            </div>
          </div>

          {/* Duplicate Detection Suggestions */}
          {complaint.possibleDuplicates.filter(d => !d.dismissed).length > 0 && (
            <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 space-y-3">
              <div className="flex items-center gap-2 text-amber-500">
                <Layers className="h-4 w-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Clustered Duplicate Suggestions ({complaint.possibleDuplicates.filter(d => !d.dismissed).length})
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Algorithms flagged similar reports submitted nearby to prevent duplicate work-orders:
              </p>

              <div className="space-y-2 pt-1">
                {complaint.possibleDuplicates
                  .filter(d => !d.dismissed)
                  .map(dup => (
                    <div
                      key={dup.complaintId}
                      className="p-3 rounded-xl bg-white dark:bg-dark-card border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-brand-teal dark:text-brand-cyan">
                            {dup.trackingId}
                          </span>
                          <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-500/20 text-amber-500">
                            {dup.similarityScore}% Similarity Match
                          </span>
                        </div>
                        <p className="font-semibold text-slate-900 dark:text-white">{dup.title}</p>
                        <p className="text-[11px] text-slate-500">{dup.reasons.join(' · ')}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/admin/complaints/${dup.complaintId}`)}
                        >
                          Compare
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => dismissDuplicateSuggestion(complaint.id, dup.complaintId)}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Location & Mini Map */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-teal dark:text-brand-cyan" />
                  Geospatial Coordinates & Location
                </h3>
                <p className="text-xs text-slate-500">{complaint.location.address}</p>
              </div>
              <span className="font-mono text-xs text-slate-400">
                {complaint.location.lat.toFixed(4)}, {complaint.location.lng.toFixed(4)}
              </span>
            </div>

            <LeafletMap
              markers={[
                {
                  id: complaint.id,
                  trackingId: complaint.trackingId,
                  lat: complaint.location.lat,
                  lng: complaint.location.lng,
                  title: complaint.title,
                  priority: complaint.priority,
                  status: complaint.status,
                  category: complaint.category,
                },
              ]}
              center={[complaint.location.lat, complaint.location.lng]}
              zoom={15}
              height="260px"
            />
          </div>

          {/* Citizen Media Evidence */}
          {complaint.attachments.length > 0 && (
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Intake Photographic Evidence ({complaint.attachments.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {complaint.attachments.map(att => (
                  <div key={att.id} className="space-y-1">
                    <img
                      src={att.previewUrl}
                      alt={att.name}
                      className="h-48 w-full object-cover rounded-xl border border-slate-200 dark:border-dark-border shadow-sm"
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-mono">
                      <span>{att.name}</span>
                      <span>{(att.size / 1024).toFixed(0)} KB</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verified Resolution Evidence Preview (if completed) */}
          {complaint.resolutionDetails && (
            <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 space-y-3">
              <div className="flex items-center gap-2 text-emerald-500">
                <FileCheck2 className="h-5 w-5" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Field Resolution Documentation
                </h3>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {complaint.resolutionDetails.resolutionNotes}
              </p>
              {complaint.resolutionDetails.resolutionEvidenceUrl && (
                <img
                  src={complaint.resolutionDetails.resolutionEvidenceUrl}
                  alt="Field resolution proof"
                  className="h-48 w-full object-cover rounded-xl border border-emerald-500/30"
                />
              )}
              <div className="text-[10px] text-slate-500 font-mono">
                Verified on {new Date(complaint.resolutionDetails.resolvedAt).toLocaleString()} by{' '}
                {complaint.resolutionDetails.resolvedBy}
              </div>
            </div>
          )}

          {/* Full Audit History Log */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="h-4 w-4 text-brand-teal dark:text-brand-cyan" />
                Full Audit Trail
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {complaint.statusHistory.length} checkpoints
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-dark-border/60">
              {complaint.statusHistory.map(hist => (
                <div key={hist.id} className="py-2.5 flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {hist.status}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        by {hist.actorName} ({hist.actorRole})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">{hist.note}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Municipal Operational Controls */}
        <div className="space-y-6">
          {/* Department & Staff Assignment Box */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-brand-teal dark:text-brand-cyan" />
              Routing & Assignment
            </h3>

            {/* Department Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Municipal Department
              </label>
              <select
                value={complaint.departmentId || ''}
                onChange={e => handleAssignDept(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-canvas text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="">Select Department...</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Staff Member Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Assigned Officer
              </label>
              <select
                value={complaint.assignedStaffId || ''}
                onChange={e => handleAssignStaff(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-canvas text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="">Select Field Staff...</option>
                {deptStaff.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Progression Controls */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-teal dark:text-brand-cyan" />
              Advance Lifecycle Status
            </h3>

            <form onSubmit={handleStatusSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as ComplaintStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-canvas text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">Choose new milestone...</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Categorized">Categorized</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Audit Remarks
                </label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={e => setStatusNote(e.target.value)}
                  placeholder="e.g. Work crew arrived on scene with replacement pipe"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-canvas text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <Button
                type="submit"
                size="sm"
                className="w-full"
                disabled={!newStatus}
              >
                Update Milestone
              </Button>
            </form>
          </div>

          {/* Internal Notes Editor */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-500" />
                Staff Internal Notes
              </h3>
              <span className="text-[10px] text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded">
                Confidential
              </span>
            </div>

            <form onSubmit={handleInternalNoteSubmit} className="space-y-2">
              <textarea
                rows={3}
                value={internalNoteText}
                onChange={e => setInternalNoteText(e.target.value)}
                placeholder="Private remarks for department officers (hidden from citizen)..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-canvas text-xs text-slate-900 dark:text-white focus:outline-none"
              />
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                className="w-full"
                disabled={!internalNoteText.trim()}
                leftIcon={<Send className="h-3.5 w-3.5" />}
              >
                Post Internal Note
              </Button>
            </form>

            <div className="space-y-2 pt-2 divide-y divide-slate-100 dark:divide-dark-border/60">
              {complaint.internalNotes.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No internal notes posted yet.</p>
              ) : (
                complaint.internalNotes.map(n => (
                  <div key={n.id} className="pt-2 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {n.author} ({n.authorRole})
                      </span>
                      <span className="font-mono">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-dark-canvas p-2 rounded-lg">
                      {n.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Priority Override Modal */}
      {isOverrideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl glass-panel p-6 space-y-4 border border-amber-500/40 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Manual Priority Override
            </h3>
            <p className="text-xs text-slate-500">
              Administrative overrides alter scheduling rank and must include a documented justification for audit review.
            </p>

            <form onSubmit={handleOverrideSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Priority Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Low', 'Medium', 'High', 'Urgent'] as ComplaintPriority[]).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setOverrideTarget(p)}
                      className={`py-2 rounded-xl text-xs font-semibold border ${
                        overrideTarget === p
                          ? 'border-brand-cyan bg-brand-cyan/20 text-brand-cyan'
                          : 'border-slate-300 dark:border-dark-border text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Required Justification *
                </label>
                <textarea
                  rows={3}
                  required
                  value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                  placeholder="e.g. Proximity to school zone identified by City Council request..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-dark-border bg-slate-50 dark:bg-dark-canvas text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOverrideOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!overrideReason.trim()}
                >
                  Confirm Override
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Resolved Modal */}
      {isResolving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl glass-panel p-6 space-y-4 border border-emerald-500/40 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Close & Verify Resolution
            </h3>
            <p className="text-xs text-slate-500">
              Provide photographic proof and engineering remarks to mark this complaint resolved.
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Resolution Notes *
                </label>
                <textarea
                  rows={3}
                  required
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Cold-mix asphalt applied, roller compaction finished, road reopened."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-dark-border bg-slate-50 dark:bg-dark-canvas text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Verification Photo URL
                </label>
                <input
                  type="text"
                  value={resolutionPhotoUrl}
                  onChange={e => setResolutionPhotoUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-dark-border bg-slate-50 dark:bg-dark-canvas text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsResolving(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!resolutionNotes.trim()}
                >
                  Verify & Close Case
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
