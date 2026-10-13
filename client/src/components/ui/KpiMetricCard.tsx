import React from 'react';

interface KpiMetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
  isTelemetryLive?: boolean;
  accentColor?: 'teal' | 'cobalt' | 'navy' | 'red';
  icon?: React.ReactNode;
}

export const KpiMetricCard: React.FC<KpiMetricCardProps> = ({
  label,
  value,
  unit,
  delta,
  subtitle,
  isTelemetryLive = false,
  icon,
}) => {
  return (
    <div className="bg-surface border border-stroke-hairline rounded-base p-4 shadow-subtle flex flex-col justify-between transition-all duration-150 hover:shadow-elevated">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {icon && <span className="text-navy/70">{icon}</span>}
          <span className="text-xs font-semibold tracking-wider uppercase text-navy/70">
            {label}
          </span>
        </div>
        {isTelemetryLive && (
          <div className="flex items-center space-x-1.5" title="Live Civic Telemetry Active">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-civic opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-civic" />
            </span>
            <span className="text-[10px] uppercase font-bold text-civic tracking-wide">Live</span>
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-2 my-1">
        {/* Universal Swiss Tabular Figure */}
        <span className="text-2xl font-bold tracking-tight text-navy tnum">
          {value}
        </span>
        {unit && <span className="text-xs font-semibold text-navy/50">{unit}</span>}
        {delta && (
          <span
            className={`text-xs font-semibold tnum px-1.5 py-0.5 rounded-sm ml-auto ${
              delta.isPositive
                ? 'bg-civic-light text-civic-dark'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {delta.isPositive ? '↑' : '↓'} {delta.value}
          </span>
        )}
      </div>

      {subtitle && (
        <span className="text-xs text-navy/60 mt-1 truncate" title={subtitle}>
          {subtitle}
        </span>
      )}
    </div>
  );
};
