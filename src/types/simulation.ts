export type StationId = 'arrival' | 'vacuum' | 'wash' | 'dry';

export type StationStatus = 'free' | 'occupied' | 'blocked';

export interface Vehicle {
  id: string;
  arrivalTime: number;
  currentStation: StationId | null;
  stationEnterTime: number | null;
  serviceStartTime: number | null;
  completed: boolean;
  completedTime: number | null;
  totalServiceTime: number | null;
}

export interface Station {
  id: StationId;
  name: string;
  status: StationStatus;
  currentVehicle: Vehicle | null;
  queue: Vehicle[];
  serviceTime: number;
  vehiclesProcessed: number;
  totalOccupiedTime: number;
  totalBlockedTime: number;
  lastStatusChange: number;
}

export interface SimulationMetrics {
  totalVehiclesArrived: number;
  vehiclesCompleted: number;
  totalRevenue: number;
  totalInvoices: number;
  averageServiceTime: number;
  stationUtilization: Record<StationId, number>;
  stationOperations: Record<StationId, number>;
  bottleneckPercentage: number;
  bottleneckStation: StationId | null;
  stationBlockedTime: Record<StationId, number>;
}

export interface SimulationConfig {
  arrivalRate: number;
  simulationSpeed: number;
  serviceTimes: Record<StationId, number>;
  vehiclePrice: number;
}

export const STATIONS_CONFIG: Record<StationId, { name: string; serviceTime: number }> = {
  arrival: { name: 'Llegada', serviceTime: 2000 },
  vacuum: { name: 'Aspirado', serviceTime: 5000 },
  wash: { name: 'Lavado', serviceTime: 8000 },
  dry: { name: 'Secado', serviceTime: 4000 },
};

export const STATION_ORDER: StationId[] = ['arrival', 'vacuum', 'wash', 'dry'];

export const DEFAULT_CONFIG: SimulationConfig = {
  arrivalRate: 3000,
  simulationSpeed: 1,
  serviceTimes: {
    arrival: 2000,
    vacuum: 5000,
    wash: 8000,
    dry: 4000,
  },
  vehiclePrice: 25,
};

export const STATUS_COLORS: Record<StationStatus, string> = {
  free: 'bg-green-500',
  occupied: 'bg-red-500',
  blocked: 'bg-yellow-500',
};

export const STATUS_LABELS: Record<StationStatus, string> = {
  free: 'Libre',
  occupied: 'Ocupado',
  blocked: 'Bloqueado',
};