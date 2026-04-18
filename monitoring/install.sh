#!/usr/bin/env bash
# Install Prometheus + Grafana monitoring stack
# Usage: bash monitoring/install.sh

set -e

echo "Configuring kubectl..."
aws eks update-kubeconfig --region us-east-1 --name neptunefriend-staging

# Step 1 — Add Helm repos
echo "Adding Helm repositories..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Step 2 — Install kube-prometheus-stack
echo "Installing kube-prometheus-stack..."
helm upgrade --install kube-prometheus-stack \
  prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --values monitoring/prometheus/values.yaml \
  --wait \
  --timeout 10m

# Step 3 — Apply alert rules
echo "Applying alert rules..."
kubectl apply -f monitoring/prometheus/alert-rules.yaml

# Step 4 — Apply alertmanager config
echo "Applying alertmanager config..."
kubectl apply -f monitoring/alertmanager/config.yaml

# Step 5 — Create Grafana dashboards ConfigMap
echo "Creating Grafana dashboards ConfigMap..."
kubectl create configmap neptunefriend-grafana-dashboards \
  --from-file=monitoring/grafana/dashboards/ \
  --namespace monitoring \
  --dry-run=client -o yaml | kubectl apply -f -

echo ""
echo "Monitoring stack installed!"
echo ""
echo "Access Grafana:"
echo "  kubectl port-forward svc/kube-prometheus-stack-grafana 3001:80 -n monitoring"
echo "  Open: http://localhost:3001"
echo "  Username: admin"
echo "  Password: neptune-grafana-admin"
echo ""
echo "Access Prometheus:"
echo "  kubectl port-forward svc/kube-prometheus-stack-prometheus 9090:9090 -n monitoring"
echo "  Open: http://localhost:9090"
echo ""
echo "Test metrics endpoint:"
echo "  curl http://localhost:4000/metrics"
