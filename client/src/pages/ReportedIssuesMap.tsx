import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Filter,
  Layers,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Send,
  X,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Complaint, ComplaintPriority, ComplaintStatus } from '../types';
import { StatusBadge, PriorityBadge } from '../components/ui/StatusBadge';
import { CategoryBadge } from '../components/ui/CategoryBadge';
import { Button } from '../components/ui/Button';
import { LeafletMap, MapMarkerItem } from '../components/map/LeafletMap';

export const ReportedIssuesMap: React.FC = () => {
  const navigate = useNavigate();
  const { complaints, currentUser, updateStatus, assignDepartment } = useApp();

  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedIncident, setSelectedIncident] = useState<Complaint | null>(null);

  // Quick Dispatch Modal
  const [dispatchModalItem, setDispatchModalItem] = useState<Complaint | null>(null);
  const [dispatchNote, setDispatchNote] = useState('Emergency rapid dispatch unit authorized.');

  // Filter complaints with valid coordinates
  const filtered = complaints.filter(c => {
    if (!c.location?.lat || !c.location?.lng) return false;
    const matchesCat = categoryFilter === 'ALL' || c.category === categoryFilter;
    const matchesStat = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesPrio = priorityFilter === 'ALL' || c.priority === priorityFilter;
    return matchesCat && matchesStat && matchesPrio;
  });

  const markers: MapMarkerItem[] = filtered.map(c => ({
    id: c.id,
    trackingId: c.trackingId,
    lat: c.location.lat,
    lng: c.location.lng,
    title: c.title,
    priority: c.priority,
    status: c.status,
    category: c.category,
    onClick: () => setSelectedIncident(c),
  }));

  const handleQuickDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchModalItem) return;

    // Advance status to In Progress and update notes
    updateStatus(dispatchModalItem.id, 'In Progress', dispatchNote);
    if (!dispatchModalItem.departmentId) {
      assignDepartment(dispatchModalItem.id, 'dept-roads');
    }
    setDispatchModalItem(null);
    setSelectedIncident(prev => prev ? { ...prev, status: 'In Progress' } : null);
  };

  const resetFilters = () => {
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
  };

  return (
    <div className="space-y-6 py-4">
      {/* Map Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="h-6 w-6 text-brand-teal dark:text-brand-cyan" />
            Live Geospatial Issue Radar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time geospatial distribution of active citizen complaints across municipal zones.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={resetFilters}
          leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
        >
          Reset Filters
        </Button>
      </div>

      {/* Filter Pill Strip */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Radar Filters:
          </span>
        </div>

        {/* Category */}
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-canvas text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
        >
          <option value="ALL">All Categories</option>
          <option value="Roads">Roads & Public Works</option>
          <option value="Street Lighting">Street Lighting & Grid</option>
          <option value="Water Supply">Water Supply & Hydrology</option>
          <option value="Sanitation">Sanitation & Waste</option>
          <option value="Traffic Signals">Traffic Signals</option>
        </select>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-canvas text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="Submitted">Submitted</option>
          <option value="Categorized">Categorized</option>
          <option value="Assigned">Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>

        {/* Priority */}
        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-canvas text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
        >
          <option value="ALL">All Priorities</option>
          <option value="Urgent">Urgent</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <span className="ml-auto text-xs font-mono text-brand-teal dark:text-brand-cyan">
          {filtered.length} points plotted
        </span>
      </div>

      {/* Main Map View & Inspection Split */}
      <div className="relative">
        <LeafletMap
          markers={markers}
          height="620px"
          center={[40.7512, -73.9825]}
          zoom={13}
        />

        {/* Floating Legend */}
        <div className="absolute top-4 right-4 z-20 p-3 rounded-2xl glass-panel shadow-lg border border-slate-200 dark:border-dark-border text-xs space-y-1.5 hidden sm:block">
          <div className="font-bold text-[11px] uppercase tracking-wider text-slate-500 pb-1">
            Radar Marker Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-slate-700 dark:text-slate-300">Urgent Incident</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-700 dark:text-slate-300">High Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span className="text-slate-700 dark:text-slate-300">Medium Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-700 dark:text-slate-300">Resolved Ticket</span>
          </div>
        </div>

        {/* Floating Incident Preview Card (when a marker is clicked) */}
        {selectedIncident && (
          <div className="absolute bottom-6 left-6 right-6 sm:right-auto sm:w-96 z-20 p-5 rounded-2xl glass-panel shadow-2xl border border-brand-cyan/40 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-brand-teal dark:text-brand-cyan">
                {selectedIncident.trackingId}
              </span>
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <CategoryBadge category={selectedIncident.category} size="sm" />
              <PriorityBadge priority={selectedIncident.priority} score={selectedIncident.priorityScore} size="sm" />
              <StatusBadge status={selectedIncident.status} size="sm" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {selectedIncident.title}
              </h4>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                {selectedIncident.location.address}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-dark-border">
              {currentUser.role === 'official' ? (
                <>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/admin/complaints/${selectedIncident.id}`)}
                    rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
                  >
                    Inspect
                  </Button>
                  {selectedIncident.status !== 'Resolved' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setDispatchModalItem(selectedIncident)}
                      leftIcon={<Send className="h-3.5 w-3.5" />}
                    >
                      Quick Dispatch
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => navigate('/my-complaints')}
                >
                  Track in My Complaints
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Dispatch Confirmation Modal */}
      {dispatchModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl glass-panel p-6 space-y-4 border border-brand-cyan/40 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="h-5 w-5 text-brand-cyan" />
              Authorize Immediate Quick Dispatch
            </h3>
            <p className="text-xs text-slate-500">
              This will transition complaint <strong className="text-slate-800 dark:text-slate-200">{dispatchModalItem.trackingId}</strong> directly into <strong>In Progress</strong> and append an official dispatch audit entry.
            </p>

            <form onSubmit={handleQuickDispatch} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Dispatch Instructions *
                </label>
                <textarea
                  rows={3}
                  required
                  value={dispatchNote}
                  onChange={e => setDispatchNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-dark-border bg-slate-50 dark:bg-dark-canvas text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDispatchModalItem(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                >
                  Confirm Dispatch
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
