import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Clock,
  MapPin,
  ChevronRight,
  X,
  CheckCircle2,
  FileText,
  ShieldAlert,
  Plus,
  Image as ImageIcon,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Complaint, ComplaintStatus } from '../types';
import { StatusBadge, PriorityBadge } from '../components/ui/StatusBadge';
import { CategoryBadge } from '../components/ui/CategoryBadge';
import { Button } from '../components/ui/Button';

export const MyComplaints: React.FC = () => {
  const navigate = useNavigate();
  const { complaints } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Filter complaints
  const filtered = complaints.filter(c => {
    const matchesSearch =
      c.trackingId.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()) ||
      c.location.address.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statuses: Array<ComplaintStatus | 'ALL'> = [
    'ALL',
    'Submitted',
    'Categorized',
    'Assigned',
    'In Progress',
    'Resolved',
  ];

  const timelineStages: ComplaintStatus[] = [
    'Submitted',
    'Categorized',
    'Assigned',
    'In Progress',
    'Resolved',
  ];

  return (
    <div className="space-y-6 py-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            My Complaints & Status Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time status tracking and verified municipal history for all community reports.
          </p>
        </div>

        <Button
          onClick={() => navigate('/report')}
          leftIcon={<Plus className="h-4 w-4" />}
          size="sm"
        >
          File New Report
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by tracking code (e.g. CF-2026-8942) or keyword..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {statuses.map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-brand-cyan text-slate-950 font-bold shadow-sm'
                  : 'bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Complaints List / Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card p-12 text-center space-y-4">
          <FileText className="h-10 w-10 mx-auto text-slate-400" />
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No matching complaints found
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search terms or clearing the status filter.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('');
              setStatusFilter('ALL');
            }}
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filtered.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedComplaint(item)}
              className="p-5 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card hover:border-brand-cyan/40 hover:shadow-md transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-brand-teal dark:text-brand-cyan">
                    {item.trackingId}
                  </span>
                  <CategoryBadge category={item.category} size="sm" />
                  <PriorityBadge priority={item.priority} score={item.priorityScore} size="sm" />
                  <StatusBadge status={item.status} size="sm" />
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-teal dark:group-hover:text-brand-cyan transition-colors truncate">
                  {item.title}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 truncate max-w-sm">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    {item.location.address}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                  {item.attachments.length > 0 && (
                    <span className="flex items-center gap-1 text-[11px]">
                      <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
                      {item.attachments.length} evidence photo
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedComplaint(item);
                  }}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Track Case
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Inspection Side Drawer */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl h-full bg-white dark:bg-dark-canvas border-l border-slate-200 dark:border-dark-border p-6 overflow-y-auto space-y-6 shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-dark-border">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Incident Inspection Drawer
                </span>
                <div className="text-xl font-mono font-black text-brand-teal dark:text-brand-cyan">
                  {selectedComplaint.trackingId}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-card"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <CategoryBadge category={selectedComplaint.category} />
              <PriorityBadge priority={selectedComplaint.priority} score={selectedComplaint.priorityScore} />
              <StatusBadge status={selectedComplaint.status} />
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {selectedComplaint.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-dark-card p-3.5 rounded-xl border border-slate-200 dark:border-dark-border">
                {selectedComplaint.description}
              </p>
            </div>

            {/* Location */}
            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                Location Details
              </span>
              <p className="text-slate-900 dark:text-white font-medium flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-brand-teal dark:text-brand-cyan" />
                {selectedComplaint.location.address}
              </p>
              <p className="font-mono text-slate-500 text-[10px] pl-5">
                Coordinates: {selectedComplaint.location.lat.toFixed(4)}, {selectedComplaint.location.lng.toFixed(4)}
              </p>
            </div>

            {/* Photo Attachments */}
            {selectedComplaint.attachments.length > 0 && (
              <div className="space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Citizen Photo Evidence
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {selectedComplaint.attachments.map(att => (
                    <img
                      key={att.id}
                      src={att.previewUrl}
                      alt={att.name}
                      className="h-32 w-full object-cover rounded-xl border border-slate-200 dark:border-dark-border shadow-sm"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Resolution Proof (If resolved) */}
            {selectedComplaint.resolutionDetails && (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 space-y-3">
                <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="h-4 w-4" />
                  Verified Municipal Resolution Proof
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedComplaint.resolutionDetails.resolutionNotes}
                </p>
                {selectedComplaint.resolutionDetails.resolutionEvidenceUrl && (
                  <img
                    src={selectedComplaint.resolutionDetails.resolutionEvidenceUrl}
                    alt="Resolution evidence"
                    className="h-36 w-full object-cover rounded-lg border border-emerald-500/30"
                  />
                )}
                <div className="text-[10px] text-slate-500 font-mono">
                  Closed on {new Date(selectedComplaint.resolutionDetails.resolvedAt).toLocaleString()} by {selectedComplaint.resolutionDetails.resolvedBy}
                </div>
              </div>
            )}

            {/* Chronological Status Timeline */}
            <div className="space-y-3 pt-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                5-Stage Progress Timeline
              </span>

              <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-dark-border pl-8">
                {selectedComplaint.statusHistory.map((hist, idx) => (
                  <div key={hist.id} className="relative">
                    {/* Timeline Node */}
                    <div className="absolute -left-8 top-1 h-3.5 w-3.5 rounded-full bg-brand-cyan ring-4 ring-white dark:ring-dark-canvas" />

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {hist.status}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        {hist.note}
                      </p>
                      <div className="text-[10px] text-slate-500">
                        By: <span className="font-medium text-slate-700 dark:text-slate-300">{hist.actorName}</span> ({hist.actorRole})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
