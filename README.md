# 🏢 VaultSphere - Multi-Tenant SaaS Platform

A complete, production-ready multi-tenant SaaS platform built with modern technologies. This MVP demonstrates a full-stack application with authentication, role-based access control, multi-tenancy, and cloud deployment.

## 🚀 Live Demo

- **Frontend**: [http://vaultsphere-frontend-2024-vats.s3-website.eu-north-1.amazonaws.com](http://vaultsphere-frontend-2024-vats.s3-website.eu-north-1.amazonaws.com)
- **Backend API**: `http://localhost:5001` (running locally)

## 🎯 Features

### ✅ **Complete Multi-Tenant SaaS Platform**
- **Authentication System**: JWT-based login/signup with role-based access
- **Multi-Tenancy**: Isolated data per tenant with secure boundaries
- **Role-Based Dashboards**: Admin, Food Company, and IT Company dashboards
- **Tasks Management**: Full CRUD operations with tenant isolation
- **Responsive Design**: Modern UI with dark theme and beautiful animations
- **Cloud Deployment**: AWS infrastructure with automated CI/CD

### 🔐 **Demo Credentials**

**For Client Role (Select "Client User"):**
- **Food Company**: `eathealthy@gmail.com` / `food123`
- **IT Solutions**: `techsolutions@gmail.com` / `tech123`

**For Administrator Role (Select "System Administrator"):**
- **Admin**: `admin@vaultsphere.com` / `admin123`

## 🛠️ Tech Stack

### **Frontend**
- **React 18** with modern hooks and functional components
- **React Router DOM** for navigation
- **TailwindCSS** for styling and responsive design
- **Lucide React** for beautiful icons
- **Axios** for API communication
- **Recharts** for data visualization

### **Backend**
- **Node.js** with Express.js framework
- **JWT** for secure authentication
- **bcryptjs** for password hashing
- **PostgreSQL** with multi-tenant schema
- **CORS** configured for cross-origin requests

### **Database**
- **PostgreSQL** with proper indexing
- **Multi-tenant schema** with foreign key relationships
- **Demo data** for testing and demonstration

### **Infrastructure**
- **AWS EC2** for backend hosting
- **AWS S3** for frontend static hosting
- **AWS VPC** with security groups
- **Terraform** for Infrastructure as Code
- **GitHub Actions** for CI/CD pipeline

## 📁 Project Structure

```
VaultSphere/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── auth/        # Login/Signup components
│   │   │   ├── dashboards/  # Role-based dashboards
│   │   │   └── TasksDashboard.js
│   │   ├── contexts/        # React contexts
│   │   └── App.js          # Main application
│   └── package.json
├── backend/                  # Express.js server
│   ├── routes/              # API routes
│   ├── config/              # Database configuration
│   ├── database/            # SQL scripts
│   ├── scripts/             # Database initialization
│   └── server.js           # Main server file
├── terraform/               # AWS infrastructure
│   ├── main.tf             # Main Terraform configuration
│   ├── variables.tf        # Variable definitions
│   └── terraform.tfvars    # Variable values
├── scripts/                 # Deployment scripts
├── .github/workflows/       # CI/CD pipeline
└── README.md               # This file
```

## 🚀 Quick Start

### **Prerequisites**
- Node.js 16+ and npm
- PostgreSQL database
- AWS CLI configured
- Git

### **1. Clone the Repository**
```bash
git clone https://github.com/vatspratapsingh/VaultSphere.git
cd VaultSphere
```

### **2. Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run init-db
npm start
```

### **3. Frontend Setup**
```bash
cd frontend
npm install
npm start
```

### **4. Database Setup**
```bash
# Create PostgreSQL database
createdb vaultsphere

# Initialize with demo data
cd backend
npm run init-db
```

## 🌐 Deployment

### **Frontend (AWS S3)**
```bash
cd frontend
npm run build
aws s3 sync build/ s3://your-bucket-name --delete
```

### **Backend (AWS EC2)**
```bash
# Use the deployment script
./scripts/deploy-backend.sh
```

### **Infrastructure (Terraform)**
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## 🔧 API Endpoints

### **Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration

### **Users**
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### **Tenants**
- `GET /api/tenants` - Get all tenants
- `POST /api/tenants` - Create tenant
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

### **Tasks**
- `GET /api/tasks` - Get tasks for current user's tenant
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## 🏗️ Architecture

### **Multi-Tenant Design**
- **Database-level isolation** with tenant_id foreign keys
- **JWT tokens** containing tenant information
- **API-level filtering** to ensure data isolation
- **Role-based access control** for different user types

### **Security Features**
- **JWT authentication** with secure token handling
- **Password hashing** with bcryptjs
- **CORS configuration** for secure cross-origin requests
- **Input validation** and sanitization
- **SQL injection prevention** with parameterized queries

### **Scalability**
- **Modular architecture** for easy scaling
- **Database indexing** for performance
- **Cloud-ready infrastructure** with Terraform
- **CI/CD pipeline** for automated deployments

## 📊 Database Schema

### **Tables**
- **tenants**: Company/organization information
- **users**: User accounts with role and tenant association
- **tasks**: Task management with tenant isolation

### **Relationships**
- Users belong to tenants (many-to-one)
- Tasks belong to tenants (many-to-one)
- Proper foreign key constraints and indexing

## 🧪 Testing

### **Manual Testing**
1. **Authentication**: Test login with demo credentials
2. **Multi-tenancy**: Verify data isolation between tenants
3. **Tasks**: Test CRUD operations for tasks
4. **Role-based access**: Verify different dashboard access

### **API Testing**
```bash
# Test health check
curl http://localhost:5001/api/health

# Test login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vaultsphere.com","password":"admin123"}'
```

## 🔄 CI/CD Pipeline

### **GitHub Actions**
- **Automated testing** on every push
- **Build verification** for frontend and backend
- **Code quality checks** with ESLint
- **Deployment readiness** validation

## 📈 Future Enhancements

### **Planned Features**
- [ ] Real-time notifications
- [ ] File upload functionality
- [ ] Advanced analytics dashboard
- [ ] Email integration
- [ ] Mobile app development
- [ ] Advanced security features (MFA, SSO)

### **Production Improvements**
- [ ] Load balancing with ALB
- [ ] Database read replicas
- [ ] Redis caching layer
- [ ] CDN for static assets
- [ ] Monitoring and logging
- [ ] Automated backups

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Vats Pratap Singh**
- GitHub: [@vatspratapsingh](https://github.com/vatspratapsingh)
- Project: VaultSphere Multi-Tenant SaaS Platform

## 🙏 Acknowledgments

- React team for the amazing framework
- Express.js community for the robust backend framework
- AWS for cloud infrastructure
- TailwindCSS for the beautiful styling framework
- All open-source contributors whose libraries made this possible

---

**⭐ Star this repository if you found it helpful!**

**🚀 Ready for production deployment and user demos!**
