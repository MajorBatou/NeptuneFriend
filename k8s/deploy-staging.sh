#!/usr/bin/env bash
# Full staging deployment script
set -e

echo "================================================"
echo "  NeptuneFriend — Full Staging Deployment"
echo "================================================"
echo ""

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
  --from-literal=OPENWEATHER_API_KEY=$(grep OPENWEATHER_API_KEY apps/api/.env | cut -d'=' -f2) \
  --from-literal=WORLDTIDES_API_KEY=$(grep WORLDTIDES_API_KEY apps/api/.env | cut -d'=' -f2) \
  --from-literal=METOFFICE_API_KEY=$(grep METOFFICE_API_KEY apps/api/.env | cut -d'=' -f2) \
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

echo "Waiting for migrations to complete..."
sleep 30
kubectl logs migrate -n neptune-staging

echo ""
echo "--- Step 3: Deploying NeptuneFriend ---"
kubectl apply -f k8s/base/deployments/
kubectl apply -f k8s/base/services/

kubectl set image deployment/neptunefriend-api \
  api=ghcr.io/majorbatou/neptunefriend-api:develop \
  -n neptune-staging

kubectl set image deployment/neptunefriend-web \
  web=ghcr.io/majorbatou/neptunefriend-web:develop \
  -n neptune-staging

kubectl set env deployment/neptunefriend-api \
  -n neptune-staging \
  DATABASE_URL="postgresql://neptune:neptune@${POSTGRES_IP}:5432/neptunefriend?sslmode=disable"

echo "Waiting for deployments..."
kubectl wait --for=condition=available deployment/neptunefriend-api -n neptune-staging --timeout=180s
kubectl wait --for=condition=available deployment/neptunefriend-web -n neptune-staging --timeout=180s

echo ""
echo "--- Step 4: Installing Prometheus + Grafana ---"
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.storageSpec.emptyDir.medium="" \
  --set alertmanager.alertmanagerSpec.storage.emptyDir.medium="" \
  --set grafana.persistence.enabled=false \
  --set prometheus.prometheusSpec.resources.requests.memory=256Mi \
  --set prometheus.prometheusSpec.resources.requests.cpu=100m \
  --set alertmanager.alertmanagerSpec.resources.requests.memory=64Mi \
  --set grafana.resources.requests.memory=128Mi \
  --wait \
  --timeout 10m

echo "Applying Prometheus alert rules..."
kubectl apply -f monitoring/prometheus/alert-rules.yaml 2>/dev/null || true
kubectl apply -f slo/slo-rules.yaml 2>/dev/null || true

echo ""
echo "--- Step 5: Installing KEDA ---"
helm repo add kedacore https://kedacore.github.io/charts
helm repo update

helm upgrade --install keda kedacore/keda \
  --namespace keda \
  --create-namespace \
  --values k8s/cluster-essentials/keda/values.yaml \
  --wait \
  --timeout 5m

echo "Applying KEDA ScaledObject..."
kubectl apply -f k8s/cluster-essentials/keda/api-scaledobject.yaml

echo ""
echo "================================================"
echo "  Deployment Complete!"
echo "================================================"
echo ""

WEB_URL=$(kubectl get svc neptunefriend-web -n neptune-staging -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)
API_URL=$(kubectl get svc neptunefriend-api -n neptune-staging -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)

echo "Web URL:  http://$WEB_URL"
echo "API URL:  http://$API_URL:4000/health"
echo ""
echo "Access Grafana:"
echo "  kubectl port-forward svc/kube-prometheus-stack-grafana 3001:80 -n monitoring"
echo "  Open: http://localhost:3001"
echo "  Password: $(kubectl get secret kube-prometheus-stack-grafana -n monitoring -o jsonpath='{.data.admin-password}' 2>/dev/null | base64 --decode)"
echo ""
echo "Access Prometheus:"
echo "  kubectl port-forward svc/kube-prometheus-stack-prometheus 9090:9090 -n monitoring"
echo "  Open: http://localhost:9090"
echo ""
echo "IMPORTANT — To destroy when done:"
echo "  kubectl delete svc --all -n neptune-staging"
echo "  kubectl delete svc --all -n neptune-prod"
echo "  sleep 30"
echo "  cd infra/terraform/environments/staging && terraform destroy"
