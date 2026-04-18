#!/usr/bin/env bash
# Promote a staging image to production
# Usage: bash k8s/promote.sh <image-tag>
# Example: bash k8s/promote.sh sha-abc1234

set -e

IMAGE_TAG=${1:-latest}
REGISTRY="ghcr.io/majorbatou"
API_IMAGE="${REGISTRY}/neptunefriend-api"
WEB_IMAGE="${REGISTRY}/neptunefriend-web"

echo "Promoting tag: $IMAGE_TAG to production"
echo ""

# Step 1 — Verify images exist in registry
echo "Verifying images exist..."
docker manifest inspect "${API_IMAGE}:${IMAGE_TAG}" > /dev/null 2>&1 || {
  echo "ERROR: ${API_IMAGE}:${IMAGE_TAG} not found in registry"
  exit 1
}
docker manifest inspect "${WEB_IMAGE}:${IMAGE_TAG}" > /dev/null 2>&1 || {
  echo "ERROR: ${WEB_IMAGE}:${IMAGE_TAG} not found in registry"
  exit 1
}
echo "Images verified"

# Step 2 — Configure kubectl for staging first
echo ""
echo "Running smoke tests on staging..."
aws eks update-kubeconfig --region us-east-1 --name neptunefriend-staging

# Check staging is healthy
STAGING_HEALTH=$(kubectl get deployment neptunefriend-api \
  -n neptune-staging \
  -o jsonpath='{.status.readyReplicas}')

if [ "$STAGING_HEALTH" -lt "1" ]; then
  echo "ERROR: Staging API has no ready replicas — aborting promotion"
  exit 1
fi
echo "Staging healthy: ${STAGING_HEALTH} API replicas ready"

# Step 3 — Switch to prod
echo ""
echo "Switching to production cluster..."
aws eks update-kubeconfig --region us-east-1 --name neptunefriend-prod 2>/dev/null || {
  echo "Production cluster not configured — using staging cluster with prod namespace"
}

# Step 4 — Apply prod manifests
echo "Applying production manifests..."
kubectl apply -f k8s/prod/deployments.yaml
kubectl apply -f k8s/prod/services.yaml
kubectl apply -f k8s/prod/rbac.yaml
kubectl apply -f k8s/prod/networkpolicies.yaml
kubectl apply -f k8s/prod/ingress.yaml

# Step 5 — Update image tags
echo ""
echo "Updating image tags to ${IMAGE_TAG}..."
kubectl set image deployment/neptunefriend-api \
  api="${API_IMAGE}:${IMAGE_TAG}" \
  -n neptune-prod

kubectl set image deployment/neptunefriend-web \
  web="${WEB_IMAGE}:${IMAGE_TAG}" \
  -n neptune-prod

# Step 6 — Wait for rollout
echo ""
echo "Waiting for production rollout..."
kubectl rollout status deployment/neptunefriend-api -n neptune-prod --timeout=300s
kubectl rollout status deployment/neptunefriend-web -n neptune-prod --timeout=300s

# Step 7 — Verify
echo ""
echo "Verifying production deployment..."
kubectl get pods -n neptune-prod
kubectl get hpa -n neptune-prod

echo ""
echo "Promotion complete!"
echo "Production API: https://api.neptunefriend.app/health"
echo "Production Web: https://neptunefriend.app"
