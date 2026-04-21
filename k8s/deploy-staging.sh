#!/usr/bin/env bash
# Full staging deployment script
set -e

echo "Configuring kubectl..."
aws eks update-kubeconfig --region us-east-1 --name neptunefriend-staging

echo "Applying namespaces..."
kubectl apply -f k8s/base/namespaces/namespaces.yaml

echo "Creating secrets..."
kubectl create secret generic neptunefriend-secrets \
  --from-literal=JWT_SECRET=neptunefriend-staging-jwt-secret \
  --from-literal=OPENWEATHER_API_KEY=$(grep OPENWEATHER_API_KEY apps/api/.env | cut -d'=' -f2) \
  --from-literal=WORLDTIDES_API_KEY=$(grep WORLDTIDES_API_KEY apps/api/.env | cut -d'=' -f2) \
  --from-literal=METOFFICE_API_KEY=$(grep METOFFICE_API_KEY apps/api/.env | cut -d'=' -f2) \
  -n neptune-staging \
  --dry-run=client -o yaml | kubectl apply -f -

echo "Deploying PostgreSQL and Redis..."
kubectl apply -f k8s/base/database/postgres.yaml
kubectl apply -f k8s/base/database/redis.yaml

echo "Waiting for databases..."
kubectl wait --for=condition=available deployment/postgres -n neptune-staging --timeout=120s
kubectl wait --for=condition=available deployment/redis -n neptune-staging --timeout=60s

echo "Running migrations..."
kubectl run migrate \
  --image=ghcr.io/majorbatou/neptunefriend-api:develop \
  --restart=Never \
  --rm \
  -n neptune-staging \
  --env="DATABASE_URL=postgresql://neptune:neptune@postgres:5432/neptunefriend" \
  --command -- node apps/api/dist/db/migrate.js

echo "Deploying NeptuneFriend..."
kubectl apply -f k8s/base/deployments/
kubectl apply -f k8s/base/services/

echo "Waiting for deployments..."
kubectl wait --for=condition=available deployment/neptunefriend-api -n neptune-staging --timeout=180s
kubectl wait --for=condition=available deployment/neptunefriend-web -n neptune-staging --timeout=180s

echo ""
echo "Getting external URLs..."
echo "API URL:"
kubectl get svc neptunefriend-api -n neptune-staging -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
echo ""
echo "Web URL:"
kubectl get svc neptunefriend-web -n neptune-staging -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
echo ""
echo "Deployment complete!"
