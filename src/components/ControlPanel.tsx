import React from 'react';

interface ControlPanelProps {
  isRunning: boolean;
  simulationSpeed: number;
  arrivalRate: number;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onArrivalRateChange: (rate: number) => void;
}

const formatArrivalRate = (rate: number): string => {
  if (rate >= 1000) return `${(rate / 1000).toFixed(1)}s`;
  return `${rate}ms`;
};

const ControlPanel: React.FC<ControlPanelProps> = ({
  isRunning,
  simulationSpeed,
  arrivalRate,
  onStart,
  onStop,
  onReset,
  onSpeedChange,
  onArrivalRateChange,
}) => {
  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSpeedChange(parseFloat(e.target.value));
  };

  const handleArrivalRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onArrivalRateChange(parseFloat(e.target.value));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      onSpeedChange(Math.min(5, simulationSpeed + 0.1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onSpeedChange(Math.max(0.1, simulationSpeed - 0.1));
    } else if (e.key === ' ') {
      e.preventDefault();
      if (isRunning) onStop();
      else onStart();
    } else if (e.key === 'r' || e.key === 'R') {
      onReset();
    }
  };

  return (
    <div
      className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Panel de control de simulación"
    >
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Panel de Control
      </h2>

      <div className="space-y-4">
        <div className="flex gap-3">
          <button
            onClick={isRunning ? onStop : onStart}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isRunning
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
            }`}
            aria-label={isRunning ? 'Detener simulación' : 'Iniciar simulación'}
          >
            <span className="flex items-center justify-center gap-2">
              {isRunning ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.75 15a.75.75 0 01-1.59-.86 6.5 6.5 0 119.68 0 .75.75 0 11-.75 1.49 5 5 0 10-7.46 0 .75.75 0 01-.85 1.49z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              )}
              <span>{isRunning ? 'Detener' : 'Iniciar'}</span>
            </span>
          </button>

          <button
            onClick={onReset}
            className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            aria-label="Reiniciar simulación"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Velocidad de simulación: <span className="font-mono text-blue-600">{simulationSpeed.toFixed(1)}x</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={simulationSpeed}
              onChange={handleSpeedChange}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Velocidad de simulación"
            />
            <div className="flex gap-1">
              <button
                onClick={() => onSpeedChange(Math.max(0.1, simulationSpeed - 0.5))}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 transition-colors"
                aria-label="Disminuir velocidad"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <button
                onClick={() => onSpeedChange(Math.min(5, simulationSpeed + 0.5))}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 transition-colors"
                aria-label="Aumentar velocidad"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Controles: <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-700 font-mono">Espacio</kbd> Iniciar/Detener |
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-700 font-mono">R</kbd> Reiniciar |
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-700 font-mono">↑/↓</kbd> Velocidad
          </p>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tasa de llegada de vehículos: <span className="font-mono text-blue-600">1 / {formatArrivalRate(arrivalRate)}</span>
          </label>
          <input
            type="range"
            min="300"
            max="10000"
            step="100"
            value={arrivalRate}
            onChange={handleArrivalRateChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Tasa de llegada de vehículos"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Rápido (0.3s)</span>
            <span>Lento (10s)</span>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
            <span className="text-sm font-medium text-gray-700">
              {isRunning ? 'Simulación en ejecución' : 'Simulación detenida'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;