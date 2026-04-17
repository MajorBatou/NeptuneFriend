#!/usr/bin/env bash
# Apply RBAC and network policies to all namespaces
# Usage: bash k8s/apply-rbac.sh

set -e

echo "Configuring kubectl..."
aws eks update-kubeconfig \
  --region us-east-1 \
  --name neptunefriend-staging

echo "Applying namespaces with pod security labels..."
kubectl apply -f k8s/base/namespaces/namespaces.yaml

echo "Applying RBAC — service accounts..."
kubectl apply -f k8s/base/rbac/service-accounts.yaml

echo "Applying RBAC — roles and bindings (staging)..."
kubectl apply -f k8s/base/rbac/roles.yaml

echo "Applying RBAC — roles and bindings (prod)..."
kubectl apply -f k8s/prod/rbac.yaml

echo "Applying network policies (staging)..."
kubectl apply -f k8s/base/networkpolicies/default-deny.yaml
kubectl apply -f k8s/base/networkpolicies/allow-traffic.yaml

echo "Applying network policies (prod)..."
kubectl apply -f k8s/prod/networkpolicies.yaml

echo ""
echo "Verifying RBAC..."
kubectl get serviceaccounts -n neptune-staging
kubectl get roles -n neptune-staging
kubectl get rolebindings -n neptune-staging

echo ""
echo "Verifying network policies..."
kubectl get networkpolicies -n neptune-staging
kubectl get networkpolicies -n neptune-prod

echo ""
echo "RBAC and network policies applied successfully!"
echo ""
echo "Test RBAC with:"
echo "  kubectl auth can-i list pods --as=system:serviceaccount:neptune-staging:neptunefriend-deployer -n neptune-staging"
echo "  kubectl auth can-i delete pods --as=system:serviceaccount:neptune-staging:neptunefriend-deployer -n neptune-staging"
