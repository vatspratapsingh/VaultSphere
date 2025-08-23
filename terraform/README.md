# VaultSphere AWS Infrastructure

This Terraform configuration deploys the complete AWS infrastructure for VaultSphere, including EC2 backend server and S3 frontend hosting.

## 🏗️ Infrastructure Components

- **EC2 Instance**: Backend server running Node.js
- **S3 Bucket**: Static frontend hosting
- **VPC**: Custom network with public subnet
- **Security Groups**: Firewall rules for secure access
- **IAM Role**: Permissions for EC2 to access S3

## 📋 Prerequisites

1. **AWS CLI configured** with access keys
2. **Terraform installed** (version >= 1.0)
3. **SSH key pair** for EC2 access
4. **Node.js application** ready for deployment

## 🚀 Quick Start

### 1. Configure Variables

```bash
# Copy the example file
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

**Required variables:**
- `ssh_public_key`: Your SSH public key
- `s3_bucket_name`: Globally unique bucket name

### 2. Initialize Terraform

```bash
cd terraform
terraform init
```

### 3. Review Changes

```bash
terraform plan
```

### 4. Deploy Infrastructure

```bash
terraform apply
```

### 5. Access Your Application

- **Frontend**: `http://your-s3-bucket-name.s3-website-region.amazonaws.com`
- **Backend**: `http://your-ec2-public-ip:5001`

## 🔧 Configuration Details

### EC2 Instance
- **Type**: t2.micro (free tier eligible)
- **OS**: Amazon Linux 2
- **Ports**: 22 (SSH), 5001 (Backend API)
- **Auto-installs**: Node.js, PM2, Git

### S3 Bucket
- **Purpose**: Static website hosting
- **Access**: Public read access
- **CORS**: Enabled for API calls

### Security Groups
- **SSH**: Port 22 from your IP
- **HTTP**: Port 5001 from anywhere
- **HTTPS**: Port 443 (for future SSL)

## 📁 File Structure

```
terraform/
├── main.tf              # Main infrastructure configuration
├── variables.tf         # Variable definitions
├── terraform.tfvars     # Your specific values (create from example)
├── terraform.tfvars.example  # Template file
└── README.md           # This file
```

## 🛠️ Management Commands

### View Resources
```bash
terraform show
```

### Update Infrastructure
```bash
terraform plan    # Review changes
terraform apply   # Apply changes
```

### Destroy Infrastructure
```bash
terraform destroy  # ⚠️ This will delete everything!
```

## 🔍 Troubleshooting

### Common Issues

1. **AMI not found**: Update the AMI ID in `main.tf` for your region
2. **Bucket name taken**: Choose a unique S3 bucket name
3. **SSH connection failed**: Verify your public key is correct
4. **Port 5001 not accessible**: Check security group rules

### Logs and Debugging

```bash
# View Terraform logs
terraform logs

# Check EC2 instance status
aws ec2 describe-instances --instance-ids <instance-id>

# SSH into instance
ssh -i ~/.ssh/id_rsa ec2-user@<public-ip>
```

## 💰 Cost Estimation

- **EC2 t2.micro**: ~$8-10/month (free tier: 750 hours/month)
- **S3 Storage**: ~$0.023/GB/month
- **Data Transfer**: ~$0.09/GB (outbound)

**Total estimated cost**: $8-15/month (varies by usage)

## 🔐 Security Notes

- SSH key authentication only (no passwords)
- Security groups restrict access to necessary ports
- S3 bucket has minimal required permissions
- Consider adding SSL/TLS for production

## 📞 Support

For issues with this infrastructure:
1. Check the troubleshooting section
2. Review AWS CloudWatch logs
3. Verify Terraform state with `terraform show`
