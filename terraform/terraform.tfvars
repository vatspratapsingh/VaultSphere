# Copy this file to terraform.tfvars and customize with your values

# AWS Region (change if needed)
aws_region = "eu-north-1"

# EC2 Instance Type (t3.micro is free tier eligible)
instance_type = "t3.micro"

# Your SSH Public Key (required for EC2 access)
# Generate with: ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
# Then copy the content of ~/.ssh/id_rsa.pub
ssh_public_key = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDENWd9ltgEFwTFpUbnasR2x37Zn7yVdksrWNGu0qY8+F309lwZljTa/zBCBpdDXh7RHXUxEaq6Eb4sbhjIs02ICtnaWAsgLN0XVm0Sp2m4HYEZQ4zHbtGbzcQr3fqXUKPv0ndCgKnkB26kQ72v3YtJ+mKmYnIcnSHQ3NFPZXohx2VBv0Ohq0o7n24lV7jND2ExZ+nGmtvbcwjS9sTwIRBckrgK3W+se7KlUehGCCcTDyOX/1blZUlzoeHtw9tkUe87EloQIRLYFhNXTDsrKl7dVYJVVm3lNfYzIl8IjkBBmsp5P4yctCFJJMWJt3kUqRUMHDvDo2CFvGMcrKl6reNO9VO/0/z6vnwFhljZAOAbm8q1mr8xNMVgDyHgOlECGjNxpgsdhbK9S0n0HP2WKuQ7m/Ci85f8RvySJXPop+T3DEJJv7OhNCYmLWRPlJ6VmSCt48B8inkDu254JOv3Ys0VHvnUXe8BgyriER47tyt9T47AMpGV9o483AYRA59rV+4yPE2ZpU4oO2DanZrlLSqSBq9pECYzC08QnoPIGNIGQPP4qgFmEygD1mmiEx+9eOvWax00/ON8hnFGccjA9M4u9haxlTV1iISvYVx+A809mU0CzVrV+OF/0FNQ1CWjGcCHnUO/7tIo4d8bXg02KJ5+/CIvSolEXft0DQTTi5qd6Q== Vatspratapsingh@MacBook-Air-3.local"

# S3 Bucket Name (must be globally unique)
s3_bucket_name = "vaultsphere-frontend-2024-vats"
