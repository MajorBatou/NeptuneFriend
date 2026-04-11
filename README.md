# NeptuneFriend

Real-time sailing conditions platform for mariners.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| State | Zustand + TanStack React Query |
| Routing | React Router v6 |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Infra | Terraform + Kubernetes + Helm |
| Config mgmt | Ansible |
| CI/CD | GitHub Actions + ArgoCD |
| Observability | Prometheus + Grafana + Loki |

## Repository structure

```
neptunefriend/
├── apps/
│   ├── web/              # React frontend (Vite + TypeScript)
│   │   ├── src/
│   │   │   ├── components/   # Reusable UI components
│   │   │   ├── pages/        # Route-level page components
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   ├── services/     # API client functions
│   │   │   └── store/        # Zustand global state
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   └── api/              # Express API (TypeScript)
│       ├── src/
│       └── Dockerfile
├── infra/
│   ├── terraform/        # Cloud infra (VPC, K8s, DB)
│   └── ansible/          # Node configuration management
├── k8s/
│   ├── base/             # Shared K8s manifests
│   ├── staging/          # Staging overlays
│   └── prod/             # Production overlays
├── monitoring/
│   ├── prometheus/       # Alert rules & recording rules
│   └── grafana/          # Dashboard JSON exports
├── .github/
│   └── workflows/        # CI and CD pipelines
└── docker-compose.yml    # Local full-stack development
```

## Getting started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- npm 10+

### Local development

```bash
# 1. Clone the repository
git clone https://github.com/your-org/neptunefriend.git
cd neptunefriend

# 2. Install all workspace dependencies
npm install

# 3. Copy env files and fill in your API keys
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env

# 4. Start full stack (Postgres + Redis + API + Web)
docker-compose up

# Or run services individually for faster iteration:
npm run dev:api    # API on http://localhost:4000
npm run dev:web    # React on http://localhost:3000
```

### Running tests

```bash
npm run test          # All tests
npm -w apps/web run test:coverage   # Web with coverage report
```

### Code quality

```bash
npm run lint       # ESLint across all workspaces
npm run format     # Prettier formatting
```

## Commit convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(web): add wind rose component
fix(api): handle OpenWeather API timeout
docs: update local dev setup steps
ci: add Playwright E2E tests to CI pipeline
```

## Day-by-day deployment program

See the [30-day deployment plan](docs/deployment-plan.md) for the full schedule.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch strategy, PR guidelines, and code standards.
