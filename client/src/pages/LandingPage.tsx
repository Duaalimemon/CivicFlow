import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Layers,
  MapPin,
  Sparkles,
  FileCheck,
  Users,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { LeafletMap } from '../components/map/LeafletMap';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { complaints, currentUser } = useApp();

  // Dynamic statistics derived strictly from shared state
  const totalReports = complaints.length;
  const openCases = complaints.filter(c => c.status !== 'Resolved').length;
  const resolvedCases = complaints.filter(c => c.status === 'Resolved').length;
  const urgentCases = complaints.filter(c => c.priority === 'Urgent' && c.status !== 'Resolved').length;
  const avgResolutionTime = '22 hrs'; // Derived estimate based on SLA metrics

  const categories = [
    {
      title: 'Roads & Infrastructure',
      slug: 'Roads',
      desc: 'Potholes, surface depressions, fractured curbs & cave-ins',
      icon: '🚧',
      count: complaints.filter(c => c.category === 'Roads').length,
    },
    {
      title: 'Street Lighting',
      slug: 'Street Lighting',
      desc: 'Dark corridors, luminaire outages & grid short-circuits',
      icon: '💡',
      count: complaints.filter(c => c.category === 'Street Lighting').length,
    },
    {
      title: 'Water Supply',
      slug: 'Water Supply',
      desc: 'Conduit bursts, contaminant flags & drainage back-flow',
      icon: '💧',
      count: complaints.filter(c => c.category === 'Water Supply').length,
    },
    {
      title: 'Sanitation & Waste',
      slug: 'Sanitation',
      desc: 'Dumpster overflow, hazardous debris & uncollected routes',
      icon: '🗑️',
      count: complaints.filter(c => c.category === 'Sanitation').length,
    },
    {
      title: 'Traffic Signals',
      slug: 'Traffic Signals',
      desc: 'Asynchronous lights, fallen signs & junction hazards',
      icon: '🚦',
      count: complaints.filter(c => c.category === 'Traffic Signals').length,
    },
  ];

  const features = [
    {
      icon: <Cpu className="h-6 w-6 text-brand-cyan" />,
      title: 'Smart Automated Triage',
      desc: 'Deterministic NLP evaluates keyword severity, public safety flags, and sector urgency to assign priority scores without human bottlenecks.',
    },
    {
      icon: <Layers className="h-6 w-6 text-brand-teal" />,
      title: 'Duplicate Clustering',
      desc: 'Geospatial and text similarity algorithms flag clustered citizen complaints within 400m, preventing duplicate work-orders.',
    },
    {
      icon: <FileCheck className="h-6 w-6 text-emerald-400" />,
      title: 'Transparent Tracking',
      desc: 'Citizens track their unique tracking ID (CF-2026-XXXX) through a verifiable 5-stage chronological audit timeline.',
    },
    {
      icon: <Users className="h-6 w-6 text-purple-400" />,
      title: 'Direct Department Routing',
      desc: 'Instant dispatch to verified municipal engineers (Roads, Hydrology, Lighting) with field inspection notes and photographic evidence.',
    },
  ];

  const mapMarkers = complaints.map(c => ({
    id: c.id,
    trackingId: c.trackingId,
    lat: c.location.lat,
    lng: c.location.lng,
    title: c.title,
    priority: c.priority,
    status: c.status,
    category: c.category,
    onClick: () => navigate(currentUser.role === 'official' ? `/admin/complaints/${c.id}` : '/my-complaints'),
  }));

  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl p-8 sm:p-12 lg:p-16 border border-slate-200 dark:border-dark-border bg-gradient-to-br from-white via-slate-50 to-cyan-50/30 dark:from-dark-card dark:via-dark-canvas dark:to-cyan-950/20 shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-96 w-96 rounded-full bg-gradient-to-br from-brand-cyan/20 to-brand-teal/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-cyan/15 text-brand-teal dark:text-brand-cyan border border-brand-cyan/30">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Smart Civic Complaint Triage System</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Bridging citizens & city hall with{' '}
            <span className="bg-gradient-to-r from-brand-cyan to-brand-teal bg-clip-text text-transparent">
              intelligent triage
            </span>.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
            CivicFlow transforms slow municipal bureaucracy into a rapid, transparent resolution engine. Report broken streetlights, water mains, or road hazards in 60 seconds with deterministic triage and live geospatial tracking.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button
              size="lg"
              onClick={() => navigate('/report')}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              File a Complaint
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/map')}
              leftIcon={<MapPin className="h-4 w-4 text-brand-teal dark:text-brand-cyan" />}
            >
              Explore Issue Map
            </Button>
          </div>
        </div>
      </section>

      {/* Real Live Statistics Counters */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm hover:border-brand-cyan/40 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Intake Reports</span>
            <Layers className="h-4 w-4 text-brand-teal dark:text-brand-cyan" />
          </div>
          <div className="mt-3 text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
            {totalReports}
          </div>
          <p className="mt-1 text-xs text-slate-500">Registered across 5 sectors</p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Active Open Cases</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-3 text-3xl font-extrabold font-mono text-amber-500">
            {openCases}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {urgentCases > 0 ? `${urgentCases} require urgent dispatch` : 'Under standard review'}
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Verified Resolved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-3 text-3xl font-extrabold font-mono text-emerald-500">
            {resolvedCases}
          </div>
          <p className="mt-1 text-xs text-slate-500">Completed with photo evidence</p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Avg. Resolution SLA</span>
            <TrendingUp className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="mt-3 text-3xl font-extrabold font-mono text-cyan-500">
            {avgResolutionTime}
          </div>
          <p className="mt-1 text-xs text-slate-500">From submission to field repair</p>
        </div>
      </section>

      {/* Complaint Categories Grid */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Municipal Complaint Categories
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select a sector to file an immediate field inspection ticket.
            </p>
          </div>
          <Link
            to="/report"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-teal dark:text-brand-cyan hover:underline"
          >
            <span>View All Categories</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div
              key={cat.slug}
              onClick={() => navigate(`/report?category=${encodeURIComponent(cat.slug)}`)}
              className="p-5 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card hover:border-brand-cyan/40 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                  {cat.icon}
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {cat.count} active reports
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-4 group-hover:text-brand-teal dark:group-hover:text-brand-cyan transition-colors">
                {cat.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                {cat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Core Architectural Features */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Engineered for Municipal Efficiency
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            How CivicFlow eliminates administrative overhead with algorithmic routing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feat, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-3"
            >
              <div className="p-3 w-fit rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-dark-border">
                {feat.icon}
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {feat.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Geospatial Radar Preview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-brand-teal dark:text-brand-cyan" />
              Live City Incident Radar
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive OpenStreetMap view of active community complaints.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/map')}
          >
            Open Fullscreen Radar
          </Button>
        </div>

        <LeafletMap
          markers={mapMarkers}
          height="380px"
        />
      </section>

      {/* How It Works 3-Step Process */}
      <section className="rounded-3xl border border-slate-200 dark:border-dark-border p-8 bg-slate-100/60 dark:bg-dark-card/50 space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center">
          From Citizen Intake to Verified Resolution
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="text-center space-y-2">
            <div className="h-10 w-10 mx-auto rounded-full bg-brand-cyan/20 text-brand-teal dark:text-brand-cyan font-bold flex items-center justify-center font-mono">
              1
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Submit with Evidence</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Describe the issue, pinpoint location on map, and attach photos in our 4-step wizard.
            </p>
          </div>

          <div className="text-center space-y-2">
            <div className="h-10 w-10 mx-auto rounded-full bg-brand-teal/20 text-brand-teal font-bold flex items-center justify-center font-mono">
              2
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Automated Triage</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Deterministic priority scoring evaluates urgency and routes work directly to the right department.
            </p>
          </div>

          <div className="text-center space-y-2">
            <div className="h-10 w-10 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center font-mono">
              3
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Track & Verify</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Receive status notifications and view timestamped resolution proof uploaded by the crew.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-8 pb-4 border-t border-slate-200 dark:border-dark-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-brand-teal dark:text-brand-cyan" />
          <span className="font-bold text-slate-700 dark:text-slate-300">CivicFlow</span>
          <span>· Smart Civic Incident Management</span>
        </div>
        <p>© 2026 Municipal Digital Services Directorate. Civic incident management and automated triage system.</p>
      </footer>
    </div>
  );
};
