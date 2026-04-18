# NeptuneFriend — CV & Interview Talking Points

Use this as a reference when writing your CV or preparing for interviews.

---

## One-line description (for CV)

> Built NeptuneFriend, a real-time sailing conditions platform on AWS EKS with a
> 6-model weather ensemble, dual swell visualization, Prometheus/Grafana monitoring,
> SLO-driven alerting and canary deployments — React 18 + Node.js + TypeScript + Kubernetes.

---

## Key achievements to highlight

### Scale and complexity
- **37 global sailing zones** seeded across UK, US, Caribbean, Australia and New Zealand
- **6 weather models** blended in real-time: ECMWF, ICON, GFS, Open-Meteo, OpenWeather, Met Office
- **10 provider architecture** with priority-weighted blending and regional auto-selection

### DevOps depth
- **Full GitOps pipeline**: feature branch → CI (lint/test/build/scan) → staging → canary → prod
- **Zero-downtime deployments**: replica-based canary (10% traffic split) with GitHub Actions promotion
- **Infrastructure as Code**: Terraform VPC + EKS, Ansible server hardening, K8s manifests
- **HPA + KEDA**: CPU/memory autoscaling + Prometheus HTTP req/s event-driven scaling

### Observability
- **3 Grafana dashboards**: API overview, weather model performance, SLO burn rate
- **SLO-driven alerting**: fast burn (14.4x) and slow burn (6x) rate alerts
- **Custom Prometheus metrics**: weather cache hit rate, confused sea detections, provider success rates

### Engineering quality
- **Dual swell visualization**: primary + secondary swell rose, confused sea detection (swells < 45°)
- **Provider pattern**: plug-and-play weather model architecture — add a new model by implementing one interface
- **End-to-end type safety**: TypeScript throughout, Zod validation, shared types between frontend and API

---

## Interview questions and answers

### "Tell me about a technical challenge you solved"

> The dual swell visualization required me to think carefully about oceanographic
> concepts. When two swell systems converge at less than 45 degrees, you get confused
> seas — short, steep, unpredictable waves that are far more dangerous than either
> swell alone. I built a `WeatherAggregator` that calculates the angle between primary
> and secondary swells from multiple models, detects confused seas, computes significant
> wave height using √(H₁² + H₂²), and surfaces a warning in the UI. This required
> understanding both the meteorology and the math, then expressing it cleanly in
> TypeScript types shared across the full stack.

### "How did you approach monitoring and observability?"

> I used the kube-prometheus-stack Helm chart to deploy Prometheus and Grafana.
> I defined SLOs first — 99.9% availability and p95 latency under 500ms — then
> worked backwards to create Prometheus recording rules and burn rate alerts.
> Fast burn alerts fire when we're consuming the error budget 14.4x faster than
> normal, giving enough warning to act before the budget is exhausted. I also
> instrumented the API with custom metrics for weather cache hit rates and provider
> success rates, which surface in a dedicated weather model Grafana dashboard.

### "How do you deploy to production safely?"

> NeptuneFriend uses a replica-based canary strategy. The stable production deployment
> runs 9 replicas and the canary runs 1 — Kubernetes load balances proportionally,
> so the canary gets 10% of traffic automatically with no service mesh required.
> I watch error rates and latency in Grafana for 30 minutes, then promote via a
> GitHub Actions workflow that updates the stable image and removes the canary.
> The whole process is zero-downtime because of the rolling update strategy with
> `maxUnavailable: 0`.

### "Why did you choose this stack?"

> I picked technologies I'd encounter in a senior DevOps or platform engineering role.
> React + TypeScript for the frontend because it's the industry standard. Express on
> Node.js for the API because it's fast to build and matches the TypeScript type system
> end-to-end. PostgreSQL for persistence because relational data with foreign keys
> is the right choice for users, zones and alerts. Kubernetes because it's the
> deployment target for most production systems today. Prometheus and Grafana because
> they're the observability standard. Terraform because infrastructure as code is
> non-negotiable.

### "What would you add next?"

> Several things: NAM and HRRR models for US zones (already stubbed in the provider
> architecture), Google and GitHub OAuth (the provider pattern in the auth controller
> makes this straightforward), WebSocket push for real-time condition updates instead
> of polling, and a mobile app using React Native sharing the business logic. The
> architecture was designed to support all of these without major refactoring.

---

## Numbers to remember

| Metric | Value |
|--------|-------|
| Lines of TypeScript | ~8,000+ |
| React components | 40+ |
| API endpoints | 7 |
| Weather models | 6 |
| Sailing zones | 37 |
| Database tables | 8 |
| SQL migrations | 3 |
| K8s manifests | 25+ |
| Grafana dashboards | 3 |
| Alert rules | 8 |
| GitHub Actions workflows | 5 |
| Days to build | 25 |
