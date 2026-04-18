# NeptuneFriend — Service Level Objectives
# These SLOs define the reliability targets for the NeptuneFriend platform

---
## SLO 1 — API Availability

**Service:** NeptuneFriend API
**Target:** 99.9% availability over a 30-day rolling window
**Error budget:** 43.8 minutes/month downtime allowed

### SLI (Service Level Indicator)
```
availability = successful_requests / total_requests

successful_requests = HTTP responses with status != 5xx
total_requests      = all HTTP responses
```

### Prometheus Query
```promql
sum(rate(nginx_ingress_controller_requests{
  namespace="neptune-prod",
  status!~"5.."
}[30d])) /
sum(rate(nginx_ingress_controller_requests{
  namespace="neptune-prod"
}[30d]))
```

### Alert Thresholds
- **Page immediately** if error rate > 1% for 5 minutes (burning budget 7x fast)
- **Warn** if error rate > 0.1% for 1 hour (burning budget at normal rate)

---
## SLO 2 — API Latency

**Service:** NeptuneFriend API
**Target:** 95% of requests complete in < 500ms, 99% in < 2s
**Window:** 30-day rolling

### SLI
```
latency_sli_p95 = histogram_quantile(0.95, request_duration)
latency_sli_p99 = histogram_quantile(0.99, request_duration)
```

### Prometheus Query
```promql
histogram_quantile(0.95,
  sum(rate(nginx_ingress_controller_request_duration_seconds_bucket{
    namespace="neptune-prod"
  }[5m])) by (le)
) < 0.5
```

---
## SLO 3 — Weather Data Freshness

**Service:** Weather conditions cache
**Target:** 99% of zone conditions updated within 10 minutes
**Window:** 24-hour rolling

### SLI
```
freshness = zones_updated_within_10m / total_zones
```

### Why this matters
Stale weather data is a safety issue for sailors. If conditions haven't
updated within 10 minutes, the data may be dangerously outdated.

---
## SLO 4 — Weather Provider Availability

**Service:** Weather model ensemble
**Target:** At least 2 weather models available for each zone at all times
**Window:** 24-hour rolling

### SLI
```
provider_availability = zones_with_2plus_models / total_zones
```

---
## Error Budget Policy

| Budget Remaining | Action |
|-----------------|--------|
| > 50% | Normal operations — deploy freely |
| 25-50% | Slow down deployments — extra review required |
| 10-25% | Freeze non-critical deployments |
| < 10% | Incident response mode — all hands |
| 0% | Full freeze until budget resets |

---
## Error Budget Calculations

### 30-day availability budget (99.9% SLO)
- Total minutes: 43,200
- Allowed downtime: 43.2 minutes
- Per week: ~10 minutes

### Burn rate alerts
- **Fast burn (1h):** Error rate > 14.4x normal → page immediately
- **Slow burn (6h):** Error rate > 6x normal → Slack warning
- **Ticket (3d):** Error rate > 1x normal → create ticket
