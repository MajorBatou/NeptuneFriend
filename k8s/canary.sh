#!/usr/bin/env bash
# Canary deployment script for NeptuneFriend
#
# Usage:
#   bash k8s/canary.sh deploy <image-tag>    # Deploy canary at 10% traffic
#   bash k8s/canary.sh promote <image-tag>   # Promote canary to 100%
#   bash k8s/canary.sh rollback              # Roll back canary
#   bash k8s/canary.sh status                # Check canary status

set -e

COMMAND=${1:-status}
IMAGE_TAG=${2:-canary}
REGISTRY="ghcr.io/majorbatou"
NAMESPACE="neptune-prod"

echo "NeptuneFriend Canary Deployment"
echo "================================"
echo "Command: $COMMAND"
echo "Tag: $IMAGE_TAG"
echo ""

case "$COMMAND" in

  deploy)
    echo "Deploying canary at 10% traffic..."
    echo ""

    # Tag the image as canary in registry
    echo "Tagging $IMAGE_TAG as canary..."
    docker pull "${REGISTRY}/neptunefriend-api:${IMAGE_TAG}"
    docker tag "${REGISTRY}/neptunefriend-api:${IMAGE_TAG}" \
               "${REGISTRY}/neptunefriend-api:canary"
    docker push "${REGISTRY}/neptunefriend-api:canary"

    docker pull "${REGISTRY}/neptunefriend-web:${IMAGE_TAG}"
    docker tag "${REGISTRY}/neptunefriend-web:${IMAGE_TAG}" \
               "${REGISTRY}/neptunefriend-web:canary"
    docker push "${REGISTRY}/neptunefriend-web:canary"

    # Apply canary manifests
    echo "Applying canary deployments..."
    kubectl apply -f k8s/canary/api-canary.yaml
    kubectl apply -f k8s/canary/web-canary.yaml

    # Wait for canary to be ready
    echo "Waiting for canary pods to be ready..."
    kubectl wait --for=condition=available deployment/neptunefriend-api-canary \
      -n $NAMESPACE --timeout=120s
    kubectl wait --for=condition=available deployment/neptunefriend-web-canary \
      -n $NAMESPACE --timeout=120s

    echo ""
    echo "Canary deployed at 10% traffic!"
    echo ""
    echo "Monitor canary health:"
    echo "  kubectl logs -l version=canary -n $NAMESPACE --tail=20"
    echo "  kubectl get pods -l version=canary -n $NAMESPACE"
    echo ""
    echo "Check error rates in Grafana or:"
    echo "  watch -n 10 'kubectl logs -l version=canary,app=neptunefriend-api -n $NAMESPACE --tail=5'"
    echo ""
    echo "After 30 minutes of clean traffic:"
    echo "  bash k8s/canary.sh promote $IMAGE_TAG"
    echo ""
    echo "If issues detected:"
    echo "  bash k8s/canary.sh rollback"
    ;;

  promote)
    echo "Promoting canary to 100% traffic..."
    echo ""

    # Step 1 — Update stable deployment to new image
    echo "Updating stable API deployment to $IMAGE_TAG..."
    kubectl set image deployment/neptunefriend-api \
      api="${REGISTRY}/neptunefriend-api:${IMAGE_TAG}" \
      -n $NAMESPACE

    echo "Updating stable web deployment to $IMAGE_TAG..."
    kubectl set image deployment/neptunefriend-web \
      web="${REGISTRY}/neptunefriend-web:${IMAGE_TAG}" \
      -n $NAMESPACE

    # Step 2 — Wait for stable rollout
    echo "Waiting for stable rollout..."
    kubectl rollout status deployment/neptunefriend-api -n $NAMESPACE --timeout=300s
    kubectl rollout status deployment/neptunefriend-web -n $NAMESPACE --timeout=300s

    # Step 3 — Remove canary
    echo "Removing canary deployments..."
    kubectl delete -f k8s/canary/api-canary.yaml --ignore-not-found
    kubectl delete -f k8s/canary/web-canary.yaml --ignore-not-found

    echo ""
    echo "Promotion complete! $IMAGE_TAG is now 100% of production traffic."
    kubectl get pods -n $NAMESPACE
    ;;

  rollback)
    echo "Rolling back canary..."
    echo ""

    # Simply remove canary deployments
    kubectl delete -f k8s/canary/api-canary.yaml --ignore-not-found
    kubectl delete -f k8s/canary/web-canary.yaml --ignore-not-found

    echo "Canary removed. 100% of traffic now goes to stable deployment."
    echo ""
    kubectl get pods -n $NAMESPACE
    ;;

  status)
    echo "Canary status:"
    echo ""
    echo "Stable pods:"
    kubectl get pods -l app=neptunefriend-api,version=stable -n $NAMESPACE 2>/dev/null \
      || kubectl get pods -l app=neptunefriend-api -n $NAMESPACE 2>/dev/null \
      || echo "  No stable pods found"

    echo ""
    echo "Canary pods:"
    kubectl get pods -l version=canary -n $NAMESPACE 2>/dev/null \
      || echo "  No canary pods running"

    echo ""
    echo "HPA status:"
    kubectl get hpa -n $NAMESPACE 2>/dev/null || echo "  No HPA found"
    ;;

  *)
    echo "Unknown command: $COMMAND"
    echo "Usage: bash k8s/canary.sh [deploy|promote|rollback|status] [image-tag]"
    exit 1
    ;;
esac
