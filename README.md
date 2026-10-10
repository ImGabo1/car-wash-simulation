# Simulación de Autolavado (FIFO)

Simulación interactiva de una línea de autolavado con **colas FIFO**, construida con **React 19**, **TypeScript** y **Tailwind CSS 4**.

La aplicación modela una línea de 4 estaciones en cascada (Llegada → Aspirado → Lavado → Secado) por la que circulan vehículos generados con llegadas aleatorias de tipo **Poisson**. Cada estación puede estar **libre**, **ocupada** o **bloqueada**, y el dashboard muestra métricas en tiempo real: utilización, tiempo de servicio, ingresos y análisis de cuellos de botella.

![Estados de estación](https://img.shields.io/badge/estado-verde%20%F0%9F%9F%A2%20%E2%80%94%20rojo%20%F0%9F%94%B4%20%E2%80%94%20amarillo%20%F0%9F%9F%A1-informational)

---

## Tabla de contenidos

1. [Características](#características)
2. [Tecnologías](#tecnologías)
3. [Requisitos](#requisitos)
4. [Instalación y comandos](#instalación-y-comandos)
5. [Despliegue en Vercel](#despliegue-en-vercel)
6. [Estructura del proyecto](#estructura-del-proyecto)
7. [Modelo de simulación](#modelo-de-simulación)
8. [Explicación de cada archivo](#explicación-de-cada-archivo)
9. [Métricas y fórmulas](#métricas-y-fórmulas)
10. [Controles](#controles)
11. [Notas técnicas y decisiones de diseño](#notas-técnicas-y-decisiones-de-diseño)
12. [Posibles mejoras futuras](#posibles-mejoras-futuras)

---

## Características

- **Simulación continua** con reloj virtual propio (desacoplado del reloj real).
- **Llegadas aleatorias Poisson**: el tiempo entre llegadas sigue una distribución exponencial.
- **Cascada FIFO**: un vehículo no puede salir de una estación si la siguiente está ocupada (encolamiento estricto).
- **3 estados por estación** con código de colores: `free` (verde), `occupied` (rojo), `blocked` (amarillo, con pulso).
- **Panel de control**: iniciar/detener, reiniciar, velocidad 0.1x–5x, tasa de llegada 0.3s–10s.
- **Dashboard de métricas en vivo**: 4 tarjetas principales + utilización por estación + operaciones + cuello de botella + tiempos de servicio + resumen de facturación.
- **Atajos de teclado**: `Espacio`, `R`, `↑/↓`.
- **Lógica pura exportada** (`createVehicle`, `processStation`, `computeMetrics`, …) lista para tests.

---

## Tecnologías

| Tecnología | Uso |
|------------|-----|
| **Vite 8** | Bundler y dev server |
| **React 19** | Interfaz de usuario (componentes funcionales + hooks) |
| **TypeScript 6** | Tipado estricto (`strict` mode vía `tsconfig.app.json`) |
| **Tailwind CSS 4** | Estilos utilitarios (via `@tailwindcss/postcss`) |
| **oxlint** | Lint del proyecto |

---

## Requisitos

- **Node.js ≥ 20** (recomendado Node 22 LTS+)
- **npm** (incluido con Node)

---

## Instalación y comandos

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar el servidor de desarrollo (http://localhost:5173)
npm run dev
```

> Si el puerto 5173 está ocupado, usa: `npm run dev -- --port 5175`

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Compila TS (`tsc -b`) y genera el bundle de producción en `dist/` |
| `npm run preview` | Sirve en local el bundle de producción |
| `npm run lint` | Ejecuta **oxlint** sobre el código |

---

## Despliegue en Vercel

> **Importante**: este proyecto es **puramente estático** (sin backend), por lo que se despliega sin configuración especial.

**Opción A — Desde el panel de Vercel:**
1. Importa el repositorio desde *Dashboard → Add New → Project*.
2. Framework preseteado: **Vite**.
3. Build command: `npm run build` • Output directory: `dist`.
4. Deploy.

**Opción B — Con Vercel CLI:**
```bash
npm i -g vercel
vercel
# y luego, para producción:
vercel --prod
```

> El servidor dev local ya se ha probado en `http://localhost:5175` (el puerto 5173 estaba ocupado por otro proyecto), indicativo de que el proyecto arranca correctamente.

---

## Estructura del proyecto

```
car-wash-simulation/
├── index.html                    # Página HTML raíz (punto de entrada de Vite)
├── package.json                  # Scripts y dependencias
├── vite.config.ts                # Configuración de Vite (plugin de React)
├── tailwind.config.js            # Config de Tailwind (content)
├── postcss.config.js             # Plugins de PostCSS (tailwind v4 + autoprefixer)
├── tsconfig.json                 # Proyecto TS de referencia (app + node)
├── tsconfig.app.json             # TS estricto para la app (src/)
├── tsconfig.node.json            # TS para vite.config.ts
├── public/
│   └── favicon.svg               # Favicon
└── src/
    ├── main.tsx                  # Monta <App/> con createRoot + StrictMode
    ├── App.tsx                   # Layout + cableado del hook useSimulation
    ├── index.css                 # Import de Tailwind + estilos globales del slider
    ├── types/
    │   └── simulation.ts         # Tipos del dominio + constantes configurables
    ├── hooks/
    │   └── useSimulation.ts      # NÚCLEO: reloj simulado, llegadas Poisson,
    │                             #   máquina de estados FIFO y métricas
    └── components/
        ├── ControlPanel.tsx      # Botones, sliders, atajos y estado de ejecución
        ├── SimulationView.tsx    # Línea de estaciones + cola de espera + leyenda
        ├── Station.tsx           # Render de una estación individual (progreso, cola)
        └── Dashboard.tsx         # Métricas, cuello de botella y facturación
```

---

## Modelo de simulación

### Flujo del vehículo

```
                 +----------+     +-----------+     +--------+     +--------+
 VEHÍCULO llega →| ARRIVAL  | →  |  VACUUM   | →   |  WASH  | →  |  DRY   | →  FACTURA
 (Poisson)       | Llegada  |    | Aspirado  |     | Lavado |    | Secado |
                 +----------+     +-----------+     +--------+     +--------+
```

- Cada estación procesa un vehículo a la vez y tiene una **cola FIFO** propia (`station.queue`).
- Al completarse el servicio en la estación `dry`, el vehículo **sale de la línea, se emite una factura y se suman los ingresos** (precio: 25 €).

### Estados de una estación

| Estado | Color | Significado |
|--------|-------|-------------|
| `free` | 🟢 Verde | Sin vehículo, acepta el siguiente de su cola |
| `occupied` | 🔴 Rojo | Servicio en curso (barra de progreso + glow rojo) |
| `blocked` | 🟡 Amarillo | Terminó su trabajo pero la siguiente estación está ocupada (**cuello de botella**) |

### La cola de espera global

Hay además una cola **global** (`waitingQueue`): vehículos que ya llegaron pero cuya estación `arrival` está ocupada o bloqueada. Se muestran como chips amarillos bajo la línea.

### Reloj simulado

El sistema no usa `Date.now()` directamente para medir servicios. Mantiene un **reloj virtual** que avanza según la velocidad elegida:

```ts
simTimeRef.current += (realNow - lastRealTimeRef.current) * speedRef.current;
```

Esto hace que la velocidad (0.1x–5x) acelere/reduzca **todo**: llegadas, servicios y métricas.

### Llegadas Poisson

```ts
randomInterval = -mean * Math.log(1 - Math.random());
```

`randomInterval` devuelve el tiempo (en ms) hasta la siguiente llegada, siguiendo una distribución **exponencial** con media `mean` (por defecto `arrivalRate = 3000ms`). Es el método clásico de generación de llegadas Poisson.

---

## Explicación de cada archivo

### `index.html`

Fichero HTML raíz que Vite usa como punto de entrada. Define:
- `lang="es"` y título `Simulación de Autolavado - FIFO`.
- Meta description para buscadores.
- `<link rel="icon" href="/favicon.svg">`.
- `<div id="root">` donde React montará la aplicación y `<script type="module" src="/src/main.tsx">` que carga la app.

### `package.json`

Define **scripts**:
- `dev`: `vite` — arranca el dev server.
- `build`: `tsc -b && vite build` — primero comprueba tipos, luego empaqueta.
- `lint`: `oxlint` — linter.
- `preview`: `vite preview` — sirve `dist/`.

Y dependencias: `react`, `react-dom` (runtime) y vite, typescript, tailwind, oxlint y autoprefixer (dev).

### `vite.config.ts`

Configuración mínima de Vite. Solo registra el plugin oficial de React:

```ts
export default defineConfig({ plugins: [react()] });
```

### `tailwind.config.js`

Declara los ficheros donde Tailwind debe buscar clases utilitarias (`content`): `./index.html` y `./src/**/*.{js,ts,jsx,tsx}`. El tema se deja por defecto (`extend: {}`).

### `postcss.config.js`

Configura PostCSS para **Tailwind CSS v4**: usa el plugin `@tailwindcss/postcss` (nuevo pipeline de v4, en lugar del clásico `tailwindcss`) más `autoprefixer`.

### `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json`

- `tsconfig.json`: proyecto **solución** que referencia `tsconfig.app.json` (código de `src/`) y `tsconfig.node.json` (para `vite.config.ts`).
- `tsconfig.app.json`: compilación de la app con opciones estrictas: `verbatimModuleSyntax` (obliga a importar tipos con `import type`), `noUnusedLocals`/`noUnusedParameters`, `erasableSyntaxOnly`, `noFallthroughCasesInSwitch`, `jsx: react-jsx`, `target: es2023`, `noEmit: true`.

### `public/favicon.svg`

Favicon en formato SVG referenciado desde `index.html`.

### `src/main.tsx`

Punto de entrada de React:

```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

Envuelve `<App/>` en `<StrictMode>`. **Nota**: la simulación está diseñada para ser inmune a la doble-invocación de render/effects que provoca StrictMode en desarrollo (se evitan efectos secundarios dentro de updaters de estado).

### `src/types/simulation.ts`

Define **todo el dominio** de la simulación.

**Tipos:**

| Tipo | Descripción |
|------|-------------|
| `StationId` | Unión de strings: `'arrival' \| 'vacuum' \| 'wash' \| 'dry'` |
| `StationStatus` | `'free' \| 'occupied' \| 'blocked'` |
| `Vehicle` | Un vehículo en línea. Campos: `id` (único), `arrivalTime`, `stationEnterTime` (ms en que entró a su estación actual, usado para el progreso) |
| `Station` | Una estación. Campos: `id`, `name`, `status`, `serviceTime` (ms por vehículo), `currentVehicle` (o `null`), `queue` (cola FIFO de vehículos), `vehiclesProcessed` (contador), `totalOccupiedTime` y `totalBlockedTime` (acumuladores en ms) |
| `SimulationMetrics` | Métricas globales: `totalVehiclesArrived`, `vehiclesCompleted`, `totalRevenue`, `totalInvoices`, `averageServiceTime`, `bottleneckPercentage`, `bottleneckStation`, `stationOperations` (op. por estación), `stationBlockedTime` (tiempo bloqueado por estación) |
| `SimulationConfig` | Config editable: `arrivalRate` (media ms entre llegadas) y `vehiclePrice` (precio por servicio) |

**Constantes:**

| Constante | Contenido |
|-----------|-----------|
| `STATIONS_CONFIG` | Nombre de cada estación y su `serviceTime`: Llegada **2000ms**, Aspirado **5000ms**, Lavado **8000ms**, Secado **4000ms** |
| `STATION_ORDER` | Orden de la línea: `['arrival', 'vacuum', 'wash', 'dry']` |
| `DEFAULT_CONFIG` | `{ arrivalRate: 3000, vehiclePrice: 25 }` |
| `STATUS_COLORS` | Mapa de clase CSS por estado: `free`→`bg-green-500`, `occupied`→`bg-red-500`, `blocked`→`bg-yellow-500` |
| `STATUS_LABELS` | Etiqueta legible por estado: Libre / Ocupado / Bloqueado |

### `src/hooks/useSimulation.ts`

El **núcleo de la simulación**. Exporta **funciones puras** (fáciles de testear) y el hook reactivo `useSimulation`.

#### Funciones puras exportadas

**`randomInterval(mean: number): number`**
Devuelve un intervalo aleatorio exponencial (llegadas Poisson): `-mean * Math.log(1 - Math.random())`.

**`createInitialStations(): Record<StationId, Station>`**
Crea las 4 estaciones con estado `free`, cola vacía, contadores y acumuladores a 0, usando `STATIONS_CONFIG` para `name` y `serviceTime`.

**`createInitialMetrics(): SimulationMetrics`**
Crea las métricas iniciales a cero (`totalVehiclesArrived: 0`, `vehiclesCompleted: 0`, etc.).

**`createVehicle(id: number): Vehicle`**
Crea un nuevo vehículo con `id: "V-{n}"`, `arrivalTime` y `stationEnterTime` a 0 (se fijan al entrar en la estación).

**`changeStatus(station: Station, status: StationStatus): Station`**
Cambia el estado de una estación y **acumula tiempo** en el acumulador correspondiente:
- Si pasa a `occupied` → `totalOccupiedTime += now - stationEnterTime` del vehículo.
- Si pasa a `blocked` → `totalBlockedTime += now - enterTime`.
- Devuelve una **copia nueva** (inmutabilidad).

**`processStation(station: Station, statusNow: number, canLeave: boolean, opts?): Station`**
La **máquina de estados** de cada estación. Recibe la estación, el instante de reloj actual y si la siguiente estación está libre (`canLeave`). Lógica:

1. Si está **ocupada** y ha pasado `serviceTime`:
   - Si **no puede salir** (`!canLeave`) → pasa a `blocked` (sigue bloqueado sin avanzar tiempo de servicio).
   - Si **puede salir**:
     - Incrementa `vehiclesProcessed` en 1 (**un único vehículo cada vez**).
     - Si `opts` provee un `vehicle` que debe pasar a la siguiente estación, lo retorna (para encadenar). Si no, queda `free`.
     - Si `opts.onComplete` existe y la línea no continúa (estación `dry`), lo invoca con `(vehicle, station)` para **facturar y registrar el ingreso**.
2. Si está **ocupada** y aún no termina → permanece.
3. Si está **bloqueada** y ahora puede salir → completa la salida (vehiculo avanzado o `free`) con contadores.
4. Si está **libre** y hay `vehicle` entrante → lo acepta (se vuelve `occupied`).

**`computeMetrics(stations, config): SimulationMetrics`**
Calcula las métricas globales a partir de las estaciones:
- `totalVehiclesArrived = arrival.vehiclesProcessed + arrival.queue.length`.
- `vehiclesCompleted = dry.vehiclesProcessed`.
- `totalRevenue = vehiclesCompleted * config.vehiclePrice`.
- `totalInvoices = vehiclesCompleted`.
- `averageServiceTime` = suma de `totalOccupiedTime` / total de vehículos procesados.
- `bottleneckPercentage`: % de tiempo bloqueado sobre el total ocupado+bloqueado (ver fórmulas).
- `bottleneckStation`: la estación con más `totalBlockedTime`.
- `stationOperations` y `stationBlockedTime` desglosados por estación.

#### El hook `useSimulation()`

Devuelve el estado y las acciones del panel de control:

```ts
{ isRunning, simulationSpeed, arrivalRate, stations, metrics, waitingQueue, simulationClock,
  start, stop, reset, changeSpeed, changeArrivalRate }
```

Internamente usa **refs** para datos mutables y no-reactivos (el reloj, el estado de simulacro) y **estado** solo para lo que se renderiza:

- `simTimeRef` / `lastRealTimeRef` / `speedRef` — reloj simulado y velocidad.
- `stationsRef` — estado real de las estaciones (se re-renderiza copiándolo a `useState`).
- `isRunning` — si la simulación está activa.
- `simulationClock` — reloj virtual mostrado en la UI.
- `nextArrivalAtRef` — instante simulado en que llegará el próximo vehículo.

**Efectos (principal `useEffect`):**
Cada frame (≈60fps) con `requestAnimationFrame` / `setInterval`:
1. Avanza el reloj simulado con `(realNow - lastReal) * speed`.
2. **Genera llegadas**: mientras `simTime >= nextArrivalAt` y la estación `arrival` tenga hueco, crea un vehículo con `createVehicle` y encola la siguiente llegada con `randomInterval(arrivalRate)`.
3. **Procesa las 4 estaciones en orden** (`processStation`), pasando el vehículo de la cola de una estación a la siguiente si esta tenía hueco.
4. Calcula métricas (`computeMetrics`) y actualiza el estado visible (copias) para el render.

**Acciones del hook:**
- `start()` / `stop()`: ponen/limpian `isRunning`.
- `reset()`: restaura estaciones y métricas iniciales (`createInitialStations`, `createInitialMetrics`), limpia la cola y reinicia el reloj a 0.
- `changeSpeed(0.1–5)` y `changeArrivalRate(300–10000)`: actualizan la configuración.

### `src/components/ControlPanel.tsx`

Panel de control. **Props** (todas de control del hook):

```ts
{ isRunning, simulationSpeed, arrivalRate,
  onStart, onStop, onReset, onSpeedChange, onArrivalRateChange }
```

- **Botón Iniciar/Detener** (verde/rojo según `isRunning`) + botón **Reiniciar**.
- **Slider de velocidad** (0.1x–5x) con botones +/− 0.5.
- **Slider de tasa de llegada** (300ms–10s); se muestra como `1 / 3.0s`.
- **Atajos de teclado** (`handleKeyDown`): `Espacio` inicia/detiene, `R` reinicia, `↑/↓` sube/baja velocidad.
- Estado visual: indicador verde pulsante "Simulación en ejecución".

Detalles en el código:
- `formatArrivalRate(rate)` — formatea la tasa a `3.0s` o `500ms`.
- Los sliders son `input[type=range]` con `onChange` que llaman a los callbacks del hook.

### `src/components/SimulationView.tsx`

Renderiza la línea de autolavado. **Props**:

```ts
{ stations: Record<string, Station>, waitingQueue: Array<{ id: string }>, simulationClock: number }
```

- Recorre `STATION_ORDER` y renderiza un `StationComponent` por cada estación, pasando `isLast` para saber si debe mostrarse la "conexión" hacia la siguiente.
- **Cola de espera**: si `waitingQueue.length > 0` muestra un bloque amarillo con los primeros 10 vehículos (`vehicle.id.slice(-6)`) y `+N más` si supera 10.
- **Leyenda de estados**: Verde=Libre, Rojo=Ocupado, Amarillo=Bloqueado.

### `src/components/Station.tsx`

Componente de **una estación**. **Props**:

```ts
{ station: Station, isLast: boolean, now: number }
```

- `statusColor` / `statusLabel` desde `STATUS_COLORS` / `STATUS_LABELS`.
- `getProgress()`: calcula el % de la barra de progreso según el reloj símulado:
  `min((now - stationEnterTime) / serviceTime * 100, 100)`.
- Muestra:
  - El id corto del vehículo actual (`id.slice(-6)`).
  - Barra de progreso blanca cuando está `occupied`.
  - **Glow rojo** (ocupado) / amarillo (bloqueado) vía `boxShadow`.
  - Badge `+N esperando` cuando `queue.length > 0` (con `animate-bounce`).
  - Pie con **Procesados** (`vehiclesProcessed`) y **Tiempo de servicio** (`serviceTime/1000` s).
- Si `!isLast`, dibuja una tubería vertical animada hacia la siguiente estación.

### `src/components/Dashboard.tsx`

Panel de métricas. **Props**:

```ts
{ metrics: SimulationMetrics, stations: Record<StationId, Station> }
```

Helpers internos:
- `formatTime(ms)` — formatea ms a `800ms`, `3.5s` o `1m 30s`.
- `formatCurrency(n)` — formato EUR español vía `Intl.NumberFormat('es-ES', …)`.
- `MetricCard` — tarjeta genérica (título, valor, icono, color, tendencia opcional).
- `ProgressBar` — barra de progreso con `label/value/max/color/unit`.

Contenido:
1. **4 tarjetas**: Vehículos llegados, Completados, Ingresos totales (EUR), Tiempo promedio.
2. **Utilización por estación (%)**: `(totalOccupiedTime + totalBlockedTime) / totalTime * 100`.
3. **Operaciones por estación**: de `metrics.stationOperations`.
4. **Análisis de cuello de botella**: % global + estación con más tiempo bloqueado (resaltada en rojo) + grid con los tiempos bloqueados de cada estación.
5. **Tiempos de servicio por estación** (promedio por vehículo).
6. **Resumen de facturación**: facturas emitidas, ingresos, servicios completados y promedio por servicio.

### `src/App.tsx`

Componente raíz. Llama a `useSimulation()`, convierte `stations` a `Record<string, Station>` y distribuye el estado a los tres componentes:
- `ControlPanel` (columna izquierda, `lg:col-span-1`).
- `SimulationView` (columna derecha, `lg:col-span-2`).
- `Dashboard` (fila completa debajo).

Incluye **header** (logo + título + badge `FIFO Simulation`), **main** con el grid y un **footer** de créditos.

### `src/index.css`

Importa Tailwind (`@import "tailwindcss";`) y contiene estilos globales personalizados: el **estilo del `input[type=range]`** (thumb/track del slider) y utilidades para los `kbd` del panel.

---

## Métricas y fórmulas

| Métrica | Fórmula |
|---------|---------|
| Vehículos llegados | `arrival.vehiclesProcessed + arrival.queue.length` |
| Vehículos completados | `dry.vehiclesProcessed` |
| Ingresos | `vehiclesCompleted × vehiclePrice` (25 € por defecto) |
| Facturas | `vehiclesCompleted` |
| Utilización de estación | `(totalOccupiedTime + totalBlockedTime) / totalTime × 100` |
| % cuello de botella | `totalBlockedTime / (totalOccupiedTime + totalBlockedTime) × 100` |
| Tiempo promedio | `Σ totalOccupiedTime / Σ vehiclesProcessed` |
| Estación cuello de botella | la de mayor `totalBlockedTime` |
| Progreso de servicio | `(now − stationEnterTime) / serviceTime × 100` |

---

## Controles

| Tecla / Control | Acción |
|-----------------|--------|
| Botón **Iniciar**/**Detener** | Arranca o detiene la simulación |
| `Espacio` | Iniciar / Detener |
| `R` | Reiniciar simulación |
| `↑` / `↓` | Subir / bajar velocidad (pasos de 0.1x) |
| Slider velocidad + botones `−`/`+` | Velocidad 0.1x–5x |
| Slider tasa de llegada | Media entre llegadas 0.3s–10s |

---

## Notas técnicas y decisiones de diseño

1. **Inmutabilidad**: todas las funciones puras devuelven copias nuevas de las estaciones (`{ ...station, queue: [...], ... }`). Esto facilita que React detecte cambios y evita mutación accidental.
2. **StrictMode safe**: no hay efectos secundarios dentro de los updaters de `setState`; la máquina de estados corre dentro de un `useEffect`/intervalo, no dentro de `setStations`.
3. **Reloj simulado**: permite que la velocidad afecte a *todo* el sistema de forma consistente, no solo a las llegadas.
4. **salida única**: `vehiclesProcessed` se incrementa exactamente cuando el vehículo abandona la estación (una sola vez por vehículo), evitando dobles conteos.
5. **Sin deadlock**: el procesado en cascada asegura que una estación bloqueada se desbloquea en cuanto la siguiente queda libre.
6. **Tipado estricto**: `verbatimModuleSyntax` obliga a usar `import type` para tipos, y `noUnusedLocals`/`noUnusedParameters` detectan código muerto.

---

## Posibles mejoras futuras

- Persistencia en `localStorage` de la configuración (velocidad, tasa de llegada, precio).
- Gráfica en tiempo real (Sparkline) de llegadas vs. completados.
- Estocástico por estación: tiempos de servicio con desviación/variabilidad.
- Múltiples carriles paralelos o capacidad de cola configurable.
- Tests automáticos de las funciones puras (`randomInterval`, `processStation`, `computeMetrics`) con Vitest.
- Exportar estadísticas a CSV/JSON.
- Precio/velocidad por tipo de vehículo (coche, SUV, camioneta).

---

*Simulación de Autolavado con Colas FIFO — Desarrollada con React, TypeScript y Tailwind CSS*