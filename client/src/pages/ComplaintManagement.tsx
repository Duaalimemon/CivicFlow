import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
  RotateCcw,
  Plus,
  UserCheck,
  Clock,
  MapPin,
  ExternalLink,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Complaint, ComplaintPriority, ComplaintStatus } from '../types';
import { StatusBadge, PriorityBadge } from '../components/ui/StatusBadge';
import { CategoryBadge } from '../components/ui/CategoryBadge';
import { Button } from '../components/ui/Button';

export const ComplaintManagement: React.FC = () => {
  const navigate = useNavigate();
  const { complaints, departments, staff, updateStatus, assignDepartment } = useApp();

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'id'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Filter complaints
  let filtered = complaints.filter(c => {
    const matchesSearch =
      c.trackingId.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.location.address.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || c.category === categoryFilter;
    const matchesPriority = priorityFilter === 'ALL' || c.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  // Sort logic
  filtered.sort((a, b) => {
    let comp = 0;
    if (sortBy === 'score') {
      comp = a.priorityScore - b.priorityScore;
    } else if (sortBy === 'date') {
      comp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else {
      comp = a.trackingId.localeCompare(b.trackingId);
    }
    return sortOrder === 'asc' ? comp : -comp;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedComplaints = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setPriorityFilter('ALL');
    setSortBy('score');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 py-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Complaint Triage & Work Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dispatch, assign, and manage citizen complaints across municipal departments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
          >
            Reset Filters
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/report')}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Manual Intake
          </Button>
        </div>
      </div>

      {/* Multi-Filter Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-3 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by tracking code (e.g. CF-2026-8942), description, or street name..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-canvas text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-canvas text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Categorized">Categorized</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={e => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-canvas text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="ALL">All Sectors</option>
            <option value="Roads">Roads & Public Works</option>
            <option value="Street Lighting">Street Lighting & Grid</option>
            <option value="Water Supply">Water Supply & Hydrology</option>
            <option value="Sanitation">Sanitation & Waste</option>
            <option value="Traffic Signals">Traffic Signals</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={e => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-canvas text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Sort By */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={e => {
              const [sb, so] = e.target.value.split('-') as [any, any];
              setSortBy(sb);
              setSortOrder(so);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-canvas text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="score-desc">Highest Priority First</option>
            <option value="score-asc">Lowest Priority First</option>
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Desktop Data Table */}
      <div className="hidden lg:block rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-dark-border bg-slate-50/70 dark:bg-dark-canvas/70 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
              <th className="py-3.5 px-4">Tracking Code</th>
              <th className="py-3.5 px-4">Title & Location</th>
              <th className="py-3.5 px-4">Sector</th>
              <th className="py-3.5 px-4">Priority (Score)</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Department / Agent</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-dark-border/60">
            {paginatedComplaints.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No complaints match your active filters.
                </td>
              </tr>
            ) : (
              paginatedComplaints.map(item => (
                <tr
                  key={item.id}
                  onClick={() => navigate(`/admin/complaints/${item.id}`)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-brand-teal dark:text-brand-cyan">
                    {item.trackingId}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-brand-teal dark:group-hover:text-brand-cyan">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {item.location.address}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <CategoryBadge category={item.category} size="sm" />
                  </td>
                  <td className="py-3.5 px-4">
                    <PriorityBadge priority={item.priority} score={item.priorityScore} size="sm" />
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={item.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {item.departmentName || <span className="text-slate-400 italic">Unassigned</span>}
                      </div>
                      {item.assignedStaffName && (
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <UserCheck className="h-3 w-3 text-brand-teal dark:text-brand-cyan" />
                          {item.assignedStaffName}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/admin/complaints/${item.id}`);
                      }}
                      rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
                    >
                      Inspect
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="lg:hidden space-y-3">
        {paginatedComplaints.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-xs text-slate-500">
            No complaints match your active filters.
          </div>
        ) : (
          paginatedComplaints.map(item => (
            <div
              key={item.id}
              onClick={() => navigate(`/admin/complaints/${item.id}`)}
              className="p-4 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-3 shadow-sm hover:border-brand-cyan/40 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-brand-teal dark:text-brand-cyan">
                  {item.trackingId}
                </span>
                <StatusBadge status={item.status} size="sm" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {item.location.address}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-dark-border/60">
                <div className="flex items-center gap-2">
                  <CategoryBadge category={item.category} size="sm" />
                  <PriorityBadge priority={item.priority} score={item.priorityScore} size="sm" />
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2 text-xs text-slate-500">
        <div>
          Showing {filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{' '}
          {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} complaints
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
