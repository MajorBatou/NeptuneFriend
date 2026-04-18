# NeptuneFriend — Incident Response Runbook

---

## Severity Levels

| Level | Description | Response time | Example |
|-------|-------------|---------------|---------|
| P1 | Complete outage | Immediate | API down, database unreachable |
| P2 | Partial outage | < 30 min | Weather data unavailable |
| P3 | Degraded | < 2 hours | High latency, cache miss rate high |
| P4 | Minor issue | < 24 hours | Single provider failing |

---

## Alert Response Procedures

### NeptuneFriendAPIDown (P1)

**Symptoms:** No API pods responding, health check failing.

```bash
# 1. Check pod status
kubectl get pods -n neptune-prod

# 2. Check recent events
kubectl get events -n neptune-prod --sort-by='.lastTimestamp' | tail -20

# 3. Check pod logs
kubectl logs -l app=neptunefriend-api -n neptune-prod --tail=50

# 4. Check resource pressure
kubectl top nodes
kubectl top pods -n neptune-prod

# 5. If pods are crashing — rollback
kubectl rollout undo deployment/neptunefriend-api -n neptune-prod
kubectl rollout status deployment/neptunefriend-api -n neptune-prod

# 6. If database issue — check connection
kubectl exec -it deploy/neptunefriend-api -n neptune-prod -- \
  curl http://localhost:4000/health
```

---

### NeptuneFriendHighErrorRate (P2)

**Symptoms:** > 5% of requests returning 5xx.

```bash
# 1. Check which endpoints are failing
kubectl logs -l app=neptunefriend-api -n neptune-prod --tail=100 | grep "5[0-9][0-9]"

# 2. Check if database is slow
kubectl exec -it deploy/neptunefriend-api -n neptune-prod -- \
  curl http://localhost:4000/health

# 3. Check Redis
kubectl exec -it deploy/neptunefriend-api -n neptune-prod -- \
  wget -q -O- http://localhost:4000/metrics | grep cache

# 4. Scale up if load-related
kubectl scale deployment neptunefriend-api --replicas=6 -n neptune-prod
```

---

### NeptuneFriendHighLatency (P3)

**Symptoms:** p95 latency > 2 seconds.

```bash
# 1. Check HPA status
kubectl get hpa -n neptune-prod

# 2. Force HPA scale if needed
kubectl patch hpa neptunefriend-api-hpa -n neptune-prod \
  -p '{"spec":{"minReplicas":4}}'

# 3. Check weather provider response times
kubectl logs -l app=neptunefriend-api -n neptune-prod --tail=50 | grep "Slow query"

# 4. Check Redis cache hit rate
curl http://localhost:4000/metrics | grep cache
```

---

### WeatherCacheHitRateLow (P3)

**Symptoms:** Cache miss rate > 50% — Redis likely down.

```bash
# 1. Check Redis pod
kubectl get pods -n neptune-prod | grep redis

# 2. Check Redis logs
kubectl logs deploy/redis -n neptune-prod --tail=20

# 3. Restart Redis if needed
kubectl rollout restart deployment/redis -n neptune-prod

# Note: App degrades gracefully — fetches live data without cache
# Performance will be degraded but service remains available
```

---

### SLOAvailabilityBreach (P1)

**Symptoms:** Error budget exhausted, availability below 99.9%.

```bash
# 1. Immediately assess scope
kubectl get pods -n neptune-prod
curl https://api.neptunefriend.app/health

# 2. Freeze all deployments
# (Cancel any running GitHub Actions workflows)

# 3. Identify root cause
kubectl get events -n neptune-prod --sort-by='.lastTimestamp'
kubectl logs -l app=neptunefriend-api -n neptune-prod --tail=100

# 4. Rollback if recent deployment caused it
kubectl rollout undo deployment/neptunefriend-api -n neptune-prod
kubectl rollout undo deployment/neptunefriend-web -n neptune-prod

# 5. Post-incident review required within 24 hours
```

---

## Communication Templates

### Internal Slack — Incident Started
```
🚨 INCIDENT STARTED — [P1/P2/P3]
Service: NeptuneFriend [API/Web/Database]
Impact: [description]
Started: [time]
Owner: [your name]
Status page: [url]
```

### Internal Slack — Incident Resolved
```
✅ INCIDENT RESOLVED
Service: NeptuneFriend [API/Web/Database]
Duration: [X minutes]
Root cause: [brief description]
Follow-up: [ticket/PR link]
```

---

## Post-Incident Review Template

**Date:** [date]
**Duration:** [X minutes]
**Severity:** P[1-4]
**Owner:** [name]

### Timeline
| Time | Event |
|------|-------|
| HH:MM | Alert fired |
| HH:MM | Owner acknowledged |
| HH:MM | Root cause identified |
| HH:MM | Mitigation applied |
| HH:MM | Incident resolved |

### Root Cause
[Describe what caused the incident]

### Impact
[Describe what users experienced]

### What Went Well
- [item]

### What Could Be Improved
- [item]

### Action Items
| Action | Owner | Due date |
|--------|-------|---------|
| [item] | [name] | [date] |
