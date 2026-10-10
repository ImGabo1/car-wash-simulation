import React from 'react';
import type { Station as StationType } from '../types/simulation';
import { STATUS_COLORS, STATUS_LABELS } from '../types/simulation';

interface StationProps {
  station: StationType;
  isLast: boolean;
  now: number;
}

const StationComponent: React.FC<StationProps> = ({ station, isLast, now }) => {
  const statusColor = STATUS_COLORS[station.status];
  const statusLabel = STATUS_LABELS[station.status];
  const queueLength = station.queue.length;
  const hasVehicle = station.currentVehicle !== null;

  const getProgress = () => {
    if (station.status !== 'occupied' || !station.currentVehicle) return 0;
    const elapsed = now - (station.currentVehicle.stationEnterTime ?? now);
    return Math.min((elapsed / station.serviceTime) * 100, 100);
  };

  const progress = getProgress();

  return (
    <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl border-2 border-gray-200 min-w-[200px] max-w-[280px] flex-1 transition-all duration-300">
      <div className="relative w-full mb-3">
        <div
          className={`h-24 w-full rounded-lg transition-all duration-500 flex items-center justify-center ${statusColor} border-2 border-gray-300 shadow-md`}
          style={{ boxShadow: station.status === 'occupied' ? '0 0 20px rgba(239, 68, 68, 0.5)' : station.status === 'blocked' ? '0 0 20px rgba(234, 179, 8, 0.5)' : 'none' }}
        >
          {hasVehicle && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs font-mono whitespace-nowrap">
              {station.currentVehicle?.id.slice(-6)}
            </div>
          )}

          <div className="text-center">
            <div className="text-2xl font-bold text-white drop-shadow-lg">{station.name}</div>
            <div className={`text-sm font-medium text-white drop-shadow ${station.status === 'blocked' ? 'animate-pulse' : ''}`}>
              {statusLabel}
            </div>
          </div>

          {station.status === 'occupied' && (
            <div className="absolute bottom-2 left-4 right-4 h-2 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-300 ease-linear"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>

        {queueLength > 0 && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-bounce">
            +{queueLength} esperando
          </div>
        )}
      </div>

      <div className="w-full space-y-1 text-xs text-gray-600 font-mono">
        <div className="flex justify-between">
          <span>Procesados:</span>
          <span className="font-bold text-blue-600">{station.vehiclesProcessed}</span>
        </div>
        <div className="flex justify-between">
          <span>Tiempo servicio:</span>
          <span className="font-bold">{(station.serviceTime / 1000).toFixed(1)}s</span>
        </div>
      </div>

      {!isLast && (
        <div className="w-1 h-8 bg-gray-300 mt-2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-ping" />
        </div>
      )}
    </div>
  );
};

export default StationComponent;