import React from 'react';
import type { SimulationMetrics, StationId, Station as StationType } from '../types/simulation';
import { STATIONS_CONFIG, STATION_ORDER } from '../types/simulation';

interface DashboardProps {
  metrics: SimulationMetrics;
  stations: Record<StationId, StationType>;
}

const formatTime = (ms: number): string => {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${((ms % 60000) / 1000).toFixed(0)}s`;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(amount);
};

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}> = ({ title, value, icon, color, trend }) => (
  <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        {trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

const ProgressBar: React.FC<{
  label: string;
  value: number;
  max: number;
  color: string;
  unit: string;
}> = ({ label, value, max, color, unit }) => {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-bold text-gray-800">{value.toFixed(1)}{unit}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ metrics, stations }) => {
  const totalTime = Math.max(
    Object.values(stations).reduce((sum, s) => sum + s.totalOccupiedTime + s.totalBlockedTime, 0),
    1
  );

  const bottleneckStation = metrics.bottleneckStation;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Dashboard de Métricas
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Vehículos Llegados"
          value={metrics.totalVehiclesArrived}
          color="bg-blue-100 text-blue-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />
        <MetricCard
          title="Vehículos Completados"
          value={metrics.vehiclesCompleted}
          color="bg-green-100 text-green-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          title="Ingresos Totales"
          value={formatCurrency(metrics.totalRevenue)}
          color="bg-yellow-100 text-yellow-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          title="Tiempo Promedio"
          value={formatTime(metrics.averageServiceTime)}
          color="bg-purple-100 text-purple-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Utilización por Estación (%)
          </h3>
          <div className="space-y-3">
            {STATION_ORDER.map((stationId) => {
              const station = stations[stationId];
              const utilization = totalTime > 0
                ? ((station.totalOccupiedTime + station.totalBlockedTime) / totalTime) * 100
                : 0;
              return (
                <ProgressBar
                  key={stationId}
                  label={STATIONS_CONFIG[stationId].name}
                  value={utilization}
                  max={100}
                  color="bg-blue-500"
                  unit="%"
                />
              );
            })}
          </div>
        </div>

        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Operaciones por Estación
          </h3>
          <div className="space-y-3">
            {STATION_ORDER.map((stationId) => {
              const ops = metrics.stationOperations[stationId];
              return (
                <div key={stationId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium text-gray-700">{STATIONS_CONFIG[stationId].name}</span>
                  </div>
                  <span className="text-lg font-bold text-gray-800">{ops}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Análisis de Cuello de Botella
          </h3>
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Cuello de botella general del sistema</span>
                <span className="text-2xl font-bold text-red-600">{metrics.bottleneckPercentage.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.bottleneckPercentage}%` }}
                ></div>
              </div>
            </div>

            {bottleneckStation && (
              <div className="bg-white p-4 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-semibold">Estación con más cuellos de botella</span>
                </div>
                <p className="text-lg font-bold text-gray-800">{STATIONS_CONFIG[bottleneckStation].name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Tiempo bloqueado: {formatTime(metrics.stationBlockedTime[bottleneckStation])}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {STATION_ORDER.map((stationId) => (
                <div
                  key={stationId}
                  className={`p-3 rounded-lg text-center ${
                    stationId === bottleneckStation ? 'bg-red-50 border-2 border-red-200' : 'bg-white border border-gray-200'
                  }`}
                >
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{STATIONS_CONFIG[stationId].name}</p>
                  <p className="text-xl font-bold text-gray-800 mt-1">
                    {formatTime(metrics.stationBlockedTime[stationId])}
                  </p>
                  <p className="text-xs text-gray-500">bloqueado</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Tiempos de Servicio por Estación
          </h3>
          <div className="space-y-3">
            {STATION_ORDER.map((stationId) => {
              const station = stations[stationId];
              const avgTime = station.vehiclesProcessed > 0
                ? (station.totalOccupiedTime / station.vehiclesProcessed)
                : 0;
              return (
                <div key={stationId} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm font-medium text-gray-700">{STATIONS_CONFIG[stationId].name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{formatTime(avgTime)}</p>
                    <p className="text-xs text-gray-500">promedio por vehículo</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
        <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Resumen de Facturación
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">{metrics.totalInvoices}</p>
            <p className="text-xs text-blue-700">Facturas emitidas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalRevenue)}</p>
            <p className="text-xs text-green-700">Ingresos totales</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">{metrics.vehiclesCompleted}</p>
            <p className="text-xs text-purple-700">Servicios completados</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-600">
              {metrics.vehiclesCompleted > 0 ? formatCurrency(metrics.totalRevenue / metrics.vehiclesCompleted) : '€0.00'}
            </p>
            <p className="text-xs text-gray-700">Promedio por servicio</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;