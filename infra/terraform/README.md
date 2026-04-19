# NeptuneFriend — Terraform Infrastructure

## Prerequisites

- AWS CLI configured (`aws configure`)
- Terraform >= 1.7.0 installed
- AWS account with AdministratorAccess

## Install Terraform

```bash
# Linux (Ubuntu/Debian)
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform
terraform --version
```

## Step 1 — Create the remote state backend (run once)

```bash
cd infra/terraform

# Get your AWS account ID
aws sts get-caller-identity --query Account --output text

# Edit setup-backend.sh and replace YOUR_ACCOUNT_ID with your actual account ID
# Then run it:
chmod +x setup-backend.sh
./setup-backend.sh
```

## Step 2 — Update bucket name in backend config

Open `environments/staging/main.tf` and replace `YOUR_BUCKET_NAME` with the bucket name printed by setup-backend.sh.

## Step 3 — Initialize and plan

```bash
cd environments/staging
terraform init
terraform plan
```

Review the plan — it will show all resources to be created (VPC, subnets, EKS cluster, node group).

## Step 4 — Apply (provisions real AWS resources)

```bash
terraform apply
```

Type `yes` when prompted. This takes ~15 minutes for EKS.

## Step 5 — Configure kubectl

```bash
aws eks update-kubeconfig \
  --region us-east-1 \
  --name neptunefriend-staging

# Verify cluster access
kubectl get nodes
```

## Directory structure

```
infra/terraform/
├── setup-backend.sh          # Run once to create S3 + DynamoDB backend
├── modules/
│   ├── vpc/                  # VPC, subnets, NAT gateways, security groups
│   ├── eks/                  # EKS cluster + node group + IAM roles
│   └── rds/                  # PostgreSQL RDS (Day 4)
└── environments/
    ├── staging/              # Staging environment config
    └── prod/                 # Production environment config (Day 20)
```

## Cost estimate (staging)

| Resource | Approx cost |
|----------|-------------|
| EKS cluster | ~$0.10/hour |
| 2x t3.medium nodes | ~$0.094/hour each |
| NAT Gateways (3x) | ~$0.045/hour each |
| **Total** | **~$0.42/hour (~$10/day)** |

Use your AWS free credits. Remember to `terraform destroy` when not working on the project to avoid charges.

## Destroy resources (avoid charges)

```bash
cd environments/staging
terraform destroy
```

## EKS Version Policy

Always use the latest stable EKS version. AWS supports N-3 minor versions.
Check current supported versions: https://docs.aws.amazon.com/eks/latest/userguide/kubernetes-versions.html

**Important:** AWS requires upgrading one minor version at a time:
1.29 → 1.30 → 1.31 → 1.32

Update `terraform.tfvars` and apply incrementally.
