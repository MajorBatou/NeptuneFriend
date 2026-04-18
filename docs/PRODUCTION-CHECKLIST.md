# NeptuneFriend — Production Readiness Checklist

Complete this checklist before every production deployment.

---

## 1. Code Quality ✅

- [ ] All CI checks pass (lint, type-check, tests, build)
- [ ] Test coverage above 70% for critical paths
- [ ] No known critical or high CVEs in `npm audit`
- [ ] No `console.log` statements in production code
- [ ] All environment variables documented in `.env.example`
- [ ] No hardcoded secrets or API keys in code

## 2. Database ✅

- [ ] All migrations tested against a clean database
- [ ] Migrations are backwards compatible (no breaking schema changes)
- [ ] Database backups configured and tested
- [ ] Connection pool sized appropriately (max: 20)
- [ ] Slow query logging enabled
- [ ] Indexes exist for all frequently queried columns

## 3. API ✅

- [ ] All endpoints return consistent error shapes
- [ ] Rate limiting configured for all public endpoints
- [ ] Authentication required for all protected endpoints
- [ ] Input validation with Zod on all POST/PUT bodies
- [ ] Health check endpoint returns database status
- [ ] `/metrics` endpoint accessible for Prometheus scraping
- [ ] CORS configured for production domain only

## 4. Frontend ✅

- [ ] Bundle size within limits (< 250kb per chunk)
- [ ] All pages have proper `<title>` and meta tags
- [ ] Skip link present for keyboard accessibility
- [ ] Error boundaries wrap all async components
- [ ] Loading states for all data fetches
- [ ] Offline detection banner works
- [ ] Web Vitals tracking enabled

## 5. Kubernetes ✅

- [ ] All deployments have resource `requests` and `limits`
- [ ] Liveness and readiness probes configured
- [ ] HPA configured with appropriate min/max replicas
- [ ] PodDisruptionBudgets set for zero-downtime deploys
- [ ] Network policies default-deny with explicit allow rules
- [ ] RBAC service accounts with least-privilege permissions
- [ ] Pod security contexts set (non-root, no privilege escalation)
- [ ] All secrets in K8s Secrets (not ConfigMaps)

## 6. TLS & Security ✅

- [ ] TLS certificates issued by Let's Encrypt (production issuer)
- [ ] HSTS header with `max-age=31536000; includeSubDomains`
- [ ] CSP header configured for all routes
- [ ] X-Frame-Options: SAMEORIGIN
- [ ] SSL/TLS minimum version: TLS 1.2
- [ ] API keys rotated from development values

## 7. Monitoring ✅

- [ ] Prometheus scraping all pods
- [ ] Grafana dashboards deployed (API, weather, SLO)
- [ ] Alert rules deployed and tested
- [ ] Alertmanager routing to Slack channels
- [ ] SLO recording rules active
- [ ] Error budget dashboard visible

## 8. Performance ✅

- [ ] Redis cache operational (5min conditions, 30min forecast)
- [ ] Weather provider response times < 3s each
- [ ] API p95 latency < 500ms under normal load
- [ ] Load test run at peak expected traffic
- [ ] CDN configured for static assets (optional)

## 9. Disaster Recovery ✅

- [ ] Database backup strategy documented and tested
- [ ] Rollback procedure tested (`kubectl rollout undo`)
- [ ] Runbook for each alert rule exists
- [ ] On-call rotation defined (even if just one person)
- [ ] Incident response procedure documented

## 10. Documentation ✅

- [ ] README up to date with setup instructions
- [ ] Architecture diagram current
- [ ] API endpoints documented
- [ ] Deployment process documented
- [ ] SLOs defined and communicated

---

## Sign-off

| Area | Owner | Status | Date |
|------|-------|--------|------|
| Code quality | Dev | ⬜ | - |
| Database | Dev | ⬜ | - |
| API | Dev | ⬜ | - |
| Frontend | Dev | ⬜ | - |
| Kubernetes | DevOps | ⬜ | - |
| TLS & Security | DevOps | ⬜ | - |
| Monitoring | DevOps | ⬜ | - |
| Performance | Dev/DevOps | ⬜ | - |

**Overall status:** ⬜ Not ready | 🟡 Mostly ready | ✅ Ready for production
