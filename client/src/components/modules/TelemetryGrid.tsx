import React from 'react';
import { TelemetryStream } from '../../types';
import { Activity, AlertOctagon, Droplets, Zap, Wind, Navigation, Radio } from 'lucide-react';
import { Button } from '../ui/Button';

interface TelemetryGridProps {
  telemetry: TelemetryStream[];
  onSimulateAnomaly: () => void;
  isSimulating: boolean;
}

export const TelemetryGrid: React.FC<TelemetryGridProps> = ({
  telemetry,
  onSimulateAnomaly,
  isSimulating,
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'WATER_LEVEL_METRIC':
        return <Droplets className="w-4 h-4 text-cyan-600" />;
      case 'POWER_GRID_VOLTAGE':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'AIR_QUALITY_PPM':
        return <Wind className="w-4 h-4 text-emerald-600" />;
      case 'TRAFFIC_SENSOR':
        return <Navigation className="w-4 h-4 text-indigo-500" />;
      default:
        return <Activity className="w-4 h-4 text-navy/70" />;
    }
  };

  return (
    <div className="bg-surface border border-stroke-hairline rounded-base p-4 shadow-subtle space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stroke-hairline pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-civic-light rounded-base text-civic">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-navy">Municipal Telemetry Sensor Grid</h3>
            <p className="text-xs text-navy/60">Real-time edge telemetry with continuous anomaly threshold detection.</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs text-navy/70 tnum font-medium">
            Active Nodes: <strong className="text-navy">{telemetry.length}</strong>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onSimulateAnomaly}
            isLoading={isSimulating}
            className="text-xs"
          >
            Simulate Telemetry Spike
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {telemetry.map((sensor) => {
          const ratio = (sensor.metricValue / sensor.threshold) * 100;
          const isOver = sensor.isAnomaly;

          return (
            <div
              key={sensor.id}
              className={`p-3 rounded-base border transition-all ${
                isOver
                  ? 'bg-red-50/70 border-red-200 shadow-sm'
                  : 'bg-canvas/50 border-stroke-hairline hover:bg-canvas'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="p-1 bg-surface rounded-sm border border-stroke-hairline">
                  {getIcon(sensor.sensorType)}
                </span>
                <span className="text-[10px] font-mono uppercase text-navy/50 tnum">
                  {sensor.sensorId}
                </span>
              </div>

              <h4 className="text-xs font-bold text-navy truncate" title={sensor.sensorName}>
                {sensor.sensorName}
              </h4>
              <p className="text-[11px] text-navy/60 truncate" title={sensor.location}>
                {sensor.location}
              </p>

              <div className="mt-2.5 flex items-baseline justify-between">
                <span className="text-lg font-bold text-navy tnum">
                  {sensor.metricValue}{' '}
                  <span className="text-[11px] font-normal text-navy/60">{sensor.unit}</span>
                </span>
                <span className="text-[11px] text-navy/50 tnum">
                  Limit: {sensor.threshold} {sensor.unit}
                </span>
              </div>

              {/* Threshold Bar */}
              <div className="w-full bg-stroke-hairline h-1 rounded-full overflow-hidden mt-1.5">
                <div
                  className={`h-full transition-all duration-300 ${
                    isOver ? 'bg-red-600' : ratio > 75 ? 'bg-amber-500' : 'bg-civic'
                  }`}
                  style={{ width: `${Math.min(ratio, 100)}%` }}
                />
              </div>

              {isOver && (
                <div className="mt-2 flex items-center space-x-1 text-[11px] text-red-700 font-semibold">
                  <AlertOctagon className="w-3 h-3 text-red-600" />
                  <span>Threshold Exceeded</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
