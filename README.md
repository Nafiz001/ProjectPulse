# ProjectPulse

**Client Feedback & Project Health Tracker**

A comprehensive full-stack web application for monitoring project health, client satisfaction, and delivery risks in real-time. Built with Next.js, TypeScript, MongoDB, and Tailwind CSS.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Health Score Algorithm](#health-score-algorithm)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Demo Credentials](#demo-credentials)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)

---

## 🎯 Overview

ProjectPulse is an internal system designed for IT and software companies to track project progress, client satisfaction, and delivery risks. It provides role-based dashboards for Admins, Employees, and Clients, with an automated Project Health Score calculation system.

**Live Demo**: [Add your deployment URL here]

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
- JWT-based authentication with HTTP-only cookies
- Automated Project Health Score calculation
- Weekly employee check-in system
- Client feedback with satisfaction ratings
- Risk management (Low/Medium/High severity)
- Activity timeline tracking
- Responsive, mobile-friendly UI

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

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@projectpulse.com | Admin@123 |
| **Employee** | employee@projectpulse.com | Employee@123 |
| **Client** | client@projectpulse.com | Client@123 |

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

### Vercel Deployment

1. **Push to GitHub**
```bash
git push origin main
```

2. **Deploy on Vercel**
- Go to [vercel.com](https://vercel.com)
- Import GitHub repository
- Select `projectpulse` directory
- Add environment variables
- Deploy

3. **Environment Variables**
Add in Vercel dashboard:
- `MONGODB_URI` (MongoDB Atlas)
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL` (Vercel URL)
- All other variables from `.env.example`

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

**This project uses Next.js API Routes (Option B)** for the backend, providing:
- Serverless architecture
- Automatic deployment with Vercel
- Built-in API routing
- TypeScript support
- Easy environment variable management

---

## 🎥 Demo Video

[Add link to your 5-8 minute demo video here]

Video should cover:
- Project overview
- Role-based login demonstration
- Weekly check-in process
- Health score behavior
- Admin dashboard insights

---

## 🐛 Future Improvements

- Add pagination for project lists
- Implement real-time notifications
- Create detailed project pages
- Add project creation forms
- Build check-in/feedback submission UIs
- Implement comprehensive risk management UI
- Add file attachments
- Email notifications
- Advanced analytics

---

## 👨‍💻 Developer

Created as part of an internship assignment.

GitHub: [Nafiz001](https://github.com/Nafiz001)

---

## 📄 License

Created for educational purposes as part of an internship assignment.

---

**Built with ❤️ using Next.js, TypeScript, MongoDB, and Tailwind CSS**
