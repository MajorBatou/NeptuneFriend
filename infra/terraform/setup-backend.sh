#!/usr/bin/env bash
# Run this ONCE before terraform init to create the remote state backend
# Usage: ./setup-backend.sh

set -e

BUCKET_NAME="neptunefriend-terraform-state-YOUR_ACCOUNT_ID"
REGION="us-east-1"
TABLE_NAME="neptunefriend-terraform-locks"

echo "Creating S3 bucket for Terraform state..."
aws s3api create-bucket \
  --bucket "$BUCKET_NAME" \
  --region "$REGION"

echo "Enabling versioning on S3 bucket..."
aws s3api put-bucket-versioning \
  --bucket "$BUCKET_NAME" \
  --versioning-configuration Status=Enabled

echo "Enabling server-side encryption..."
aws s3api put-bucket-encryption \
  --bucket "$BUCKET_NAME" \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

echo "Blocking public access on S3 bucket..."
aws s3api put-public-access-block \
  --bucket "$BUCKET_NAME" \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

echo "Creating DynamoDB table for state locking..."
aws dynamodb create-table \
  --table-name "$TABLE_NAME" \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION"

echo ""
echo "Backend setup complete!"
echo "Bucket name: $BUCKET_NAME"
echo ""
echo "Now update the bucket name in:"
echo "  infra/terraform/environments/staging/main.tf"
echo "  infra/terraform/environments/prod/main.tf"
echo ""
echo "Then run: terraform init"
