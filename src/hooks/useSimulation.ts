import { useState, useRef, useCallback, useEffect } from 'react';
import type {
  Vehicle,
  Station,
  SimulationMetrics,
  SimulationConfig,
  StationId,
  StationStatus,
} from '../types/simulation';
import { STATIONS_CONFIG, DEFAULT_CONFIG, STATION_ORDER } from '../types/simulation';

const generateId = () => Math.random().toString(36).slice(2, 11);

const randomInterval = (mean: number): number => -mean * Math.log(1 - Math.random());

export const createInitialStations = (config: SimulationConfig): Record<StationId, Station> => {
  const stations = {} as Record<StationId, Station>;
  STATION_ORDER.forEach((id) => {
    stations[id] = {
      id,
      name: STATIONS_CONFIG[id].name,
      status: 'free',
      currentVehicle: null,
      queue: [],
      serviceTime: config.serviceTimes[id],
      vehiclesProcessed: 0,
      totalOccupiedTime: 0,
      totalBlockedTime: 0,
      lastStatusChange: 0,
    };
  });
  return stations;
};

export const createInitialMetrics = (): SimulationMetrics => ({
  totalVehiclesArrived: 0,
  vehiclesCompleted: 0,
  totalRevenue: 0,
  totalInvoices: 0,
  averageServiceTime: 0,
  stationUtilization: { arrival: 0, vacuum: 0, wash: 0, dry: 0 },
  stationOperations: { arrival: 0, vacuum: 0, wash: 0, dry: 0 },
  bottleneckPercentage: 0,
  bottleneckStation: null,
  stationBlockedTime: { arrival: 0, vacuum: 0, wash: 0, dry: 0 },
});

export const createVehicle = (now: number): Vehicle => ({
  id: generateId(),
  arrivalTime: now,
  currentStation: null,
  stationEnterTime: null,
  serviceStartTime: null,
  completed: false,
  completedTime: null,
  totalServiceTime: null,
});

export const changeStatus = (
  stations: Record<StationId, Station>,
  stationId: StationId,
  status: StationStatus,
  now: number
): Record<StationId, Station> => {
  const s = stations[stationId];
  const elapsed = Math.max(now - s.lastStatusChange, 0);
  const totalOccupiedTime = s.totalOccupiedTime + (s.status === 'occupied' ? elapsed : 0);
  const totalBlockedTime = s.totalBlockedTime + (s.status === 'blocked' ? elapsed : 0);
  return {
    ...stations,
    [stationId]: {
      ...s,
      status,
      totalOccupiedTime,
      totalBlockedTime,
      lastStatusChange: now,
    },
  };
};

export const processStation = (
  stationId: StationId,
  stations: Record<StationId, Station>,
  completed: Vehicle[],
  now: number
): { stations: Record<StationId, Station>; completed: Vehicle[] } => {
  let next = stations;
  const s = next[stationId];
  const idx = STATION_ORDER.indexOf(stationId);
  const nextStationId = idx < STATION_ORDER.length - 1 ? STATION_ORDER[idx + 1] : null;

  if (s.status === 'occupied' && s.currentVehicle) {
    const vehicle = { ...s.currentVehicle };
    const elapsed = now - (vehicle.stationEnterTime ?? now);

    if (elapsed < s.serviceTime) {
      return { stations: next, completed };
    }

    const canLeave = nextStationId === null || next[nextStationId].status === 'free';

    if (!canLeave) {
      next = changeStatus(next, stationId, 'blocked', now);
      return { stations: next, completed };
    }

    next = changeStatus(next, stationId, 'free', now);
    next = {
      ...next,
      [stationId]: {
        ...next[stationId],
        currentVehicle: null,
        vehiclesProcessed: next[stationId].vehiclesProcessed + 1,
      },
    };

    if (nextStationId === null) {
      vehicle.completed = true;
      vehicle.completedTime = now;
      vehicle.totalServiceTime = now - (vehicle.serviceStartTime ?? vehicle.arrivalTime);
      completed = [...completed, vehicle];
    } else {
      vehicle.currentStation = nextStationId;
      vehicle.stationEnterTime = now;
      next = {
        ...next,
        [nextStationId]: {
          ...next[nextStationId],
          currentVehicle: vehicle,
          status: 'occupied',
          lastStatusChange: now,
        },
      };
    }
    return { stations: next, completed };
  }

  if (s.status === 'free') {
    if (stationId === 'arrival' && s.queue.length > 0) {
      const [head, ...rest] = s.queue;
      const vehicle = { ...head };
      vehicle.currentStation = 'arrival';
      vehicle.stationEnterTime = now;
      if (vehicle.serviceStartTime == null) vehicle.serviceStartTime = now;

      next = changeStatus(next, 'arrival', 'occupied', now);
      next = {
        ...next,
        arrival: {
          ...next.arrival,
          currentVehicle: vehicle,
          queue: rest,
        },
      };
    }
    return { stations: next, completed };
  }

  if (s.status === 'blocked') {
    if (nextStationId && next[nextStationId].status === 'free' && s.currentVehicle) {
      const vehicle = { ...s.currentVehicle };

      next = changeStatus(next, stationId, 'free', now);
      next = {
        ...next,
        [stationId]: {
          ...next[stationId],
          currentVehicle: null,
          vehiclesProcessed: next[stationId].vehiclesProcessed + 1,
        },
      };

      vehicle.currentStation = nextStationId;
      vehicle.stationEnterTime = now;
      next = {
        ...next,
        [nextStationId]: {
          ...next[nextStationId],
          currentVehicle: vehicle,
          status: 'occupied',
          lastStatusChange: now,
        },
      };
    }
    return { stations: next, completed };
  }

  return { stations: next, completed };
};

export const computeMetrics = (
  stations: Record<StationId, Station>,
  completed: Vehicle[],
  now: number,
  totalArrived: number,
  vehiclePrice: number
): SimulationMetrics => {
  const stationUtilization = {} as Record<StationId, number>;
  const stationOperations = {} as Record<StationId, number>;
  const stationBlockedTime = {} as Record<StationId, number>;

  let totalOccupied = 0;
  let totalBlocked = 0;
  let maxBlocked = -1;
  let bottleneckStation: StationId | null = null;

  for (const id of STATION_ORDER) {
    const s = stations[id];
    const elapsed = Math.max(now - s.lastStatusChange, 0);
    const occupied = s.totalOccupiedTime + (s.status === 'occupied' ? elapsed : 0);
    const blocked = s.totalBlockedTime + (s.status === 'blocked' ? elapsed : 0);

    totalOccupied += occupied;
    totalBlocked += blocked;
    stationUtilization[id] = now > 0 ? Math.min((occupied / now) * 100, 100) : 0;
    stationOperations[id] = s.vehiclesProcessed;
    stationBlockedTime[id] = blocked;

    if (blocked > maxBlocked) {
      maxBlocked = blocked;
      bottleneckStation = id;
    }
  }

  const totalServiceTime = completed.reduce((sum, v) => sum + (v.totalServiceTime ?? 0), 0);
  const engagedTime = totalOccupied + totalBlocked;

  return {
    totalVehiclesArrived: totalArrived,
    vehiclesCompleted: completed.length,
    totalRevenue: completed.length * vehiclePrice,
    totalInvoices: completed.length,
    averageServiceTime: completed.length > 0 ? totalServiceTime / completed.length : 0,
    stationUtilization,
    stationOperations,
    bottleneckPercentage: engagedTime > 0 ? (totalBlocked / engagedTime) * 100 : 0,
    bottleneckStation: maxBlocked > 0 ? bottleneckStation : null,
    stationBlockedTime,
  };
};

export const useSimulation = (initialConfig: Partial<SimulationConfig> = {}) => {
  const config = { ...DEFAULT_CONFIG, ...initialConfig };
  const [isRunning, setIsRunning] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(config.simulationSpeed);
  const [arrivalRate, setArrivalRate] = useState(config.arrivalRate);
  const [stations, setStations] = useState<Record<StationId, Station>>(() => createInitialStations(config));
  const [metrics, setMetrics] = useState<SimulationMetrics>(createInitialMetrics);
  const [completedVehicles, setCompletedVehicles] = useState<Vehicle[]>([]);

  const stationsRef = useRef(stations);
  const completedRef = useRef(completedVehicles);
  const metricsRef = useRef(metrics);

  const runningRef = useRef(false);
  const speedRef = useRef(simulationSpeed);
  const arrivalRateRef = useRef(arrivalRate);
  const priceRef = useRef(config.vehiclePrice);
  const rafRef = useRef<number | null>(null);

  const simTimeRef = useRef<number>(0);
  const lastRealTimeRef = useRef<number>(Date.now());
  const nextArrivalRef = useRef<number>(0);

  speedRef.current = simulationSpeed;
  arrivalRateRef.current = arrivalRate;
  priceRef.current = config.vehiclePrice;

  const tick = useCallback(() => {
    const realNow = Date.now();
    const delta = Math.max(realNow - lastRealTimeRef.current, 0) * speedRef.current;
    lastRealTimeRef.current = realNow;
    simTimeRef.current += delta;
    const now = simTimeRef.current;

    let nextStations = { ...stationsRef.current };
    let nextCompleted = completedRef.current;
    let arrivals = metricsRef.current.totalVehiclesArrived;

    if (now >= nextArrivalRef.current) {
      const vehicle = createVehicle(now);
      nextStations = {
        ...nextStations,
        arrival: {
          ...nextStations.arrival,
          queue: [...nextStations.arrival.queue, vehicle],
        },
      };
      arrivals += 1;
      nextArrivalRef.current = now + randomInterval(arrivalRateRef.current);
    }

    for (const id of STATION_ORDER) {
      const result = processStation(id, nextStations, nextCompleted, now);
      nextStations = result.stations;
      nextCompleted = result.completed;
    }

    const nextMetrics = computeMetrics(
      nextStations,
      nextCompleted,
      now,
      arrivals,
      priceRef.current
    );

    stationsRef.current = nextStations;
    completedRef.current = nextCompleted;
    metricsRef.current = nextMetrics;

    setStations(nextStations);
    setCompletedVehicles(nextCompleted);
    setMetrics(nextMetrics);

    if (runningRef.current) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    runningRef.current = true;
    lastRealTimeRef.current = Date.now();
    nextArrivalRef.current = simTimeRef.current + randomInterval(arrivalRateRef.current);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      runningRef.current = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isRunning, tick]);

  const isFreshSimulation = useCallback(() => {
    const anyBusy = STATION_ORDER.some((id) => {
      const s = stationsRef.current[id];
      return s.status !== 'free' || s.queue.length > 0;
    });
    return !anyBusy && completedRef.current.length === 0;
  }, []);

  const start = useCallback(() => {
    if (isFreshSimulation()) {
      simTimeRef.current = 0;
    }
    setIsRunning(true);
  }, [isFreshSimulation]);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    stationsRef.current = createInitialStations(config);
    metricsRef.current = createInitialMetrics();
    completedRef.current = [];
    simTimeRef.current = 0;
    lastRealTimeRef.current = Date.now();
    nextArrivalRef.current = 0;
    setStations(stationsRef.current);
    setMetrics(metricsRef.current);
    setCompletedVehicles([]);
  }, [config]);

  const changeSpeed = useCallback((newSpeed: number) => {
    setSimulationSpeed(Math.max(0.1, Math.min(5, newSpeed)));
  }, []);

  const changeArrivalRate = useCallback((newRate: number) => {
    setArrivalRate(Math.max(200, Math.min(20000, newRate)));
  }, []);

  const waitingQueue = stations.arrival.queue;

  return {
    isRunning,
    simulationSpeed,
    arrivalRate,
    stations,
    metrics,
    waitingQueue,
    completedVehicles,
    simulationClock: simTimeRef.current,
    start,
    stop,
    reset,
    changeSpeed,
    changeArrivalRate,
    config,
  };
};