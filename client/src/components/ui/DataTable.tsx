import React from 'react';
import { CivicReport } from '../../types';
import { StatusBadge } from './StatusBadge';
import { ExternalLink, Bot, AlertTriangle } from 'lucide-react';

interface DataTableProps {
  reports: CivicReport[];
  selectedReportId?: string;
  onSelectReport: (report: CivicReport) => void;
  onTriggerTriage: (reportId: string) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  reports,
  selectedReportId,
  onSelectReport,
  onTriggerTriage,
}) => {
  if (reports.length === 0) {
    return (
      <div className="bg-surface border border-stroke-hairline rounded-base p-12 text-center shadow-subtle">
        <p className="text-sm font-semibold text-navy">No civic incidents match current filter criteria.</p>
        <p className="text-xs text-navy/60 mt-1">Adjust filters or submit a new citizen report.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-surface border border-stroke-hairline rounded-base shadow-subtle">
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-canvas border-b border-stroke-hairline text-navy/80 text-xs font-semibold uppercase tracking-wider select-none">
          <tr>
            <th className="py-3 px-4">Tracking Code</th>
            <th className="py-3 px-4">Timestamp</th>
            <th className="py-3 px-4">Category</th>
            <th className="py-3 px-4">Incident Detail & Location</th>
            <th className="py-3 px-4 text-center">Urgency</th>
            <th className="py-3 px-4">Priority</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stroke-hairline">
          {reports.map((report) => {
            const isSelected = selectedReportId === report.id;
            const latestInsight = report.aiInsights && report.aiInsights.length > 0 ? report.aiInsights[0] : null;
            const urgency = latestInsight ? latestInsight.urgencyScore : 0.25;

            return (
              <tr
                key={report.id}
                onClick={() => onSelectReport(report)}
                className={`transition-colors cursor-pointer ${
                  isSelected ? 'bg-civic-light/40 border-l-2 border-l-civic' : 'hover:bg-canvas/70'
                }`}
              >
                {/* Tracking Code */}
                <td className="py-3 px-4 font-mono text-xs font-bold text-navy tnum whitespace-nowrap">
                  {report.trackingCode}
                </td>

                {/* Timestamp */}
                <td className="py-3 px-4 text-xs text-navy/70 tnum whitespace-nowrap">
                  {new Date(report.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </td>

                {/* Category */}
                <td className="py-3 px-4 text-xs font-semibold text-navy whitespace-nowrap">
                  <span className="px-2 py-0.5 bg-canvas rounded-sm border border-stroke-hairline text-navy/90">
                    {report.category}
                  </span>
                </td>

                {/* Incident Detail */}
                <td className="py-3 px-4 max-w-sm">
                  <p className="text-sm font-semibold text-navy truncate" title={report.title}>
                    {report.title}
                  </p>
                  <p className="text-xs text-navy/60 truncate" title={report.locationAddress}>
                    {report.locationAddress}
                  </p>
                </td>

                {/* Urgency Score */}
                <td className="py-3 px-4 text-center whitespace-nowrap">
                  {latestInsight ? (
                    <div className="inline-flex items-center space-x-1.5">
                      <span
                        className={`text-xs font-bold tnum ${
                          urgency >= 0.75
                            ? 'text-red-600'
                            : urgency >= 0.45
                            ? 'text-amber-600'
                            : 'text-civic'
                        }`}
                      >
                        {(urgency * 100).toFixed(0)}%
                      </span>
                      {urgency >= 0.75 && <AlertTriangle className="w-3.5 h-3.5 text-red-500 inline" />}
                    </div>
                  ) : (
                    <span className="text-xs text-navy/40 italic">Pending AI</span>
                  )}
                </td>

                {/* Priority */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <StatusBadge priority={report.priority} />
                </td>

                {/* Status */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <StatusBadge status={report.status} />
                </td>

                {/* Action */}
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                    {!latestInsight && (
                      <button
                        onClick={() => onTriggerTriage(report.id)}
                        className="inline-flex items-center space-x-1 text-xs font-medium text-civic hover:text-civic-dark bg-civic-light px-2 py-1 rounded-base border border-civic/20 transition-colors"
                        title="Run Multi-Agent AI Triage"
                      >
                        <Bot className="w-3 h-3" />
                        <span>Triage</span>
                      </button>
                    )}
                    <button
                      onClick={() => onSelectReport(report)}
                      className="inline-flex items-center space-x-1 text-xs font-medium text-cobalt hover:text-cobalt-dark bg-cobalt-light px-2 py-1 rounded-base border border-cobalt/20 transition-colors"
                    >
                      <span>Inspect</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
