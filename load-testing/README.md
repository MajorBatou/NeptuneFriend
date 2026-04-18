# NeptuneFriend Load Testing

Uses [k6](https://k6.io) for load and performance testing.

## Install k6

```bash
# macOS
brew install k6

# Ubuntu
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## Run load tests

```bash
# Local — test against local API
BASE_URL=http://localhost:4000 k6 run load-testing/k6-load-test.ts

# Staging
BASE_URL=https://api.staging.neptunefriend.app k6 run load-testing/k6-load-test.ts

# With output to Prometheus
BASE_URL=http://localhost:4000 k6 run \
  --out experimental-prometheus-rw \
  load-testing/k6-load-test.ts
```

## Interpreting results

| Metric | Target | Alert if |
|--------|--------|---------|
| `http_req_duration p95` | < 500ms | > 500ms |
| `http_req_duration p99` | < 2s | > 2s |
| `http_req_failed` | < 1% | > 1% |
| `weather_latency p95` | < 1s | > 1s |
| `auth_latency p95` | < 500ms | > 500ms |

## Test scenarios

1. **Normal load** — 20 VUs for 5 minutes (ramp up/down included)
2. **Spike test** — sudden jump to 100 VUs for 1 minute

Both run sequentially in the same k6 run.
