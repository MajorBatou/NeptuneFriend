# Staging environment variable values
# Replace YOUR_BUCKET_NAME in main.tf backend config with your actual S3 bucket name

aws_region          = "us-east-1"
project             = "neptunefriend"
vpc_cidr            = "10.0.0.0/16"
availability_zones  = ["us-east-1a", "us-east-1b", "us-east-1c"]
eks_cluster_version = "1.31"
