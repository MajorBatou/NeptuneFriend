# NeptuneFriend — Canary Deployment Guide

## Overview

NeptuneFriend uses a **replica-based canary strategy** for zero-risk production
deployments. New versions receive 10% of traffic while the stable version handles 90%.

```
Production traffic (100%)
        │
        ├── 90% → Stable deployment (9 replicas)
        │
        └── 10% → Canary deployment (1 replica)
```

---

## How Traffic Splitting Works

Both stable and canary deployments share the same Kubernetes Service selector
(`app: neptunefriend-api`). Kubernetes load balances proportionally to replica count.

With 9 stable + 1 canary replicas = **10% canary traffic automatically**.

No Istio or service mesh required — pure Kubernetes.

---

## Canary Deployment Workflow

### Step 1 — Build and push canary image

The CI pipeline automatically tags the new image with the commit SHA:

```bash
# In GitHub Actions (automated)
docker build -t ghcr.io/majorbatou/neptunefriend-api:sha-abc1234 .
docker push ghcr.io/majorbatou/neptunefriend-api:sha-abc1234
```

### Step 2 — Deploy canary (10% traffic)

```bash
# Via script
bash k8s/canary.sh deploy sha-abc1234

# Via GitHub Actions
# Go to Actions → Canary Deployment → Run workflow
# Action: deploy, Image tag: sha-abc1234
```

### Step 3 — Monitor canary health (30 minutes)

Watch these metrics in Grafana → NeptuneFriend SLO Dashboard:

- Error rate for `version=canary` pods < 1%
- Latency p95 < 500ms
- No pod restarts

```bash
# Quick health check via kubectl
kubectl logs -l version=canary,app=neptunefriend-api \
  -n neptune-prod --tail=20 -f

# Check canary vs stable error rates in Prometheus
# rate(nginx_ingress_controller_requests{status=~"5.."}[5m]) by (pod)
```

### Step 4a — Promote if healthy

```bash
# Via script
bash k8s/canary.sh promote sha-abc1234

# Via GitHub Actions
# Action: promote, Image tag: sha-abc1234
```

This will:
1. Update stable deployment to `sha-abc1234`
2. Wait for rolling update to complete
3. Remove canary deployment
4. 100% traffic now on new version

### Step 4b — Rollback if issues found

```bash
# Via script
bash k8s/canary.sh rollback

# Via GitHub Actions
# Action: rollback
```

This removes the canary — traffic instantly returns 100% to stable.

---

## Decision Criteria

| Metric | Promote if | Rollback if |
|--------|-----------|-------------|
| Error rate | < 0.1% | > 1% |
| p95 latency | < 400ms | > 1s |
| Pod restarts | 0 | > 0 |
| Health check | Passing | Failing |

---

## Traffic Weight Adjustment

To change the canary traffic percentage, adjust replica counts:

```bash
# 5% canary (1 canary / 19 stable)
kubectl scale deployment neptunefriend-api --replicas=19 -n neptune-prod
kubectl scale deployment neptunefriend-api-canary --replicas=1 -n neptune-prod

# 25% canary (3 canary / 9 stable)
kubectl scale deployment neptunefriend-api --replicas=9 -n neptune-prod
kubectl scale deployment neptunefriend-api-canary --replicas=3 -n neptune-prod

# 50% canary (equal split)
kubectl scale deployment neptunefriend-api --replicas=5 -n neptune-prod
kubectl scale deployment neptunefriend-api-canary --replicas=5 -n neptune-prod
```

---

## Full Promotion Flow (Zero Downtime)

```
T+0:00  Deploy canary (1 replica) — 10% traffic
T+0:05  Verify canary pods healthy
T+0:30  Check Grafana — no error rate increase
T+0:30  Run: bash k8s/canary.sh promote sha-abc1234
T+0:35  Stable deployment rolling update (replaces pods one by one)
T+0:40  Canary removed — 100% on new version
T+0:40  Done — zero downtime achieved
```
