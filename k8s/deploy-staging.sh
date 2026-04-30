#!/usr/bin/env bash
# Full staging deployment script
set -e

echo "================================================"
echo "  NeptuneFriend — Full Staging Deployment"
echo "================================================"

echo "Configuring kubectl..."
aws eks update-kubeconfig --region us-east-1 --name neptunefriend-staging

echo "Applying namespaces..."
kubectl apply -f k8s/base/namespaces/namespaces.yaml

echo "Creating service accounts..."
kubectl create serviceaccount neptunefriend-api -n neptune-staging --dry-run=client -o yaml | kubectl apply -f -
kubectl create serviceaccount neptunefriend-web -n neptune-staging --dry-run=client -o yaml | kubectl apply -f -

echo "Creating secrets..."
kubectl create secret generic neptunefriend-secrets \
  --from-literal=JWT_SECRET=neptunefriend-staging-jwt-secret \
  --from-literal=OPENWEATHER_API_KEY="$(grep OPENWEATHER_API_KEY apps/api/.env | cut -d'=' -f2)" \
  --from-literal=WORLDTIDES_API_KEY="$(grep WORLDTIDES_API_KEY apps/api/.env | cut -d'=' -f2)" \
  --from-literal=METOFFICE_API_KEY="$(grep METOFFICE_API_KEY apps/api/.env | cut -d'=' -f2)" \
  --from-literal=GOOGLE_CLIENT_ID="$(grep GOOGLE_CLIENT_ID apps/api/.env | cut -d'=' -f2)" \
  --from-literal=GOOGLE_CLIENT_SECRET="$(grep GOOGLE_CLIENT_SECRET apps/api/.env | cut -d'=' -f2)" \
  -n neptune-staging \
  --dry-run=client -o yaml | kubectl apply -f -

echo ""
echo "--- Step 1: Deploying PostgreSQL and Redis ---"
kubectl apply -f k8s/base/database/postgres.yaml
kubectl apply -f k8s/base/database/redis.yaml

echo "Waiting for databases..."
kubectl wait --for=condition=available deployment/postgres -n neptune-staging --timeout=120s
kubectl wait --for=condition=available deployment/redis -n neptune-staging --timeout=60s

echo ""
echo "--- Step 2: Running migrations ---"
kubectl delete pod migrate -n neptune-staging 2>/dev/null || true
POSTGRES_IP=$(kubectl get svc postgres -n neptune-staging -o jsonpath='{.spec.clusterIP}')
kubectl run migrate \
  --image=ghcr.io/majorbatou/neptunefriend-api:develop \
  --restart=Never \
  -n neptune-staging \
  --env="DATABASE_URL=postgresql://neptune:neptune@${POSTGRES_IP}:5432/neptunefriend?sslmode=disable" \
  --env="NODE_ENV=development" \
  -- node apps/api/dist/db/migrate.js
echo "Waiting for migrations..."
sleep 30
kubectl logs migrate -n neptune-staging 2>/dev/null || true

echo ""
echo "--- Step 3: Deploying NeptuneFriend ---"
kubectl apply -f k8s/base/deployments/
kubectl apply -f k8s/base/services/

kubectl set image deployment/neptunefriend-api api=ghcr.io/majorbatou/neptunefriend-api:develop -n neptune-staging
kubectl set image deployment/neptunefriend-web web=ghcr.io/majorbatou/neptunefriend-web:develop -n neptune-staging

kubectl set env deployment/neptunefriend-api -n neptune-staging \
  DATABASE_URL="postgresql://neptune:neptune@${POSTGRES_IP}:5432/neptunefriend?sslmode=disable" \
  GOOGLE_CLIENT_ID="$(grep GOOGLE_CLIENT_ID apps/api/.env | cut -d'=' -f2)" \
  GOOGLE_CLIENT_SECRET="$(grep GOOGLE_CLIENT_SECRET apps/api/.env | cut -d'=' -f2)"

echo "Waiting for API deployment..."
kubectl wait --for=condition=available deployment/neptunefriend-api -n neptune-staging --timeout=180s
kubectl wait --for=condition=available deployment/neptunefriend-web -n neptune-staging --timeout=180s

echo "Setting Google callback URL..."
sleep 30
WEB_URL=$(kubectl get svc neptunefriend-web -n neptune-staging -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)
if [ -n "$WEB_URL" ]; then
  kubectl set env deployment/neptunefriend-api -n neptune-staging \
    GOOGLE_CALLBACK_URL="http://$WEB_URL/auth/google/callback" \
    CORS_ORIGIN="http://$WEB_URL"
  echo "Google callback: http://$WEB_URL/auth/google/callback"
fi

echo ""
echo "--- Step 4: Installing Prometheus (lightweight) ---"
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts 2>/dev/null || true
helm repo update
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace \
  --set prometheus.prometheusSpec.storageSpec.emptyDir.medium="" \
  --set alertmanager.enabled=false \
  --set grafana.enabled=false \
  --set prometheus.prometheusSpec.resources.requests.memory=128Mi \
  --set prometheus.prometheusSpec.resources.limits.memory=384Mi \
  --set prometheus.prometheusSpec.resources.requests.cpu=50m \
  --set kubeStateMetrics.enabled=false \
  --set nodeExporter.enabled=false \
  --wait=false --timeout 10m
echo "Prometheus installing in background..."
sleep 60
kubectl apply -f k8s/base/monitoring/servicemonitor.yaml 2>/dev/null || true

echo ""
echo "--- Step 5: Installing KEDA ---"
helm repo add kedacore https://kedacore.github.io/charts 2>/dev/null || true
helm repo update
helm upgrade --install keda kedacore/keda \
  --namespace keda --create-namespace \
  --values k8s/cluster-essentials/keda/values.yaml \
  --wait=false --timeout 5m
echo "KEDA installing in background..."
sleep 45
kubectl apply -f k8s/cluster-essentials/keda/api-scaledobject.yaml 2>/dev/null || true

echo ""
echo "================================================"
echo "  Deployment Complete!"
echo "================================================"
WEB_URL=$(kubectl get svc neptunefriend-web -n neptune-staging -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)
API_URL=$(kubectl get svc neptunefriend-api -n neptune-staging -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)
echo "Web:  http://$WEB_URL"
echo "API:  http://$API_URL:4000/health"
echo ""
echo "Prometheus: kubectl port-forward svc/kube-prometheus-stack-prometheus 9090:9090 -n monitoring"
echo ""
echo "Add to Google Console authorized redirect URIs:"
echo "  http://$WEB_URL/auth/google/callback"
echo ""
echo "DESTROY when done:"
echo "  kubectl delete svc --all -n neptune-staging && sleep 30"
echo "  cd infra/terraform/environments/staging && terraform destroy"
