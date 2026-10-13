import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  MapPin,
  UploadCloud,
  Trash2,
  FileText,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ComplaintCategory } from '../types';
import { suggestCategory, calculatePriority } from '../utils/triage';
import { Button } from '../components/ui/Button';
import { LeafletMap } from '../components/map/LeafletMap';
import { PriorityBadge, StatusBadge } from '../components/ui/StatusBadge';
import { CategoryBadge } from '../components/ui/CategoryBadge';

export const ComplaintWizard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createComplaint } = useApp();

  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState<any>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('Roads');
  const [safetyConcern, setSafetyConcern] = useState(false);

  // Location state
  const [address, setAddress] = useState('450 5th Avenue, Metro District');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 40.7512,
    lng: -73.9825,
  });

  // Media state
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Query parameter pre-fill
  useEffect(() => {
    const qCat = searchParams.get('category');
    if (qCat && ['Roads', 'Street Lighting', 'Sanitation', 'Water Supply', 'Traffic Signals'].includes(qCat)) {
      setCategory(qCat as ComplaintCategory);
    }
  }, [searchParams]);

  // Dynamic deterministic AI suggestions
  const suggestion = suggestCategory(title, description);
  const priorityCalc = calculatePriority(title, description, safetyConcern, category);

  // Handle file drop / upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files (JPEG, PNG, WebP) are permitted for field inspection.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds the 5MB demonstration ceiling.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const newAtt = {
        id: `att-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl: reader.result as string,
        uploadedAt: new Date().toISOString(),
      };
      setAttachments(prev => [...prev, newAtt]);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // Step 1 Validation
  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Complaint title is required.';
    else if (title.trim().length < 5) errs.title = 'Title must be at least 5 characters long.';

    if (!description.trim()) errs.description = 'Please describe the incident in detail.';
    else if (description.trim().length < 15) errs.description = 'Provide at least 15 characters to assist automated triage.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!address.trim()) errs.address = 'Street address or landmark description is mandatory.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  // Submit Handler
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Simulate short network latency
      await new Promise(res => setTimeout(res, 600));

      const newRecord = createComplaint({
        title,
        description,
        category,
        suggestedCategory: suggestion.suggested,
        categoryExplanation: suggestion.explanation,
        priority: priorityCalc.priority,
        priorityScore: priorityCalc.score,
        priorityExplanation: priorityCalc.explanation,
        location: {
          address,
          lat: coords.lat,
          lng: coords.lng,
        },
        safetyConcern,
        attachments,
      });

      setSubmittedComplaint(newRecord);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepLabels = [
    'Category & Details',
    'Geographic Location',
    'Media Evidence',
    'Review & Submit',
  ];

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-8">
      {/* Wizard Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-teal dark:text-brand-cyan">
          <span>Intake Portal</span>
          <span>·</span>
          <span>Smart Triage Enabled</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Report a Municipal Incident
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Complete the 4-step intake. Our automated triage engine will evaluate urgency and route the ticket to the responsible field team.
        </p>
      </div>

      {/* Stepper Progress Bar */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {stepLabels.map((label, idx) => {
            const stepNum = idx + 1;
            const isCompleted = currentStep > stepNum;
            const isActive = currentStep === stepNum;

            return (
              <div key={label} className="flex-1 flex flex-col items-center relative group">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : isActive
                      ? 'bg-brand-cyan text-slate-950 font-black ring-4 ring-brand-cyan/20'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
                </div>
                <span
                  className={`mt-2 text-[11px] font-medium hidden sm:block ${
                    isActive
                      ? 'text-brand-teal dark:text-brand-cyan font-semibold'
                      : 'text-slate-500'
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Step Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card p-6 sm:p-8 shadow-sm space-y-6">
        {/* STEP 1: Details & Category */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Complaint Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Deep pothole damaging cars outside 5th Avenue Metro"
                className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-dark-canvas text-sm text-slate-900 dark:text-white focus:outline-none transition-colors ${
                  errors.title ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 dark:border-dark-border'
                }`}
              />
              {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Detailed Incident Description *
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe exact conditions, severity, duration, and safety hazards to help algorithmic dispatch..."
                className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-dark-canvas text-sm text-slate-900 dark:text-white focus:outline-none transition-colors ${
                  errors.description ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 dark:border-dark-border'
                }`}
              />
              {errors.description && <p className="text-xs text-rose-500 mt-1">{errors.description}</p>}
            </div>

            {/* Smart Suggested Category Banner */}
            {(title.length > 5 || description.length > 10) && (
              <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-500/5 dark:bg-brand-cyan/5 flex items-start gap-3">
                <Sparkles className="h-4 w-4 text-brand-teal dark:text-brand-cyan shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">Suggested Sector:</span>
                    <CategoryBadge category={suggestion.suggested} size="sm" />
                    {category !== suggestion.suggested && (
                      <button
                        type="button"
                        onClick={() => setCategory(suggestion.suggested)}
                        className="text-brand-teal dark:text-brand-cyan hover:underline font-semibold"
                      >
                        (Apply Suggestion)
                      </button>
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    {suggestion.explanation}
                  </p>
                </div>
              </div>
            )}

            {/* Category Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Category Selection
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {(['Roads', 'Street Lighting', 'Sanitation', 'Water Supply', 'Traffic Signals'] as ComplaintCategory[]).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      category === cat
                        ? 'border-brand-cyan bg-brand-cyan/10 text-brand-teal dark:text-brand-cyan font-bold ring-1 ring-brand-cyan/40'
                        : 'border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-medium">{cat}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Public Safety Flag */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-canvas/50 flex items-start gap-3">
              <input
                id="safetyFlag"
                type="checkbox"
                checked={safetyConcern}
                onChange={e => setSafetyConcern(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-teal focus:ring-brand-cyan"
              />
              <label htmlFor="safetyFlag" className="cursor-pointer">
                <span className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  Flag as immediate public safety hazard
                </span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Raises the deterministic priority score (+30pts) to expedite immediate inspection crew assignment.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* STEP 2: Geographic Location */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Street Address or Landmark *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. 450 5th Avenue, Metro District"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-dark-canvas text-sm text-slate-900 dark:text-white focus:outline-none ${
                    errors.address ? 'border-rose-500' : 'border-slate-300 dark:border-dark-border'
                  }`}
                />
              </div>
              {errors.address && <p className="text-xs text-rose-500 mt-1">{errors.address}</p>}
            </div>

            {/* Interactive Leaflet Location Picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Pinpoint Exact Coordinates On Map
                </span>
                <span className="font-mono text-slate-500">
                  Lat: {coords.lat.toFixed(4)}, Lng: {coords.lng.toFixed(4)}
                </span>
              </div>

              <LeafletMap
                interactivePicker={true}
                selectedLocation={coords}
                onLocationSelect={(lat, lng) => setCoords({ lat, lng })}
                height="320px"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Media Evidence */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Upload Field Photo Evidence
              </label>
              <p className="text-xs text-slate-500 mb-4">
                Visual proof speeds up crew validation and allows before/after resolution verification.
              </p>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-300 dark:border-dark-border hover:border-brand-cyan/60 rounded-2xl p-8 text-center transition-colors bg-slate-50/50 dark:bg-dark-canvas/50">
                <UploadCloud className="h-10 w-10 mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Drag and drop photo here, or browse files
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supported formats: PNG, JPG, WebP (max 5MB)
                </p>

                <input
                  type="file"
                  id="mediaUpload"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="mediaUpload"
                  className="mt-4 inline-block px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  Select File from Device
                </label>
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs mt-3">
                  {uploadError}
                </div>
              )}
            </div>

            {/* Uploaded attachments preview */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Attached Files ({attachments.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attachments.map(att => (
                    <div
                      key={att.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-canvas flex items-center gap-3 relative group"
                    >
                      <img
                        src={att.previewUrl}
                        alt="Evidence preview"
                        className="h-12 w-12 rounded-lg object-cover border border-slate-200 dark:border-dark-border"
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {att.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {(att.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(att.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Remove attachment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Review and Submit */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="p-4 rounded-xl border border-brand-cyan/30 bg-cyan-500/5 dark:bg-brand-cyan/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand-teal dark:text-brand-cyan" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Automated Triage Assessment
                  </span>
                </div>
                <PriorityBadge priority={priorityCalc.priority} score={priorityCalc.score} />
              </div>

              <div className="space-y-1.5 pt-1 text-xs">
                <div className="text-slate-700 dark:text-slate-300 font-medium">Scoring Breakdown:</div>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400 pl-4 list-disc text-[11px]">
                  {priorityCalc.explanation.factors.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Field Summaries with Edit Links */}
            <div className="divide-y divide-slate-100 dark:divide-dark-border/60 text-xs space-y-4">
              <div className="pt-2 flex justify-between items-start">
                <div className="space-y-1 max-w-lg">
                  <span className="text-slate-500 block uppercase tracking-wider text-[10px] font-bold">
                    Title & Category
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <CategoryBadge category={category} size="sm" />
                    {safetyConcern && (
                      <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Safety Hazard Flagged
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-brand-teal dark:text-brand-cyan hover:underline font-semibold text-xs"
                >
                  Edit
                </button>
              </div>

              <div className="pt-4 flex justify-between items-start">
                <div className="space-y-1 max-w-lg">
                  <span className="text-slate-500 block uppercase tracking-wider text-[10px] font-bold">
                    Description
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-brand-teal dark:text-brand-cyan hover:underline font-semibold text-xs"
                >
                  Edit
                </button>
              </div>

              <div className="pt-4 flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-slate-500 block uppercase tracking-wider text-[10px] font-bold">
                    Location
                  </span>
                  <p className="font-semibold text-slate-900 dark:text-white">{address}</p>
                  <p className="font-mono text-slate-500 text-[10px]">
                    Lat: {coords.lat.toFixed(4)}, Lng: {coords.lng.toFixed(4)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-brand-teal dark:text-brand-cyan hover:underline font-semibold text-xs"
                >
                  Edit
                </button>
              </div>

              <div className="pt-4 flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-slate-500 block uppercase tracking-wider text-[10px] font-bold">
                    Media Proof
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">
                    {attachments.length > 0 ? `${attachments.length} image attached` : 'No photos attached'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="text-brand-teal dark:text-brand-cyan hover:underline font-semibold text-xs"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-dark-border">
          {currentStep > 1 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              leftIcon={<ChevronLeft className="h-4 w-4" />}
            >
              Back
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <Button
              size="sm"
              onClick={handleNext}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              Continue
            </Button>
          ) : (
            <Button
              size="md"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              rightIcon={<CheckCircle2 className="h-4 w-4" />}
            >
              Submit Complaint
            </Button>
          )}
        </div>
      </div>

      {/* Post-Submission Success Dialog Modal */}
      {submittedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl glass-panel shadow-2xl p-6 sm:p-8 space-y-6 text-center animate-in zoom-in-95 duration-200 border border-brand-cyan/40">
            <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center ring-8 ring-emerald-500/10">
              <Check className="h-8 w-8 stroke-[3]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Complaint Registered
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Your incident has been recorded in the shared municipal state ledger with automated triage classification.
              </p>
            </div>

            {/* Tracking ID Badge */}
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-dark-card border border-slate-200 dark:border-dark-border space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Official Tracking ID
              </span>
              <div className="text-2xl font-black font-mono tracking-wider text-brand-teal dark:text-brand-cyan">
                {submittedComplaint.trackingId}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <CategoryBadge category={submittedComplaint.category} size="sm" />
              <PriorityBadge priority={submittedComplaint.priority} score={submittedComplaint.priorityScore} size="sm" />
              <StatusBadge status={submittedComplaint.status} size="sm" />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => navigate('/my-complaints')}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Track in My Complaints
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
              >
                Return to Overview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
