# ProjectPulse

**Client Feedback & Project Health Tracker**

A comprehensive full-stack web application for monitoring project health, client satisfaction, and delivery risks in real-time. Built with Next.js, TypeScript, MongoDB, and Tailwind CSS.

**🌐 Live Demo**: [https://projectpulse-theta.vercel.app/](https://projectpulse-theta.vercel.app/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#️-tech-stack)
- [Features](#-features)
- [Health Score Algorithm](#-health-score-algorithm)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Database Setup](#️-database-setup)
- [Running the Application](#-running-the-application)
- [Demo Credentials](#-demo-credentials)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Backend Choice](#-backend-choice)
- [Demo Video](#-demo-video)
- [Key Implementation Highlights](#-key-implementation-highlights)
- [Developer](#-developer)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)

---

## 🎯 Overview

ProjectPulse is an internal system designed for IT and software companies to track project progress, client satisfaction, and delivery risks. It provides role-based dashboards for Admins, Employees, and Clients, with an automated Project Health Score calculation system.

This project was built as part of an internship assignment over 10 days, demonstrating full-stack development capabilities with modern web technologies and real-world business logic implementation.

**Live Application**: [https://projectpulse-theta.vercel.app/](https://projectpulse-theta.vercel.app/)

**Repository**: [https://github.com/Nafiz001/ProjectPulse](https://github.com/Nafiz001/ProjectPulse)

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **React Context API**

### Backend
- **Next.js API Routes** (Option B - Serverless Functions)
- **MongoDB** (Database)
- **JWT** (Authentication)
- **bcryptjs** (Password Hashing)

---

## ✨ Features

### Role-Based Access Control
- **Admin**: Full system access, project management, team oversight
- **Employee**: Project assignments, weekly check-ins, risk reporting
- **Client**: Project viewing, feedback submission

### Core Features
- **JWT-based authentication** with HTTP-only cookies for security
- **Automated Project Health Score** calculation (0-100 scale)
- **Weekly employee check-in system** with progress tracking
- **Client feedback system** with satisfaction ratings
- **Risk management** with severity levels (Low/Medium/High)
- **Activity timeline tracking** for complete audit trail
- **Three-column admin dashboard** (On Track / At Risk / Critical)
- **Pending check-ins tracker** for employee accountability
- **Responsive, mobile-friendly UI** with Tailwind CSS
- **Real-time health score updates** based on new data

---

## 🧮 Health Score Algorithm

The Project Health Score (0-100) is calculated using a weighted formula:

```
Health Score = (Client Satisfaction × 30%) + 
               (Employee Confidence × 25%) + 
               (Timeline Progress × 25%) + 
               (Risk Factor × 20%)
```

### Components:

**1. Client Satisfaction (30%):**
- Average satisfaction & communication ratings from recent feedback
- Penalty for flagged issues (-10% per issue, max 30%)
- Defaults to 70% if no feedback exists

**2. Employee Confidence (25%):**
- Average confidence levels from recent check-ins (1-5 scale)
- Penalty for declining confidence (-15% for drops)
- Defaults to 70% if no check-ins exist

**3. Timeline Progress (25%):**
- Compares actual vs expected progress
- Scoring: ≥95% = 100%, ≥80% = 80%, ≥60% = 60%, <60% = 40%

**4. Risk Factor (20%):**
- High severity: -25% each
- Medium severity: -15% each
- Low severity: -5% each
- Max penalty: 80%

### Score Interpretation:
- **80-100**: ✅ On Track (Green)
- **60-79**: ⚠️ At Risk (Yellow)
- **0-59**: 🔴 Critical (Red)

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Git

### Steps

```bash
# Clone repository
git clone https://github.com/Nafiz001/ProjectPulse.git
cd ProjectPulse/projectpulse

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Seed database with demo data
npm run seed

# Run development server
npm run dev

# Open http://localhost:3000
```

---

## 🔐 Environment Variables

Create `.env.local`:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/projectpulse
MONGODB_DB_NAME=projectpulse

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Security
BCRYPT_SALT_ROUNDS=10

# Demo Credentials (for seed script)
SEED_ADMIN_EMAIL=admin@projectpulse.com
SEED_ADMIN_PASSWORD=Admin@123
SEED_EMPLOYEE_EMAIL=employee@projectpulse.com
SEED_EMPLOYEE_PASSWORD=Employee@123
SEED_CLIENT_EMAIL=client@projectpulse.com
SEED_CLIENT_PASSWORD=Client@123
```

For MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/projectpulse?retryWrites=true&w=majority
```

---

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)
1. Create free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create cluster and database user
3. Whitelist IP (0.0.0.0/0 for development)
4. Copy connection string to `MONGODB_URI`

### Seed Database
```bash
npm run seed
```

Creates:
- 1 Admin, 2 Employees, 2 Clients
- 3 Sample projects with different health statuses
- Sample check-ins, feedback, risks, and activity logs

---

## 🚀 Running the Application

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Lint code
npm run lint
```

---

## 👥 Demo Credentials

Access the live application at [https://projectpulse-theta.vercel.app/](https://projectpulse-theta.vercel.app/) using these credentials:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@projectpulse.com | Admin123 |
| **Employee** | employee@projectpulse.com | Employee@123 |
| **Client** | client@projectpulse.com | Client@123 |

**Note**: The live demo is pre-seeded with sample data for demonstration purposes.

---

## 📡 API Documentation

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - Get all projects (role-filtered)
- `POST /api/projects` - Create project (Admin only)
- `GET /api/projects/[id]` - Get project with health score
- `PUT /api/projects/[id]` - Update project (Admin only)
- `DELETE /api/projects/[id]` - Delete project (Admin only)

### Check-ins
- `GET /api/checkins?projectId={id}` - Get check-ins
- `POST /api/checkins` - Submit check-in (Employee only)

### Feedback
- `GET /api/feedback?projectId={id}` - Get feedback
- `POST /api/feedback` - Submit feedback (Client only)

### Risks
- `GET /api/risks?projectId={id}` - Get risks
- `POST /api/risks` - Create risk (Employee/Admin)
- `PUT /api/risks/[id]` - Update risk

### Activities
- `GET /api/activities?projectId={id}` - Get activity timeline

### Users
- `GET /api/users?role={role}` - List users (Admin only)

---

## 🌐 Deployment

### Live Application

**Deployed on Vercel**: [https://projectpulse-theta.vercel.app/](https://projectpulse-theta.vercel.app/)

The application is fully deployed and production-ready, using:
- **Vercel** for hosting and continuous deployment
- **MongoDB Atlas** for cloud database
- **Environment variables** for secure configuration
- **Automatic HTTPS** and CDN optimization

### Deploy Your Own Instance

1. **Push to GitHub**
```bash
git push origin main
```

2. **Deploy on Vercel**
- Go to [vercel.com](https://vercel.com)
- Import GitHub repository
- Select `projectpulse` directory as root
- Add environment variables (see below)
- Deploy

3. **Required Environment Variables**
Add these in Vercel dashboard:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/projectpulse
JWT_SECRET=your-super-secret-jwt-key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
BCRYPT_SALT_ROUNDS=10
```

4. **Seed the Database**
After first deployment, run the seed script locally pointing to your production database, or use MongoDB Compass to import sample data.

---

## 📁 Project Structure

```
projectpulse/
├── src/
│   ├── app/
│   │   ├── admin/              # Admin dashboard
│   │   ├── employee/           # Employee dashboard
│   │   ├── client/             # Client dashboard
│   │   ├── login/              # Login page
│   │   └── api/                # API routes
│   ├── components/
│   │   ├── ui/                 # Reusable components
│   │   └── DashboardLayout.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx     # Auth context
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── healthScore.ts      # Health algorithm
│   │   ├── jwt.ts
│   │   ├── mongodb.ts
│   │   └── password.ts
│   └── types/
│       └── index.ts            # TypeScript types
├── scripts/
│   └── seed.ts                 # DB seed script
├── .env.example
├── .env.local
├── package.json
└── README.md
```

---

## 📝 Backend Choice

**This project uses Next.js API Routes (Option B)** as specified in the assignment requirements.

### Why Next.js API Routes?
- ✅ **Serverless architecture** - No server management required
- ✅ **Automatic deployment** with Vercel
- ✅ **Built-in API routing** with file-based structure
- ✅ **Full TypeScript support** for type-safe APIs
- ✅ **Easy environment management** and configuration
- ✅ **Edge-ready** and globally distributed
- ✅ **Unified codebase** - Frontend and backend in one project

This approach provides a modern, scalable solution suitable for production deployment while maintaining simplicity and developer experience.

---

## 🎥 Demo Video

A 5-6 minute demonstration video covers:
1. **Project Overview** - Introduction and tech stack
2. **Role-Based Login** - Admin, Employee, and Client access
3. **Weekly Check-In Process** - Employee submission flow
4. **Health Score Behavior** - Automated calculation logic
5. **Admin Dashboard Insights** - Three-column layout and analytics

[Demo video will be available here]

---

## 📊 Key Implementation Highlights

### 1. **Automated Health Scoring**
- Real-time calculation based on 4 weighted factors
- Updates automatically when check-ins, feedback, or risks change
- Visual categorization (On Track / At Risk / Critical)

### 2. **Role-Based Access Control**
- JWT authentication with HTTP-only cookies
- Middleware-based authorization checks
- Frontend route protection with AuthContext

### 3. **Three-Column Admin Dashboard**
- Innovative visual layout for quick project assessment
- Automatic grouping by health status
- Search and pagination for scalability

### 4. **Pending Check-Ins Tracker**
- Automatically identifies projects needing weekly updates
- Week-based calculation (Sunday to Saturday)
- Ensures employee accountability

### 5. **Production-Ready Code**
- Zero TypeScript compilation errors
- ESLint compliant code
- Type-safe API endpoints
- Comprehensive error handling

---

## 👨‍💻 Developer

**Project**: ProjectPulse - Internship Assignment  
**Timeline**: 10 Days  
**Developer**: Nafiz Rahman  
**GitHub**: [github.com/Nafiz001](https://github.com/Nafiz001)  
**Live Demo**: [projectpulse-theta.vercel.app](https://projectpulse-theta.vercel.app/)

### Assignment Completion
✅ All core features implemented  
✅ Role-based authentication and authorization  
✅ Automated health score calculation  
✅ Three-column admin dashboard  
✅ Weekly check-ins and client feedback  
✅ Risk management system  
✅ Production deployment on Vercel  
✅ Clean, type-safe code with zero errors  
✅ Comprehensive README documentation  

---

## 📄 License

This project was created as an internship assignment to demonstrate full-stack development capabilities.

---

## 🙏 Acknowledgments

- Built with **Next.js 14** App Router
- Styled with **Tailwind CSS**
- Database: **MongoDB Atlas**
- Deployed on **Vercel**

---

**Built with ❤️ for learning and professional growth**

For questions or feedback, please open an issue on [GitHub](https://github.com/Nafiz001/ProjectPulse).
