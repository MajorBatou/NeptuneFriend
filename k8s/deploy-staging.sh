#!/usr/bin/env bash
# Full staging deployment script
set -e

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

echo "Deploying PostgreSQL and Redis..."
kubectl apply -f k8s/base/database/postgres.yaml
kubectl apply -f k8s/base/database/redis.yaml

echo "Waiting for databases..."
kubectl wait --for=condition=available deployment/postgres -n neptune-staging --timeout=120s
kubectl wait --for=condition=available deployment/redis -n neptune-staging --timeout=60s

echo "Running migrations..."
kubectl delete pod migrate -n neptune-staging 2>/dev/null || true

# Get postgres ClusterIP
POSTGRES_IP=$(kubectl get svc postgres -n neptune-staging -o jsonpath='{.spec.clusterIP}')

kubectl run migrate \
  --image=ghcr.io/majorbatou/neptunefriend-api:develop \
  --restart=Never \
  -n neptune-staging \
  --env="DATABASE_URL=postgresql://neptune:neptune@${POSTGRES_IP}:5432/neptunefriend?sslmode=disable" \
  --env="NODE_ENV=development" \
  -- node apps/api/dist/db/migrate.js

echo "Waiting for migrations..."
kubectl wait --for=condition=complete pod/migrate -n neptune-staging --timeout=120s
kubectl logs migrate -n neptune-staging

echo "Deploying NeptuneFriend..."
kubectl apply -f k8s/base/deployments/
kubectl apply -f k8s/base/services/

echo "Updating images to develop tag..."
kubectl set image deployment/neptunefriend-api \
  api=ghcr.io/majorbatou/neptunefriend-api:develop \
  -n neptune-staging

kubectl set image deployment/neptunefriend-web \
  web=ghcr.io/majorbatou/neptunefriend-web:develop \
  -n neptune-staging

echo "Updating database URL with sslmode=disable..."
kubectl set env deployment/neptunefriend-api \
  -n neptune-staging \
  DATABASE_URL="postgresql://neptune:neptune@${POSTGRES_IP}:5432/neptunefriend?sslmode=disable"

echo "Waiting for deployments..."
kubectl wait --for=condition=available deployment/neptunefriend-api -n neptune-staging --timeout=180s
kubectl wait --for=condition=available deployment/neptunefriend-web -n neptune-staging --timeout=180s

echo ""
echo "Getting external URLs..."
API_URL=$(kubectl get svc neptunefriend-api -n neptune-staging -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
WEB_URL=$(kubectl get svc neptunefriend-web -n neptune-staging -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

echo "API URL: http://$API_URL:4000/health"
echo "Web URL: http://$WEB_URL"
echo ""
echo "Deployment complete!"
