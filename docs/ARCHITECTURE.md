# NeptuneFriend — Architecture

## Overview

NeptuneFriend is a real-time sailing conditions platform built on a cloud-native
microservices architecture. It aggregates data from 6 weather models to provide
sailors with accurate, multi-model ensemble forecasts including dual swell visualization.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     AWS (us-east-1)                      │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                 EKS Cluster                          │ │
│  │                                                       │ │
│  │  ┌──────────────┐    ┌──────────────────────────┐   │ │
│  │  │  neptune-    │    │      monitoring          │   │ │
│  │  │  staging     │    │                          │   │ │
│  │  │  neptune-    │    │  Prometheus + Grafana    │   │ │
│  │  │  prod        │    │  Alertmanager            │   │ │
│  │  └──────────────┘    └──────────────────────────┘   │ │
│  │                                                       │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────────────────┐ │ │
│  │  │  NGINX  │  │  Web    │  │  API                │ │ │
│  │  │ Ingress │→ │ (React) │  │  (Express + TS)     │ │ │
│  │  │  + TLS  │  │ 2-6 pods│  │  2-8 pods           │ │ │
│  │  └─────────┘  └─────────┘  └─────────────────────┘ │ │
│  │                                   ↓          ↓       │ │
│  │                            ┌──────────┐ ┌────────┐  │ │
│  │                            │PostgreSQL│ │ Redis  │  │ │
│  │                            │   RDS    │ │ Cache  │  │ │
│  │                            └──────────┘ └────────┘  │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↕ Weather APIs
        ┌──────┬──────┬──────┬──────┬──────┬────────┐
        │ECMWF │ ICON │ GFS  │Open- │Open  │WorldT- │
        │      │ DWD  │ NOAA │Meteo │Weath │ides    │
        └──────┴──────┴──────┴──────┴──────┴────────┘
```

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18 | UI framework |
| TypeScript | 5.4 | Type safety |
| Vite | 5 | Build tool |
| React Router | 6 | Client-side routing |
| TanStack Query | 5 | Server state management |
| Zustand | 4 | Client state management |
| Leaflet | 1.9 | Interactive maps |
| CSS Modules | - | Scoped styling |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 20 LTS | Runtime |
| Express | 4 | HTTP framework |
| TypeScript | 5.4 | Type safety |
| PostgreSQL | 15 | Primary database |
| Redis | 7 | Weather data cache |
| bcryptjs | - | Password hashing |
| jsonwebtoken | - | JWT authentication |
| Zod | 3 | Input validation |
| axios | - | HTTP client for weather APIs |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| AWS EKS | Kubernetes hosting |
| AWS RDS | PostgreSQL hosting |
| Terraform | Infrastructure as Code |
| Ansible | Configuration management |
| GitHub Actions | CI/CD pipelines |
| GHCR | Container registry |
| cert-manager | TLS certificate management |
| NGINX Ingress | Load balancing + routing |
| KEDA | Event-driven autoscaling |

### Monitoring
| Technology | Purpose |
|-----------|---------|
| Prometheus | Metrics collection |
| Grafana | Dashboards + visualization |
| Alertmanager | Alert routing |
| kube-prometheus-stack | Full monitoring stack |

---

## Weather Model Architecture

The API uses a provider pattern to aggregate data from multiple models:

```
Request → WeatherAggregator
              ↓
    ┌─────────────────────┐
    │  Select providers   │
    │  by region support  │
    └─────────────────────┘
              ↓
    ┌─────────────────────────────────────────┐
    │ Parallel fetch from all providers       │
    │                                         │
    │ ECMWFProvider  (priority: 9, global)   │
    │ MetOfficeProvider (priority: 9, UK/IE) │
    │ ICONProvider   (priority: 8, Europe)   │
    │ OpenMeteoProvider (priority: 7, global)│
    │ GFSProvider    (priority: 6, global)   │
    │ OpenWeatherProvider (priority: 6)      │
    └─────────────────────────────────────────┘
              ↓
    ┌─────────────────────┐
    │  Weighted blend by  │
    │  provider priority  │
    └─────────────────────┘
              ↓
    ┌─────────────────────┐
    │  Dual swell         │
    │  processing:        │
    │  - Confused sea     │
    │  - Sea state        │
    │  - Safety rating    │
    └─────────────────────┘
              ↓
    ┌─────────────────────┐
    │  Redis cache        │
    │  (5min conditions)  │
    └─────────────────────┘
              ↓
           Response
```

---

## Data Flow

### User Authentication
```
Browser → POST /auth/register → Zod validation → bcrypt hash
       → PostgreSQL INSERT → JWT token → Response
```

### Weather Conditions Request
```
Browser → GET /weather/conditions/:zoneId
       → Redis cache check (HIT → return cached)
       → MISS → Parallel fetch from 6 providers
       → Weighted blend → Dual swell detection
       → Safety rating → Redis cache SET (5min TTL)
       → Response with model contribution badges
```

### Route Planning
```
Browser → Click map → Add waypoints to Zustand store
       → Calculate distance (Haversine formula)
       → Estimate time (at 6 knots)
       → Save to localStorage (persist)
       → Export as GPX
```

---

## Database Schema

```
users ─────────────── user_preferences
  │
  ├── user_favorite_zones ── sailing_zones ── weather_cache
  │
  ├── sailing_routes ── route_waypoints
  │
  ├── alert_configs ── sailing_zones
  │
  └── alerts ── sailing_zones
```

---

## Security Architecture

- **Network:** Default-deny NetworkPolicies, explicit allow rules
- **Auth:** JWT with 7-day expiry, bcrypt password hashing (12 rounds)
- **TLS:** Let's Encrypt certificates, TLS 1.2+ only, HSTS
- **RBAC:** Least-privilege service accounts per component
- **Pod Security:** Non-root containers, no privilege escalation, read-only filesystem
- **Rate Limiting:** 10 auth attempts per 15 min, 100 API calls per minute
- **Headers:** HSTS, CSP, X-Frame-Options, Referrer-Policy

---

## Scaling

| Component | Min | Max | Trigger |
|-----------|-----|-----|---------|
| API pods | 2 | 8 | CPU > 70% or Memory > 80% |
| Web pods | 2 | 6 | CPU > 70% or Memory > 80% |
| API pods (KEDA) | 2 | 10 | HTTP req/s > 50 |
