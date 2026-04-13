# NeptuneFriend — Kubernetes Manifests

## Directory structure

```
k8s/
├── install-cluster-essentials.sh   # Run once after terraform apply
├── base/
│   ├── namespaces/                 # neptune-staging, neptune-prod, monitoring
│   ├── deployments/                # API and Web deployments + HPA
│   ├── services/                   # ClusterIP services
│   ├── configmaps/                 # Non-sensitive app config
│   └── secrets/                    # Secret templates (no real values)
├── staging/
│   └── ingress.yaml                # Staging ingress with TLS
├── prod/                           # Production overlays (Day 20)
└── cluster-essentials/
    ├── metrics-server/             # K8s resource metrics
    └── cert-manager/               # TLS certificate management
```

## First time setup

### Step 1 — Bring up the cluster
```bash
cd infra/terraform/environments/staging
terraform apply
```

### Step 2 — Install cluster essentials
```bash
cd neptunefriend
chmod +x k8s/install-cluster-essentials.sh
bash k8s/install-cluster-essentials.sh
```

### Step 3 — Update your email in cert-manager config
Open `k8s/cluster-essentials/cert-manager/cluster-issuer.yaml` and replace `YOUR_EMAIL@example.com` with your real email.

### Step 4 — Apply ClusterIssuers
```bash
kubectl apply -f k8s/cluster-essentials/cert-manager/cluster-issuer.yaml
```

### Step 5 — Create secrets (never commit real values)
```bash
kubectl create secret generic neptunefriend-secrets \
  --from-literal=DATABASE_URL="your_db_url" \
  --from-literal=REDIS_URL="your_redis_url" \
  --from-literal=OPENWEATHER_API_KEY="your_key" \
  --from-literal=JWT_SECRET="your_secret" \
  --namespace=neptune-staging
```

### Step 6 — Apply base manifests
```bash
kubectl apply -f k8s/base/namespaces/
kubectl apply -f k8s/base/configmaps/
kubectl apply -f k8s/base/deployments/
kubectl apply -f k8s/base/services/
kubectl apply -f k8s/staging/
```

### Step 7 — Verify everything is running
```bash
kubectl get pods -n neptune-staging
kubectl get services -n neptune-staging
kubectl get ingress -n neptune-staging
kubectl top nodes
```

## Daily commands

```bash
# Check pod status
kubectl get pods -n neptune-staging

# Check logs
kubectl logs -f deployment/neptunefriend-api -n neptune-staging
kubectl logs -f deployment/neptunefriend-web -n neptune-staging

# Check resource usage
kubectl top pods -n neptune-staging
kubectl top nodes

# Restart a deployment
kubectl rollout restart deployment/neptunefriend-api -n neptune-staging

# Check HPA status
kubectl get hpa -n neptune-staging
```

## Secrets management rule

- Never commit real secret values to git
- Use `kubectl create secret` for manual secrets
- CI/CD pipeline injects secrets from GitHub Actions secrets (Day 3)
- Real values live in AWS Secrets Manager only
