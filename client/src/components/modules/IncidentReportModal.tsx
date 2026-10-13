import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { FormInput } from '../ui/FormInput';
import { X, Send, AlertCircle } from 'lucide-react';

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
  isOpen,
  onClose,
  onSubmitSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Water Grid',
    locationAddress: '',
    description: '',
    latitude: 40.7128,
    longitude: -74.0060,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      let json: any = null;
      try {
        const text = await res.text();
        if (text && text.trim().length > 0) {
          json = JSON.parse(text);
        }
      } catch {
        json = null;
      }

      if (!res.ok) {
        throw new Error(json?.message || `Failed to submit incident (HTTP ${res.status}).`);
      }

      onSubmitSuccess();
      onClose();
      setFormData({
        title: '',
        category: 'Water Grid',
        locationAddress: '',
        description: '',
        latitude: 40.7128,
        longitude: -74.0060,
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      {/* 12px modal border radius according to DESIGN.md */}
      <div className="bg-surface rounded-modal border border-stroke-hairline shadow-modal w-full max-w-xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-canvas border-b border-stroke-hairline px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-navy">Submit Civic Incident Report</h3>
            <p className="text-xs text-navy/60">
              Immediate ingestion into the CivicFlow Multi-Agent Triage Engine.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-base text-navy/60 hover:text-navy hover:bg-stroke-hairline transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-base flex items-start space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <FormInput
            label="Incident Title"
            required
            placeholder="e.g. Critical Water Main Rupture at Sector 4"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-navy">Municipal Category</label>
              <select
                className="h-10 px-3 bg-surface text-navy text-sm border rounded-base border-stroke-hairline focus:outline-none focus:border-civic focus:ring-1 focus:ring-civic transition-colors"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Water Grid">Water Grid & Infrastructure</option>
                <option value="Power Grid">Electrical Power Distribution</option>
                <option value="Roads & Transit">Roads & Transit Network</option>
                <option value="Sanitation">Public Sanitation & Drainage</option>
                <option value="Hazardous Materials">Civil Safety & Hazmat</option>
              </select>
            </div>

            <FormInput
              label="Incident Location"
              required
              placeholder="e.g. 1044 Civic Blvd & 4th Ave"
              value={formData.locationAddress}
              onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Latitude"
              type="number"
              step="any"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
            />
            <FormInput
              label="Longitude"
              type="number"
              step="any"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-navy">Operational Description</label>
            <textarea
              required
              rows={4}
              placeholder="Specify structural observations, perceived hazards, flow rate, or utility disruptions..."
              className="p-3 bg-surface text-navy text-sm border rounded-base border-stroke-hairline focus:outline-none focus:border-civic focus:ring-1 focus:ring-civic transition-colors placeholder:text-navy/40"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-stroke-hairline">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Dispatch to Triage
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
