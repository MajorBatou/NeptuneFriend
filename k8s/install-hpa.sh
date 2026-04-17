#!/usr/bin/env bash
# Install metrics-server, apply HPA and test autoscaling
# Usage: bash k8s/install-hpa.sh

set -e

echo "Configuring kubectl..."
aws eks update-kubeconfig \
  --region us-east-1 \
  --name neptunefriend-staging

# Step 1 — Install metrics-server
echo "Installing metrics-server..."
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

echo "Waiting for metrics-server..."
kubectl wait --for=condition=ready pod \
  -l k8s-app=metrics-server \
  -n kube-system \
  --timeout=120s

# Step 2 — Verify metrics are working
echo "Verifying metrics..."
sleep 30
kubectl top nodes
kubectl top pods -n neptune-staging

# Step 3 — Apply HPA manifests
echo "Applying HPA..."
kubectl apply -f k8s/base/hpa/api-hpa.yaml
kubectl apply -f k8s/base/hpa/web-hpa.yaml

# Step 4 — Apply PodDisruptionBudgets
echo "Applying PodDisruptionBudgets..."
kubectl apply -f k8s/base/hpa/pdb.yaml

# Step 5 — Install KEDA (optional — for Prometheus-based scaling)
echo ""
read -p "Install KEDA for advanced autoscaling? (y/n): " install_keda
if [ "$install_keda" == "y" ]; then
  helm repo add kedacore https://kedacore.github.io/charts
  helm repo update
  helm upgrade --install keda kedacore/keda \
    --namespace keda \
    --create-namespace \
    --values k8s/cluster-essentials/keda/values.yaml \
    --wait

  echo "Applying KEDA ScaledObject..."
  kubectl apply -f k8s/cluster-essentials/keda/api-scaledobject.yaml
fi

echo ""
echo "HPA and autoscaling configured!"
echo ""
echo "Verify HPA status:"
echo "  kubectl get hpa -n neptune-staging"
echo "  kubectl describe hpa neptunefriend-api-hpa -n neptune-staging"
echo ""
echo "Load test to trigger autoscaling:"
echo "  kubectl run load-test --image=busybox --rm -it -- sh"
echo "  # Inside the pod:"
echo "  # while true; do wget -q -O- http://neptunefriend-api.neptune-staging.svc.cluster.local:4000/health; done"
echo ""
echo "Watch HPA scale in real time:"
echo "  kubectl get hpa -n neptune-staging -w"
