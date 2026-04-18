# NeptuneFriend — Chaos Engineering Runbook

Chaos experiments to test system resilience. Run these in **staging only**
before promoting to production.

---

## Prerequisites

```bash
# Install chaos mesh (optional — can also use kubectl directly)
helm repo add chaos-mesh https://charts.chaos-mesh.org
helm install chaos-mesh chaos-mesh/chaos-mesh \
  --namespace chaos-testing \
  --create-namespace

# Configure kubectl for staging
aws eks update-kubeconfig --region us-east-1 --name neptunefriend-staging
```

---

## Experiment 1 — Kill a random API pod

**Hypothesis:** With 2+ replicas and HPA, killing one pod should cause zero downtime.

**Expected result:** New pod spins up within 30s, no 5xx errors during the window.

```bash
# Kill one API pod
kubectl delete pod \
  $(kubectl get pods -n neptune-staging -l app=neptunefriend-api \
    -o jsonpath='{.items[0].metadata.name}') \
  -n neptune-staging

# Watch recovery
kubectl get pods -n neptune-staging -w

# Monitor errors during recovery (run in another terminal)
watch -n 5 'curl -s http://localhost:4000/health | jq .status'
```

**Pass criteria:**
- New pod ready within 60 seconds
- Zero 5xx errors during experiment
- HPA maintains minimum replica count

---

## Experiment 2 — Redis cache failure

**Hypothesis:** App degrades gracefully when Redis is unavailable — falls back to live API calls.

```bash
# Scale Redis to 0 replicas (if deployed in K8s)
kubectl scale deployment redis --replicas=0 -n neptune-staging

# Test weather endpoint (should still work, just slower)
curl http://localhost:4000/weather/conditions/<zone-id>

# Check health endpoint shows degraded
curl http://localhost:4000/health

# Restore Redis
kubectl scale deployment redis --replicas=1 -n neptune-staging
```

**Pass criteria:**
- Weather endpoints still return data (from live providers)
- Health endpoint shows `degraded` not `down`
- No 500 errors — only slower responses

---

## Experiment 3 — Weather provider failure

**Hypothesis:** If one weather provider fails, others compensate and data is still returned.

```bash
# Simulate OpenWeather API failure by blocking its domain
# (using a network policy)
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: block-openweather
  namespace: neptune-staging
spec:
  podSelector:
    matchLabels:
      app: neptunefriend-api
  policyTypes:
    - Egress
  egress:
    - ports:
        - protocol: TCP
          port: 443
      to:
        - ipBlock:
            cidr: 0.0.0.0/0
            except:
              - 146.190.0.0/16  # OpenWeather IP range
EOF

# Test — should still return weather from other providers
curl http://localhost:4000/weather/conditions/<solent-zone-id>

# Clean up
kubectl delete networkpolicy block-openweather -n neptune-staging
```

**Pass criteria:**
- Response still returns conditions (from ECMWF + ICON + Open-Meteo)
- ModelBadges shows fewer models but not zero
- Response time may be slightly higher

---

## Experiment 4 — CPU stress test

**Hypothesis:** HPA scales up pods when CPU hits 70%.

```bash
# Deploy a CPU stress pod
kubectl run cpu-stress \
  --image=containerstack/cpustress \
  --restart=Never \
  -n neptune-staging \
  -- --cpu 4 --timeout 120s

# Watch HPA respond
kubectl get hpa -n neptune-staging -w

# Clean up
kubectl delete pod cpu-stress -n neptune-staging
```

**Pass criteria:**
- HPA detects CPU spike within 60 seconds
- Additional pods spawn within 90 seconds
- Pods scale back down within 5 minutes after stress ends

---

## Experiment 5 — Database connection pool exhaustion

**Hypothesis:** API handles DB connection pool exhaustion gracefully.

```bash
# Temporarily lower max connections (edit pool.ts or use env var)
# Then hit the API with concurrent requests
k6 run --vus 50 --duration 30s load-testing/k6-load-test.ts

# Watch for 503 errors vs graceful queuing
```

**Pass criteria:**
- No unhandled crashes
- Returns 503 with meaningful error message
- Pool recovers when load drops

---

## Results Log

| Date | Experiment | Result | Notes |
|------|-----------|--------|-------|
| - | Pod kill | - | Run after EKS setup |
| - | Redis failure | - | Run after Redis deployment |
| - | Provider failure | - | Run in staging |
| - | CPU stress | - | Run after HPA setup |
| - | DB exhaustion | - | Run with k6 |

---

## Rollback Procedures

```bash
# Rollback API deployment
kubectl rollout undo deployment/neptunefriend-api -n neptune-staging

# Rollback web deployment
kubectl rollout undo deployment/neptunefriend-web -n neptune-staging

# Check rollback status
kubectl rollout status deployment/neptunefriend-api -n neptune-staging
```
