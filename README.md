<div align="center">

# ⚓ NeptuneFriend

**Real-time sailing conditions platform with multi-model weather ensemble forecasting**

[![CI](https://github.com/majorbatou/NeptuneFriend/actions/workflows/ci.yml/badge.svg)](https://github.com/majorbatou/NeptuneFriend/actions/workflows/ci.yml)
[![Docker](https://github.com/majorbatou/NeptuneFriend/actions/workflows/docker.yml/badge.svg)](https://github.com/majorbatou/NeptuneFriend/actions/workflows/docker.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-EKS-326CE5?logo=kubernetes&logoColor=white)

A full-stack DevOps CV project — from `npm create vite` to production Kubernetes with canary deployments, multi-model weather ensemble, Prometheus monitoring, KEDA autoscaling, Google OAuth and a comprehensive marine safety alert system.

</div>

---

## What it does

NeptuneFriend aggregates data from **6 weather models + marine API** to give sailors accurate, blended forecasts with features professional apps charge for:

- **Dual swell visualization** — primary + secondary swell rose with confused sea detection
- **Multi-model ensemble** — ECMWF, ICON, GFS, Open-Meteo, OpenWeather, Met Office blended by regional priority
- **37 global sailing zones** — UK/Ireland, US East/West, Caribbean, Australia, New Zealand
- **Real-time tidal data** — NOAA (US), NTSLF (UK/Ireland), WorldTides (global fallback) — all free
- **Marine conditions** — wind waves, ocean currents, sea surface temperature via Open-Meteo Marine API
- **Route planner** — click-to-add waypoints with distance/time estimates and GPX export
- **Configurable alerts** — wind/wave/storm/fog alerts with in-app notification bell
- **Safety alert system** — real-time warnings for confused seas, low pressure, gale/storm force winds and strong currents
- **Historical storm conditions** — recreated conditions from Fastnet 1979, Sydney-Hobart 1998, Middle Sea 2007
- **Google OAuth** — one-click sign-in alongside email/password authentication

---

## Tech Stack

### Application
| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite, TanStack Query, Zustand, Leaflet, CSS Modules |
| **Backend** | Node.js 20, Express, TypeScript, PostgreSQL, Redis, JWT, Passport.js, Zod |
| **Auth** | Email/password + Google OAuth 2.0 (passport-google-oauth20) |
| **Testing** | Vitest, Testing Library, k6 (load testing) |

### Infrastructure & DevOps
| Area | Technologies |
|------|-------------|
| **Cloud** | AWS EKS, VPC (Terraform) |
| **Containers** | Docker, GHCR, Trivy security scanning |
| **Kubernetes** | EKS, nginx proxy, KEDA, HPA |
| **CI/CD** | GitHub Actions (CI, CD staging, canary, production promotion) |
| **Config** | Ansible (server hardening, Docker, kubectl setup) |
| **Monitoring** | Prometheus, Grafana, kube-prometheus-stack |
| **Security** | RBAC, NetworkPolicies, PodSecurityAdmission, JWT, Google OAuth |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     AWS EKS Cluster                      │
│                                                           │
│  Web (React + nginx)        API (Express)                │
│  2 pods                     2-10 pods (HPA + KEDA)       │
│  nginx proxies /api/* ───→      ↓              ↓         │
│  nginx proxies /auth/* ──→  PostgreSQL       Redis       │
│                                  ↓                       │
│                        6 Weather Providers               │
│              ECMWF · ICON · GFS · Open-Meteo            │
│              OpenWeather · Met Office                    │
│              NOAA (US tides) · NTSLF (UK tides)         │
│              Open-Meteo Marine (currents + waves)        │
│                                                           │
│  Prometheus ←── /metrics    KEDA: scales on req/s > 50  │
└─────────────────────────────────────────────────────────┘
```

---

## Weather & Marine Data Architecture

```
Request → WeatherAggregator
    ├── ECMWFProvider          (priority 9, global)
    ├── MetOfficeProvider      (priority 9, UK/Ireland)
    ├── ICONProvider           (priority 8, Europe)
    ├── OpenMeteoProvider      (priority 7, global, free)
    ├── GFSProvider            (priority 6, global, free)
    └── OpenWeatherProvider    (priority 6, global)
         ↓
    Weighted blend by priority
         ↓
    Dual swell processing:
    • Confused sea detection (swells < 45° apart)
    • Significant wave height √(H₁² + H₂²)
    • Sea state classification (calm → phenomenal)
    • Safety rating (safe/caution/danger)
         ↓
    + Open-Meteo Marine API (parallel, free, no key)
    • Wind wave height/direction/period
    • Ocean current velocity + direction
    • Sea surface temperature
         ↓
    Redis cache (conditions: 1hr, forecast: 12hr, zones: 24hr)
```

---

## Tidal Data (100% Free)

| Region | Provider | Cost |
|--------|----------|------|
| US zones | NOAA Tides & Currents | Free, no key |
| UK/Ireland | NTSLF (National Tidal) | Free, no key |
| Caribbean/AUS/NZ | WorldTides | Fallback only |

---

## Safety Alert System

Real-time warnings based on combined weather, wave and marine conditions:

| Alert | Trigger | Level |
|-------|---------|-------|
| 🌀 Confused Sea Warning | Swells within 45° + B≥7 + waves ≥ 2.5m | 🔴 Danger |
| 🌀 Confused Sea Advisory | Swells within 45° + B≥5 + waves ≥ 1.5m | 🟠 Warning |
| 📉 Extremely Low Pressure | Pressure < 970 hPa | 🔴 Danger |
| 📉 Very Low Pressure | Pressure < 985 hPa | 🔴 Danger |
| 📉 Low Pressure Advisory | Pressure < 1000 hPa | 🟠 Warning |
| 🌪️ Hurricane Force | Beaufort 12 | 🔴 Danger |
| ⛈️ Storm Force | Beaufort 10-11 | 🔴 Danger |
| 💨 Gale Warning | Beaufort 8-9 | 🟠 Warning |
| 🌊 Extreme Waves | Wave height ≥ 9m | 🔴 Danger |
| 🌊 Rough Seas | Wave height ≥ 4m | 🟠 Warning |
| 🔄 Extreme Current | Ocean current ≥ 8 knots | 🔴 Danger |
| 🔄 Very Strong Current | Ocean current ≥ 5 knots | 🔴 Danger |
| 🔄 Strong Current | Ocean current ≥ 3 knots | 🟠 Warning |

---

## Sea State Classification

| State | Color | Description |
|-------|-------|-------------|
| Glassy/Calm/Smooth | 🟢 Green | Safe conditions |
| Slight/Moderate | 🟡 Yellow | Caution advised |
| Rough/Very Rough | 🟠 Orange | Small craft advisory |
| High/Very High | 🔴 Red | Dangerous |
| **Phenomenal** | **🔴 Intense Red** | **Survival conditions** |
| Confused (mild) | 🟠 Orange | Crossing swells < 2.5m |
| Confused (severe) | 🔴 Red | Crossing swells ≥ 2.5m |

---

## Historical Storm Conditions

Recreated meteorological conditions from famous sailing disasters:

| Event | Date | Wind | Waves | Pressure | Casualties |
|-------|------|------|-------|---------|-----------|
| **Fastnet Race Storm** | Aug 1979 | B11, 55 kts | 13.5m confused | 966 hPa | 15 deaths, 5 yachts |
| **Sydney-Hobart Storm** | Dec 1998 | B12, 60 kts | 20m confused | 958 hPa | 6 deaths, 5 yachts |
| **Rolex Middle Sea** | Oct 2007 | B9, 42 kts | 6.5m confused | 982 hPa | Several dismasted |

---

## CI/CD Pipeline

```
Feature branch push
    → ESLint + TypeScript check
    → Vitest unit tests + coverage
    → Docker build + Trivy security scan
    → Push to GHCR with commit SHA tag

Merge to develop
    → All above checks
    → Auto-deploy to staging namespace

Production deployment (manual)
    → Canary deploy (10% traffic)    ← GitHub Actions dropdown
    → Monitor 30 min in Grafana
    → Promote to 100%                ← GitHub Actions dropdown
    → Zero-downtime rolling update
```

---

## KEDA Autoscaling (Proven)

```
Normal traffic → 2 API pods (minimum)
    ↓
Traffic spike > 50 req/s (e.g. regatta day)
    ↓
KEDA reads neptunefriend_http_requests_total from Prometheus
    ↓
Scales to 10 pods in ~30 seconds
    ↓
Traffic drops
    ↓
Scales back to 2 pods after cooldown (~5 minutes)
```

Tested and proven: 2 → 10 pods under load, back to 2 after traffic stops.

---

## Key DevOps Features

| Feature | Implementation |
|---------|---------------|
| **Zero-downtime deploys** | Replica-based canary (10% traffic split), rolling update |
| **Autoscaling** | HPA (CPU/memory) + KEDA (Prometheus HTTP req/s metric) |
| **Observability** | Prometheus custom metrics, Grafana dashboards |
| **SLOs** | 99.9% availability, p95 < 500ms — burn rate alerts |
| **Security** | Default-deny NetworkPolicies, RBAC, pod security contexts |
| **Chaos engineering** | 5 documented chaos experiments with pass criteria |
| **Load testing** | k6 script with normal load + spike scenarios |
| **OAuth** | Google OAuth 2.0 via nginx proxy routing |

---

## Getting Started

### Prerequisites
- Node.js 20+, Docker, npm 10+

### Run locally

```bash
git clone https://github.com/majorbatou/NeptuneFriend.git
cd NeptuneFriend
npm install

# Start PostgreSQL + Redis
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Configure environment
cp apps/api/.env.example apps/api/.env
# Add your API keys (see below)

# Run migrations + seed 37 sailing zones
npm -w apps/api run migrate

# Start both servers
npm run dev:api   # → http://localhost:4000
npm run dev:web   # → http://localhost:3000
```

### API Keys

| Service | Key | Free tier |
|---------|-----|-----------|
| [OpenWeatherMap](https://openweathermap.org/api) | `OPENWEATHER_API_KEY` | 1,000 calls/day |
| [WorldTides](https://worldtides.info) | `WORLDTIDES_API_KEY` | 100 calls/day (fallback only) |
| [Met Office DataHub](https://datahub.metoffice.gov.uk) | `METOFFICE_API_KEY` | 360 calls/day |
| [Google OAuth](https://console.cloud.google.com) | `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | Free |

ECMWF, ICON, GFS, Open-Meteo, Open-Meteo Marine, NOAA and NTSLF require **no API key**.

---

## Project Structure

```
neptunefriend/
├── apps/
│   ├── api/                    # Express API (TypeScript)
│   │   └── src/
│   │       ├── config/         # Passport OAuth config
│   │       ├── controllers/    # Auth controller
│   │       ├── data/           # Historical storm conditions data
│   │       ├── db/             # Pool + migration runner
│   │       ├── middleware/     # Auth, rate limit, metrics
│   │       ├── migrations/     # SQL migrations (3 files, 37 zones)
│   │       ├── models/         # User, Zone models
│   │       ├── routes/         # Auth, weather, historical, marine routes
│   │       └── services/weather/
│   │           ├── providers/  # 6 weather + 2 tidal + 1 marine providers
│   │           ├── MarineEnhancer.ts
│   │           ├── WeatherAggregator.ts
│   │           └── WeatherCache.ts
│   └── web/                    # React frontend (TypeScript)
│       └── src/
│           ├── components/
│           │   ├── alerts/     # AlertBell, AlertHistory, AlertConfigurator
│           │   ├── historical/ # HistoricalConditions component
│           │   ├── map/        # SailingMap, ZoneMarker, ZonePanel
│           │   ├── marine/     # MarineConditionsCard
│           │   ├── planner/    # RouteMap, RoutePanel, WaypointList
│           │   ├── safety/     # SafetyAlerts component
│           │   ├── sailing/    # ConditionsCard, WaveCard, SafetyBadge
│           │   ├── swell/      # SwellRose, SeaStateCard, ModelBadges
│           │   ├── ui/         # Button, Card, Input, Spinner, Toast...
│           │   └── weather/    # WindRose, TidalFlow, ForecastTimeline
│           ├── hooks/          # useWeather, useAuth, useMarine...
│           ├── pages/          # Dashboard, Map, RoutePlanner, Alerts, Historical
│           ├── services/       # API client, weatherService
│           ├── store/          # Zustand stores
│           └── types/          # TypeScript types
├── infra/
│   ├── terraform/              # VPC + EKS + OIDC + EBS CSI modules
│   └── ansible/                # Server configuration roles
├── k8s/
│   ├── base/                   # Deployments, services, RBAC, network policies
│   ├── canary/                 # Canary deployment manifests
│   └── cluster-essentials/     # KEDA ScaledObject
├── monitoring/
│   ├── prometheus/             # Helm values + alert rules
│   └── grafana/dashboards/     # API, weather, SLO dashboards
├── slo/                        # SLO definitions
├── load-testing/               # k6 load test scripts
├── chaos/                      # Chaos engineering runbook
└── docs/                       # Architecture, API, runbooks
```

---

## Documentation

| Doc | Description |
|-----|-------------|
| [Architecture](docs/ARCHITECTURE.md) | System diagram, data flows, tech choices |
| [API Reference](docs/API.md) | All endpoints with request/response examples |
| [SLO Definitions](slo/SLO.md) | Availability, latency, freshness targets |
| [Canary Deployment](docs/CANARY-DEPLOYMENT.md) | Zero-downtime release process |
| [Incident Runbook](docs/INCIDENT-RUNBOOK.md) | Alert response procedures |
| [Production Checklist](docs/PRODUCTION-CHECKLIST.md) | Pre-deploy verification |
| [Chaos Runbook](chaos/CHAOS-RUNBOOK.md) | 5 chaos experiments with pass criteria |
| [Load Testing](load-testing/README.md) | k6 setup and test scenarios |

---

<div align="center">

Built with TypeScript · React · Node.js · PostgreSQL · Redis · Docker · Kubernetes · Terraform · Prometheus · Grafana

</div>
