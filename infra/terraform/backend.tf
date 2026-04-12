terraform {
  backend "s3" {
    bucket         = "YOUR_BUCKET_NAME"
    key            = "neptunefriend/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "neptunefriend-terraform-locks"
    encrypt        = true
  }
}
