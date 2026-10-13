import React, { useState } from 'react';
import { CivicReport } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import {
  X,
  Bot,
  ShieldAlert,
  HeartHandshake,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  RefreshCw,
  Building2
} from 'lucide-react';

interface AITriageDrawerProps {
  report: CivicReport | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onTriggerTriage: (id: string) => Promise<void>;
}

export const AITriageDrawer: React.FC<AITriageDrawerProps> = ({
  report,
  onClose,
  onUpdateStatus,
  onTriggerTriage,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRetryingAI, setIsRetryingAI] = useState(false);

  if (!report) return null;

  const latestInsight = report.aiInsights && report.aiInsights.length > 0 ? report.aiInsights[0] : null;

  const handleStatusChange = async (status: string) => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(report.id, status);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRetriage = async () => {
    setIsRetryingAI(true);
    try {
      await onTriggerTriage(report.id);
    } finally {
      setIsRetryingAI(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-navy/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-surface h-full shadow-modal border-l border-stroke-hairline flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="bg-canvas border-b border-stroke-hairline p-5 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-navy tnum px-2 py-0.5 bg-surface border border-stroke-hairline rounded-sm">
                {report.trackingCode}
              </span>
              <StatusBadge priority={report.priority} />
              <StatusBadge status={report.status} />
            </div>
            <h2 className="text-base font-bold text-navy leading-snug pt-1">
              {report.title}
            </h2>
            <div className="flex items-center space-x-3 text-xs text-navy/60 tnum">
              <span className="flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-navy/40" />
                <span>{report.locationAddress}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-navy/40" />
                <span>{new Date(report.createdAt).toLocaleTimeString()}</span>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-base text-navy/50 hover:text-navy hover:bg-stroke-hairline transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Incident Description */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy/60">
              Citizen Field Log
            </h4>
            <div className="p-3.5 bg-canvas/60 border border-stroke-hairline rounded-base text-sm text-navy leading-relaxed">
              {report.description}
            </div>
            <div className="text-[11px] text-navy/50 tnum">
              Coordinates: {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
            </div>
          </div>

          {/* AI Intelligence Synthesis */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-civic-light rounded-sm text-civic">
                  <Bot className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-navy">
                  CivicFlow Multi-Agent Triage Synthesis
                </h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetriage}
                isLoading={isRetryingAI}
                className="text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Re-evaluate
              </Button>
            </div>

            {latestInsight ? (
              <div className="space-y-4">
                {/* Summary Banner */}
                <div className="p-4 bg-navy text-surface rounded-base border border-navy-hover space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-surface/70">
                    <span className="flex items-center space-x-1.5">
                      <Building2 className="w-3.5 h-3.5 text-civic" />
                      <span>Target: {latestInsight.targetDepartment}</span>
                    </span>
                    <span className="tnum text-civic">
                      Confidence: {(latestInsight.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-surface">
                    {latestInsight.summary}
                  </p>
                  <div className="text-xs text-civic-light pt-1 border-t border-surface/10 font-mono">
                    Action: {latestInsight.suggestedAction}
                  </div>
                </div>

                {/* The 3 Dedicated Agents */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Agent 1 */}
                  <div className="p-3.5 bg-canvas border border-stroke-hairline rounded-base space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-navy">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                      <span>1. Triage Agent</span>
                    </div>
                    <div className="text-[11px] text-navy/70 space-y-1">
                      <p>
                        <strong>Hazard:</strong>{' '}
                        {latestInsight.agentEvaluations?.triageAgent.hazardSeverity || 'Assessed Level'}
                      </p>
                      <p>
                        <strong>Vulnerability:</strong>{' '}
                        {latestInsight.agentEvaluations?.triageAgent.infrastructuralVulnerability || 'Standard impact'}
                      </p>
                    </div>
                  </div>

                  {/* Agent 2 */}
                  <div className="p-3.5 bg-canvas border border-stroke-hairline rounded-base space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-navy">
                      <HeartHandshake className="w-3.5 h-3.5 text-cobalt" />
                      <span>2. Sentiment Agent</span>
                    </div>
                    <div className="text-[11px] text-navy/70 space-y-1">
                      <p>
                        <strong>Agitation:</strong>{' '}
                        {latestInsight.agentEvaluations?.sentimentAgent.publicAgitation || 'Evaluated'}
                      </p>
                      <p>
                        <strong>Sentiment Index:</strong>{' '}
                        <span className="tnum font-bold text-navy">
                          {latestInsight.sentimentIndex.toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Agent 3 */}
                  <div className="p-3.5 bg-canvas border border-stroke-hairline rounded-base space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-navy">
                      <Truck className="w-3.5 h-3.5 text-civic" />
                      <span>3. Dispatch Agent</span>
                    </div>
                    <div className="text-[11px] text-navy/70 space-y-1">
                      <p>
                        <strong>Order:</strong>{' '}
                        {latestInsight.agentEvaluations?.dispatchAgent.workOrderType || 'DISPATCH_STD'}
                      </p>
                      <p>
                        <strong>Est. Resolution:</strong>{' '}
                        <span className="tnum font-bold text-navy">
                          {latestInsight.agentEvaluations?.dispatchAgent.estimatedResolutionHours || 2}h
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-canvas border border-stroke-hairline rounded-base text-center space-y-2">
                <p className="text-xs text-navy/60">No AI insight recorded yet for this incident.</p>
                <Button size="sm" variant="secondary" onClick={handleRetriage} isLoading={isRetryingAI}>
                  Initiate AI Triage
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-canvas border-t border-stroke-hairline p-4 flex items-center justify-between">
          <div className="text-xs text-navy/60">
            Current Status: <strong className="text-navy">{report.status}</strong>
          </div>
          <div className="flex items-center space-x-2">
            {report.status !== 'DISPATCHED' && report.status !== 'RESOLVED' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleStatusChange('DISPATCHED')}
                isLoading={isUpdating}
              >
                <Truck className="w-3.5 h-3.5 mr-1" />
                Authorize Dispatch
              </Button>
            )}

            {report.status !== 'RESOLVED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('RESOLVED')}
                isLoading={isUpdating}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Mark Resolved
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={onClose}>
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
