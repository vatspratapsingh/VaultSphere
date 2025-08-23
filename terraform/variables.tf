variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "eu-north-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "ssh_public_key" {
  description = "SSH public key for EC2 access"
  type        = string
}

variable "s3_bucket_name" {
  description = "S3 bucket name for frontend hosting"
  type        = string
  default     = "vaultsphere-frontend-2024"
}
