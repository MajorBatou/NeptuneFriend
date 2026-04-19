terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }

  backend "s3" {
    bucket         = "neptunefriend-terraform-state-601644128389"
    key            = "neptunefriend/staging/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "neptunefriend-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "neptunefriend"
      Environment = "staging"
      ManagedBy   = "terraform"
    }
  }
}

module "vpc" {
  source = "../../modules/vpc"

  project            = var.project
  environment        = "staging"
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
}

module "eks" {
  source = "../../modules/eks"

  project                     = var.project
  environment                 = "staging"
  cluster_version             = var.eks_cluster_version
  vpc_id                      = module.vpc.vpc_id
  public_subnet_ids           = module.vpc.public_subnet_ids
  private_subnet_ids          = module.vpc.private_subnet_ids
  eks_nodes_security_group_id = module.vpc.eks_nodes_security_group_id
  node_instance_type          = "t3.small"
  node_desired_size           = 2
  node_min_size               = 1
  node_max_size               = 3
}
