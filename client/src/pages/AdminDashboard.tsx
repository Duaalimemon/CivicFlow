import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  History
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import { useApp } from '../context/AppContext';
import { StatusBadge, PriorityBadge } from '../components/ui/StatusBadge';
import { CategoryBadge } from '../components/ui/CategoryBadge';
import { Button } from '../components/ui/Button';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { complaints, departments, auditLogs } = useApp();

  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Filter complaints based on selection
  const filtered = categoryFilter === 'ALL'
    ? complaints
    : complaints.filter(c => c.category === categoryFilter);

  // Key performance indicators derived from state
  const totalCount = filtered.length;
  const openCount = filtered.filter(c => c.status !== 'Resolved').length;
  const urgentCount = filtered.filter(c => (c.priority === 'Urgent' || c.priority === 'High') && c.status !== 'Resolved').length;
  const resolvedCount = filtered.filter(c => c.status === 'Resolved').length;

  // Category distribution data for Donut Chart
  const categoryCounts: Record<string, number> = {};
  filtered.forEach(c => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  });

  const donutData = Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const DONUT_COLORS = ['#F59E0B', '#00F2FE', '#2563EB', '#10B981', '#8B5CF6'];

  // Monthly Submission vs Resolution Trend Data
  const trendData = [
    { month: 'Jun', submitted: 18, resolved: 14 },
    { month: 'Jul', submitted: 25, resolved: 22 },
    { month: 'Aug', submitted: 32, resolved: 28 },
    { month: 'Sep', submitted: 29, resolved: 26 },
    { month: 'Oct', submitted: filtered.length, resolved: resolvedCount },
  ];

  // Urgent triage queue
  const urgentQueue = complaints
    .filter(c => c.status !== 'Resolved')
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 5);

  return (
    <div className="space-y-8 py-4">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-teal dark:text-brand-cyan">
            <Activity className="h-4 w-4" />
            <span>Executive Command Center</span>
            <span>·</span>
            <span>Live Municipal Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Municipal Operations Cockpit
          </h1>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="ALL">All Civic Sectors</option>
            <option value="Roads">Roads & Public Works</option>
            <option value="Street Lighting">Street Lighting & Grid</option>
            <option value="Water Supply">Water Supply & Hydrology</option>
            <option value="Sanitation">Sanitation & Waste</option>
            <option value="Traffic Signals">Traffic Signals</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Intake Reports
          </span>
          <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white mt-2">
            {totalCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">From web & mobile citizens</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active Open Queue
          </span>
          <div className="text-3xl font-extrabold font-mono text-cyan-500 mt-2">
            {openCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Awaiting completion</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            High & Urgent Tickets
          </span>
          <div className="text-3xl font-extrabold font-mono text-rose-500 mt-2">
            {urgentCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Flagged for rapid dispatch</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Verified Resolved
          </span>
          <div className="text-3xl font-extrabold font-mono text-emerald-500 mt-2">
            {resolvedCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">100% photo-verified</p>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Donut Chart */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Incident Sector Breakdown
              </h3>
              <p className="text-xs text-slate-500">Distribution of intake tickets by municipal department</p>
            </div>
            <BarChart3 className="h-5 w-5 text-brand-teal dark:text-brand-cyan" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B101D',
                    borderColor: '#1E293B',
                    borderRadius: '0.75rem',
                    color: '#F1F5F9',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs pt-2">
            {donutData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                />
                <span className="text-slate-600 dark:text-slate-400">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Submission vs Resolution Trend Bar Chart */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Intake vs. Resolution Velocity
              </h3>
              <p className="text-xs text-slate-500">Monthly throughput comparison</p>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B101D',
                    borderColor: '#1E293B',
                    borderRadius: '0.75rem',
                    color: '#F1F5F9',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="submitted" name="New Reports" fill="#00F2FE" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved Cases" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Department Workload & Urgent Queue Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Workload Progress Bars */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Department Workload Capacity
              </h3>
              <p className="text-xs text-slate-500">Active tickets & avg resolution SLA by division</p>
            </div>
            <Users className="h-5 w-5 text-purple-400" />
          </div>

          <div className="space-y-4 pt-2">
            {departments.map(dept => {
              const deptComplaints = complaints.filter(c => c.departmentId === dept.id && c.status !== 'Resolved');
              const loadPercent = Math.min(100, Math.round((deptComplaints.length / 10) * 100));

              return (
                <div key={dept.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {dept.name} ({dept.code})
                    </span>
                    <span className="font-mono text-slate-500">
                      {deptComplaints.length} active · ~{dept.avgResolutionHours}h avg
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${loadPercent}%`,
                        backgroundColor: dept.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Triage Queue */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Urgent Priority Queue
              </h3>
              <p className="text-xs text-slate-500">Top prioritized tickets awaiting municipal intervention</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/admin/complaints')}
            >
              All Complaints
            </Button>
          </div>

          <div className="space-y-2.5">
            {urgentQueue.map(item => (
              <div
                key={item.id}
                onClick={() => navigate(`/admin/complaints/${item.id}`)}
                className="p-3 rounded-xl border border-slate-200 dark:border-dark-border hover:border-brand-cyan/40 bg-slate-50/50 dark:bg-dark-canvas/50 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-brand-teal dark:text-brand-cyan">
                      {item.trackingId}
                    </span>
                    <PriorityBadge priority={item.priority} score={item.priorityScore} size="sm" />
                    <StatusBadge status={item.status} size="sm" />
                  </div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-teal dark:group-hover:text-brand-cyan">
                    {item.title}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-brand-cyan transition-colors shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Audit Ledger */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-brand-teal dark:text-brand-cyan" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Immutable Municipal Audit Ledger
              </h3>
              <p className="text-xs text-slate-500">Timestamped administrative actions recorded across the prototype</p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {auditLogs.length} events logged
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-dark-border/60">
          {auditLogs.slice(0, 5).map(log => (
            <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-brand-teal dark:text-brand-cyan">
                    {log.trackingId}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-400">
                    {log.action}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300">
                  {log.details}
                </p>
              </div>

              <div className="text-right sm:shrink-0 text-[11px] text-slate-500 font-mono">
                <div>{log.actorName} ({log.actorRole})</div>
                <div>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
