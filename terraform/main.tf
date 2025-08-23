terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Get latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# VPC for our infrastructure
resource "aws_vpc" "vaultsphere_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vaultsphere-vpc"
  }
}

# Public subnet for our EC2 instance
resource "aws_subnet" "vaultsphere_subnet" {
  vpc_id                  = aws_vpc.vaultsphere_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "vaultsphere-subnet"
  }
}

# Internet Gateway for public access
resource "aws_internet_gateway" "vaultsphere_igw" {
  vpc_id = aws_vpc.vaultsphere_vpc.id

  tags = {
    Name = "vaultsphere-igw"
  }
}

# Route table for internet access
resource "aws_route_table" "vaultsphere_rt" {
  vpc_id = aws_vpc.vaultsphere_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.vaultsphere_igw.id
  }

  tags = {
    Name = "vaultsphere-rt"
  }
}

# Associate route table with subnet
resource "aws_route_table_association" "vaultsphere_rta" {
  subnet_id      = aws_subnet.vaultsphere_subnet.id
  route_table_id = aws_route_table.vaultsphere_rt.id
}

# Security group for backend server
resource "aws_security_group" "backend_sg" {
  name        = "vaultsphere-backend-sg"
  description = "Security group for VaultSphere backend"
  vpc_id      = aws_vpc.vaultsphere_vpc.id

  # SSH access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Backend API access
  ingress {
    from_port   = 5001
    to_port     = 5001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "vaultsphere-backend-sg"
  }
}

# EC2 instance for backend
resource "aws_instance" "backend_server" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.vaultsphere_key.key_name
  vpc_security_group_ids = [aws_security_group.backend_sg.id]
  subnet_id              = aws_subnet.vaultsphere_subnet.id
  associate_public_ip_address = true

  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              curl -fsSL https://rpm.nodesource.com/setup_16.x | bash -
              yum install -y nodejs
              npm install -g pm2
              
              # Create app directory
              mkdir -p /opt/vaultsphere
              cd /opt/vaultsphere
              
              # Clone repository (update with your actual repo)
              # git clone https://github.com/YOUR_USERNAME/VaultSphere.git .
              
              # Install dependencies
              cd backend
              npm install
              
              # Start the application
              pm2 start server.js --name "vaultsphere-backend"
              pm2 startup
              pm2 save
              EOF

  tags = {
    Name = "vaultsphere-backend"
  }
}

# SSH key pair for EC2 access
resource "aws_key_pair" "vaultsphere_key" {
  key_name   = "vaultsphere-key"
  public_key = var.ssh_public_key
}

# S3 bucket for frontend hosting
resource "aws_s3_bucket" "frontend_bucket" {
  bucket = var.s3_bucket_name

  tags = {
    Name = "vaultsphere-frontend"
  }
}

# Configure S3 bucket for public access
resource "aws_s3_bucket_public_access_block" "frontend_bucket" {
  bucket = aws_s3_bucket.frontend_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false

  depends_on = [aws_s3_bucket.frontend_bucket]
}

# S3 bucket policy for public read access
resource "aws_s3_bucket_policy" "frontend_bucket_policy" {
  bucket = aws_s3_bucket.frontend_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend_bucket.arn}/*"
      },
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.frontend_bucket]
}

# Configure S3 bucket for website hosting
resource "aws_s3_bucket_website_configuration" "frontend_bucket" {
  bucket = aws_s3_bucket.frontend_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# Output values
output "backend_public_ip" {
  value = aws_instance.backend_server.public_ip
}

output "frontend_website_endpoint" {
  value = aws_s3_bucket_website_configuration.frontend_bucket.website_endpoint
}

output "frontend_bucket_name" {
  value = aws_s3_bucket.frontend_bucket.bucket
}
