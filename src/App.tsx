import React from 'react';
import { useSimulation } from './hooks/useSimulation';
import ControlPanel from './components/ControlPanel';
import SimulationView from './components/SimulationView';
import Dashboard from './components/Dashboard';
import type { Station } from './types/simulation';

const App: React.FC = () => {
  const {
    isRunning,
    simulationSpeed,
    arrivalRate,
    stations,
    metrics,
    waitingQueue,
    simulationClock,
    start,
    stop,
    reset,
    changeSpeed,
    changeArrivalRate,
  } = useSimulation();

  const stationData = stations as Record<string, Station>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-800">Simulación de Autolavado</h1>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-mono">
                FIFO Simulation
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ControlPanel
              isRunning={isRunning}
              simulationSpeed={simulationSpeed}
              arrivalRate={arrivalRate}
              onStart={start}
              onStop={stop}
              onReset={reset}
              onSpeedChange={changeSpeed}
              onArrivalRateChange={changeArrivalRate}
            />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <SimulationView
              stations={stationData}
              waitingQueue={waitingQueue}
              simulationClock={simulationClock}
            />
          </div>
        </div>

        <div className="mt-6">
          <Dashboard
            metrics={metrics}
            stations={stationData}
          />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            Simulación de Autolavado con Colas FIFO • Desarrollado con React, TypeScript y Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;