#!/usr/bin/env bash
# Run this after terraform apply to install cluster essentials
# Usage: bash install-cluster-essentials.sh

set -e

echo "Configuring kubectl..."
aws eks update-kubeconfig \
  --region us-east-1 \
  --name neptunefriend-staging

echo "Verifying cluster connection..."
kubectl get nodes

echo "Creating namespaces..."
kubectl apply -f k8s/base/namespaces/namespaces.yaml

echo "Installing metrics-server..."
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

echo "Waiting for metrics-server to be ready..."
kubectl wait --for=condition=ready pod \
  -l k8s-app=metrics-server \
  -n kube-system \
  --timeout=120s

echo "Installing cert-manager..."
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.5/cert-manager.yaml

echo "Waiting for cert-manager to be ready..."
kubectl wait --for=condition=ready pod \
  -l app.kubernetes.io/instance=cert-manager \
  -n cert-manager \
  --timeout=120s

echo "Installing NGINX Ingress Controller..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/aws/deploy.yaml

echo "Waiting for ingress controller to be ready..."
kubectl wait --for=condition=ready pod \
  -l app.kubernetes.io/component=controller \
  -n ingress-nginx \
  --timeout=120s

echo ""
echo "Cluster essentials installed successfully!"
echo ""
echo "Next steps:"
echo "1. Update YOUR_EMAIL in k8s/cluster-essentials/cert-manager/cluster-issuer.yaml"
echo "2. Apply ClusterIssuers: kubectl apply -f k8s/cluster-essentials/cert-manager/cluster-issuer.yaml"
echo "3. Apply base manifests: kubectl apply -f k8s/base/"
echo ""
echo "Verify everything is running:"
echo "  kubectl get nodes"
echo "  kubectl top nodes"
echo "  kubectl get pods -n cert-manager"
echo "  kubectl get pods -n ingress-nginx"
