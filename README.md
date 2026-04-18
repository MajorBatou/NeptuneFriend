<div align="center">

# ⚓ NeptuneFriend

**Real-time sailing conditions platform with multi-model weather ensemble forecasting**

[![CI](https://github.com/MajorBatou/NeptuneFriend/actions/workflows/ci.yml/badge.svg)](https://github.com/MajorBatou/NeptuneFriend/actions/workflows/ci.yml)
[![Docker](https://github.com/MajorBatou/NeptuneFriend/actions/workflows/docker.yml/badge.svg)](https://github.com/MajorBatou/NeptuneFriend/actions/workflows/docker.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-EKS-326CE5?logo=kubernetes&logoColor=white)

A full-stack DevOps CV project built over 25 days — from `npm create vite` to production Kubernetes with canary deployments, multi-model weather ensemble, Prometheus monitoring and SLO-driven alerting.

</div>

---

## What it does

NeptuneFriend aggregates data from **6 weather models** to give sailors accurate, blended forecasts with features professional apps charge for:

- **Dual swell visualization** — primary + secondary swell rose with confused sea detection
- **Multi-model ensemble** — ECMWF, ICON, GFS, Open-Meteo, OpenWeather, Met Office blended by regional priority
- **37 global sailing zones** — UK/Ireland, US East/West, Caribbean, Australia, New Zealand
- **Real-time tidal data** — WorldTides integration with ebb/flood/slack detection
- **Route planner** — click-to-add waypoints with distance/time estimates and GPX export
- **Configurable alerts** — wind/wave/storm/fog alerts with in-app notification bell

---

## Tech Stack

### Application
| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite, TanStack Query, Zustand, Leaflet, CSS Modules |
| **Backend** | Node.js 20, Express, TypeScript, PostgreSQL, Redis, JWT, Zod |
| **Testing** | Vitest, Testing Library, k6 (load testing) |

### Infrastructure & DevOps
| Area | Technologies |
|------|-------------|
| **Cloud** | AWS EKS, RDS, VPC (Terraform) |
| **Containers** | Docker, GHCR, Trivy security scanning |
| **Kubernetes** | EKS, NGINX Ingress, cert-manager, KEDA, HPA |
| **CI/CD** | GitHub Actions (CI, CD staging, canary, production promotion) |
| **Config** | Ansible (server hardening, Docker, kubectl setup) |
| **Monitoring** | Prometheus, Grafana, Alertmanager, kube-prometheus-stack |
| **Security** | RBAC, NetworkPolicies, PodSecurityAdmission, TLS, HSTS, CSP |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     AWS EKS Cluster                      │
│                                                           │
│  NGINX Ingress + cert-manager (Let's Encrypt TLS)        │
│       ↓                    ↓                             │
│  Web (React)          API (Express)                      │
│  2-6 pods             2-8 pods (HPA + KEDA)              │
│                            ↓              ↓              │
│                       PostgreSQL       Redis             │
│                            ↓                             │
│                   6 Weather Providers                    │
│            ECMWF · ICON · GFS · Open-Meteo              │
│            OpenWeather · Met Office · WorldTides         │
│                                                           │
│  Prometheus + Grafana + Alertmanager (monitoring ns)     │
└─────────────────────────────────────────────────────────┘
```

---

## Weather Model Architecture

The API uses a **provider pattern** to aggregate and blend data from multiple models:

```
Request → WeatherAggregator
    ├── ECMWFProvider     (priority 9, global)
    ├── MetOfficeProvider (priority 9, UK/Ireland only)
    ├── ICONProvider      (priority 8, Europe only)
    ├── OpenMeteoProvider (priority 7, global, free)
    ├── GFSProvider       (priority 6, global, free)
    └── OpenWeatherProvider (priority 6, global)
         ↓
    Weighted blend by priority
         ↓
    Dual swell processing:
    • Confused sea detection (swells < 45° apart)
    • Significant wave height √(H₁² + H₂²)
    • Sea state classification
    • Safety rating (safe/caution/danger)
         ↓
    Redis cache (5min TTL)
         ↓
    Response with model contribution badges
```

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

## Key DevOps Features

| Feature | Implementation |
|---------|---------------|
| **Zero-downtime deploys** | Replica-based canary (10% traffic split), rolling update |
| **Autoscaling** | HPA (CPU/memory) + KEDA (Prometheus HTTP req/s metric) |
| **Observability** | Prometheus metrics, 3 Grafana dashboards, Alertmanager Slack routing |
| **SLOs** | 99.9% availability, p95 < 500ms — fast/slow burn rate alerts |
| **Security** | Default-deny NetworkPolicies, RBAC least-privilege, pod security contexts |
| **Chaos engineering** | 5 documented chaos experiments with pass criteria and rollback |
| **Load testing** | k6 script with normal load + spike scenarios, SLO thresholds |

---

## Getting Started

### Prerequisites
- Node.js 20+, Docker, npm 10+

### Run locally

```bash
git clone https://github.com/MajorBatou/NeptuneFriend.git
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

### API Keys (all free tiers available)

| Service | Key | Free tier |
|---------|-----|-----------|
| [OpenWeatherMap](https://openweathermap.org/api) | `OPENWEATHER_API_KEY` | 1,000 calls/day |
| [WorldTides](https://worldtides.info) | `WORLDTIDES_API_KEY` | 100 calls/day |
| [Met Office DataHub](https://datahub.metoffice.gov.uk) | `METOFFICE_API_KEY` | 360 calls/day |

ECMWF, ICON, GFS and Open-Meteo require **no API key**.

---

## Project Structure

```
neptunefriend/
├── apps/
│   ├── api/                    # Express API (TypeScript)
│   │   ├── src/
│   │   │   ├── controllers/    # Auth controller
│   │   │   ├── db/             # Pool + migration runner
│   │   │   ├── middleware/     # Auth, rate limit, metrics
│   │   │   ├── migrations/     # SQL migrations (3 files, 37 zones)
│   │   │   ├── models/         # User, Zone models
│   │   │   ├── routes/         # Auth + weather routes
│   │   │   └── services/
│   │   │       └── weather/
│   │   │           ├── providers/  # 6 weather providers
│   │   │           ├── WeatherAggregator.ts
│   │   │           └── WeatherCache.ts
│   └── web/                    # React frontend (TypeScript)
│       └── src/
│           ├── components/
│           │   ├── alerts/     # AlertBell, AlertHistory, AlertConfigurator
│           │   ├── map/        # SailingMap, ZoneMarker, ZonePanel
│           │   ├── planner/    # RouteMap, RoutePanel, WaypointList
│           │   ├── sailing/    # ConditionsCard, WaveCard, SafetyBadge
│           │   ├── swell/      # SwellRose, SeaStateCard, ModelBadges
│           │   ├── ui/         # Button, Card, Input, Spinner, Toast...
│           │   └── weather/    # WindRose, TidalFlow, ForecastTimeline
│           ├── hooks/          # useWeather, useAuth, useWebVitals...
│           ├── pages/          # Dashboard, Map, RoutePlanner, Alerts
│           ├── services/       # API client, weatherService
│           ├── store/          # Zustand stores (auth, sailing, alerts, routes)
│           └── types/          # TypeScript types
├── infra/
│   ├── terraform/              # VPC + EKS modules
│   └── ansible/                # Server configuration roles
├── k8s/
│   ├── base/                   # Deployments, services, RBAC, network policies
│   ├── staging/                # Staging ingress
│   ├── prod/                   # Production manifests
│   ├── canary/                 # Canary deployment manifests
│   └── cluster-essentials/     # Ingress, cert-manager, KEDA
├── monitoring/
│   ├── prometheus/             # Helm values + alert rules
│   ├── grafana/dashboards/     # API, weather, SLO dashboards
│   └── alertmanager/           # Slack routing config
├── slo/                        # SLO definitions + Prometheus recording rules
├── load-testing/               # k6 load test scripts
├── chaos/                      # Chaos engineering runbook
└── docs/                       # Architecture, API, runbooks, checklists
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

## 30-Day Build Log

| Days | What was built |
|------|---------------|
| 1–5 | Monorepo scaffold, Terraform VPC+EKS, K8s manifests, Docker pipeline, Ansible roles |
| 6–14 | React frontend: design system, interactive map, weather components, auth, route planner, alerts, performance |
| 15–17 | K8s RBAC, NGINX Ingress + TLS, HPA + KEDA autoscaling |
| 18–19 | PostgreSQL schema + migrations, 6-model weather API, dual swell visualization |
| 20–22 | Production K8s, Prometheus + Grafana, SLOs + burn rate alerts, k6 load testing, chaos engineering |
| 23–25 | Architecture docs, incident runbooks, canary deployment, CV polish |

---

<div align="center">

Built with TypeScript · React · Node.js · PostgreSQL · Redis · Docker · Kubernetes · Terraform · Prometheus · Grafana

</div>
