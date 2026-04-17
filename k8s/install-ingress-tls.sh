#!/usr/bin/env bash
# Install NGINX Ingress Controller and cert-manager, configure TLS
# Usage: bash k8s/install-ingress-tls.sh [staging|prod]

set -e

ENVIRONMENT=${1:-staging}
YOUR_EMAIL="YOUR_EMAIL@example.com"  # Replace with your email

echo "Configuring kubectl for $ENVIRONMENT..."
aws eks update-kubeconfig \
  --region us-east-1 \
  --name neptunefriend-staging

# Step 1 — Install NGINX Ingress Controller
echo "Installing NGINX Ingress Controller..."
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --values k8s/cluster-essentials/ingress-nginx/values.yaml \
  --wait

echo "Waiting for LoadBalancer IP..."
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

# Get the LoadBalancer hostname
LB_HOSTNAME=$(kubectl get svc ingress-nginx-controller \
  -n ingress-nginx \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

echo "LoadBalancer hostname: $LB_HOSTNAME"
echo ""
echo "IMPORTANT: Create DNS records pointing to this hostname:"
if [ "$ENVIRONMENT" == "staging" ]; then
  echo "  staging.neptunefriend.app     CNAME  $LB_HOSTNAME"
  echo "  api.staging.neptunefriend.app CNAME  $LB_HOSTNAME"
else
  echo "  neptunefriend.app             CNAME  $LB_HOSTNAME"
  echo "  www.neptunefriend.app         CNAME  $LB_HOSTNAME"
  echo "  api.neptunefriend.app         CNAME  $LB_HOSTNAME"
fi

# Step 2 — Apply security headers ConfigMap
echo ""
echo "Applying security headers..."
kubectl apply -f k8s/cluster-essentials/ingress-nginx/security-headers.yaml

# Step 3 — Install cert-manager
echo "Installing cert-manager..."
helm repo add jetstack https://charts.jetstack.io
helm repo update

helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.14.5 \
  --values k8s/cluster-essentials/cert-manager/values.yaml \
  --wait

echo "Waiting for cert-manager to be ready..."
kubectl wait --namespace cert-manager \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/instance=cert-manager \
  --timeout=120s

# Step 4 — Apply ClusterIssuers
echo "Applying ClusterIssuers..."
# Replace email placeholder
sed "s/YOUR_EMAIL@example.com/$YOUR_EMAIL/g" \
  k8s/cluster-essentials/cert-manager/cluster-issuer.yaml | kubectl apply -f -

# Step 5 — Apply ingress
echo "Applying ingress for $ENVIRONMENT..."
if [ "$ENVIRONMENT" == "staging" ]; then
  kubectl apply -f k8s/staging/ingress.yaml
else
  kubectl apply -f k8s/prod/ingress.yaml
fi

echo ""
echo "Installation complete!"
echo ""
echo "Verify TLS certificate:"
echo "  kubectl get certificate -n neptune-$ENVIRONMENT"
echo "  kubectl describe certificate neptunefriend-${ENVIRONMENT}-tls -n neptune-$ENVIRONMENT"
echo ""
echo "Test HTTPS (after DNS propagation):"
if [ "$ENVIRONMENT" == "staging" ]; then
  echo "  curl -I https://staging.neptunefriend.app/health"
  echo "  curl -I https://api.staging.neptunefriend.app/health"
else
  echo "  curl -I https://neptunefriend.app"
  echo "  curl -I https://api.neptunefriend.app/health"
fi
