import React from 'react';
import StationComponent from './Station';
import type { Station as StationType } from '../types/simulation';
import { STATION_ORDER } from '../types/simulation';

interface SimulationViewProps {
  stations: Record<string, StationType>;
  waitingQueue: Array<{ id: string }>;
  simulationClock: number;
}

const SimulationView: React.FC<SimulationViewProps> = ({ stations, waitingQueue, simulationClock }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
        Línea de Autolavado
      </h2>

      <div className="relative">
        <div className="flex items-start gap-4 overflow-x-auto pb-4 px-2" role="list" aria-label="Estaciones del autolavado">
          {STATION_ORDER.map((stationId, index) => (
            <StationComponent
              key={stationId}
              station={stations[stationId]}
              isLast={index === STATION_ORDER.length - 1}
              now={simulationClock}
            />
          ))}
        </div>

        {waitingQueue.length > 0 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-semibold">Vehículos en cola de llegada: {waitingQueue.length}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {waitingQueue.slice(0, 10).map((vehicle) => (
                <span
                  key={vehicle.id}
                  className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-mono rounded border border-yellow-300"
                >
                  {vehicle.id.slice(-6)}
                </span>
              ))}
              {waitingQueue.length > 10 && (
                <span className="px-2 py-1 bg-yellow-200 text-yellow-700 text-xs font-mono rounded">
                  +{waitingQueue.length - 10} más
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Leyenda de Estados
        </h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-gray-600">Libre</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-gray-600">Ocupado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500"></div>
            <span className="text-gray-600">Bloqueado</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationView;