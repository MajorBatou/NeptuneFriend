# NeptuneFriend ⚓

Real-time sailing conditions platform with multi-model weather ensemble forecasting
and dual swell visualization. Built as a full-stack DevOps CV project.

[![CI](https://github.com/MajorBatou/NeptuneFriend/actions/workflows/ci.yml/badge.svg)](https://github.com/MajorBatou/NeptuneFriend/actions/workflows/ci.yml)

---

## Features

- **Multi-model weather ensemble** — blends 6 weather models (ECMWF, ICON, GFS, Open-Meteo, OpenWeather, Met Office)
- **Dual swell visualization** — primary and secondary swell rose with confused sea detection
- **37 global sailing zones** — UK/Ireland, US East/West, Caribbean, Gulf of Mexico, Australia, New Zealand
- **Interactive map** — Leaflet map with live safety-rated zone markers
- **Route planner** — click-to-add waypoints with GPX export for chart plotters
- **Alerts system** — configurable wind/wave/storm alerts with notification bell
- **Real-time tidal data** — WorldTides integration with ebb/flood/slack detection

---

## Tech Stack

### Frontend
React 18 · TypeScript · Vite · TanStack Query · Zustand · Leaflet · CSS Modules

### Backend
Node.js · Express · TypeScript · PostgreSQL · Redis · JWT · Zod

### Infrastructure
AWS EKS · Terraform · Ansible · Docker · GitHub Actions · NGINX Ingress · cert-manager · KEDA

### Monitoring
Prometheus · Grafana · Alertmanager · kube-prometheus-stack

---

## Getting Started

### Prerequisites
- Node.js 20+
- Docker + Docker Compose
- npm 10+

### Local Development

```bash
# Clone the repo
git clone https://github.com/MajorBatou/NeptuneFriend.git
cd NeptuneFriend

# Install dependencies
npm install

# Start PostgreSQL and Redis
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Set up environment
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your API keys

# Run database migrations
npm -w apps/api run migrate

# Start development servers
npm run dev:api    # API on http://localhost:4000
npm run dev:web    # Web on http://localhost:3000
```

### API Keys Required

| Service | Key | Free tier |
|---------|-----|-----------|
| OpenWeatherMap | `OPENWEATHER_API_KEY` | 1,000 calls/day |
| WorldTides | `WORLDTIDES_API_KEY` | 100 calls/day |
| Met Office DataHub | `METOFFICE_API_KEY` | 360 calls/day |

ECMWF, ICON, GFS and Open-Meteo require no API key.

---

## Project Structure

```
neptunefriend/
├── apps/
│   ├── api/          # Express API
│   └── web/          # React frontend
├── infra/
│   ├── terraform/    # AWS infrastructure
│   └── ansible/      # Server configuration
├── k8s/              # Kubernetes manifests
│   ├── base/         # Shared manifests
│   ├── staging/      # Staging overrides
│   └── prod/         # Production overrides
├── monitoring/       # Prometheus + Grafana
│   ├── prometheus/   # Alert rules + values
│   └── grafana/      # Dashboards
├── slo/              # SLO definitions + recording rules
├── load-testing/     # k6 load test scripts
├── chaos/            # Chaos engineering runbook
└── docs/             # Architecture + API docs
```

---

## CI/CD Pipeline

```
Push to feature branch
    → Lint + Type check
    → Unit tests + Coverage
    → Docker build + Trivy scan
    → Push to GHCR (staging tag)

Merge to develop
    → All above checks
    → Deploy to staging automatically

Manual trigger (deploy-production.yml)
    → Confirm with "DEPLOY" keyword
    → Verify staging health
    → Promote to production
    → Rolling update (zero downtime)
```

---

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Production Checklist](docs/PRODUCTION-CHECKLIST.md)
- [Incident Runbook](docs/INCIDENT-RUNBOOK.md)
- [SLO Definitions](slo/SLO.md)
- [Chaos Engineering](chaos/CHAOS-RUNBOOK.md)
- [Load Testing](load-testing/README.md)

---

## Weather Models

| Model | Provider | Region | Priority |
|-------|----------|--------|---------|
| ECMWF IFS | Open-Meteo | Global | 9 |
| Met Office | DataHub | UK/Ireland | 9 |
| ICON | DWD via Open-Meteo | Europe | 8 |
| Open-Meteo | Open-Meteo | Global | 7 |
| GFS | NOAA via Open-Meteo | Global | 6 |
| OpenWeather | OpenWeatherMap | Global | 6 |

Models are blended by priority weight. Regional specialists (UKMO for UK,
ICON for Europe) are automatically selected based on zone coordinates.

---

## License

MIT
