# 🌳 NDVI + Majmaah Tree Monitoring System

A comprehensive tree planting impact monitoring system that uses Google Earth Engine satellite imagery to analyze and visualize tree planting projects.

---

## 📋 Overview

This system consists of three main applications:

1. **NDVI Calculator (Admin Tool)** - For running GEE satellite analyses
2. **Majmaah Dashboard (Client View)** - For clients to view their project data
3. **NDVI Backend (API)** - Shared backend serving both frontends

---

## 🚀 Quick Start

### Local Development

#### Prerequisites:
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15 (via Docker)
- Google Earth Engine credentials
- Mapbox access token

#### Start Everything:

```bash
# 1. Start PostgreSQL (Docker)
cd ndvi-calculatorr/server
docker-compose up -d

# 2. Start Backend
cd ndvi-calculatorr/server
npm install
npm start

# 3. Start NDVI Calculator Frontend
cd ndvi-calculatorr/client
npm install
npm run dev

# 4. Start Majmaah Dashboard
cd majmaah-dashboard-react
npm install
npm run dev
```

#### Access Applications:
- **Backend API:** http://localhost:3000/api
- **NDVI Calculator:** http://localhost:5173
- **Majmaah Dashboard:** http://localhost:3001
- **PostgreSQL:** localhost:5432
- **pgAdmin:** http://localhost:5050

See [HOW_TO_RUN_EVERYTHING.md](./HOW_TO_RUN_EVERYTHING.md) for detailed instructions.

---

## ☁️ Production Deployment

### AWS Deployment

This system is designed to run on AWS with automated CI/CD via GitHub Actions.

#### Quick Deploy:

1. **Set up AWS infrastructure** (see [AWS_SETUP.md](./AWS_SETUP.md))
2. **Configure GitHub Secrets** (see [DEPLOYMENT.md](./DEPLOYMENT.md#github-secrets-setup))
3. **Push to main branch** - Automatic deployment!

#### Deployment Guide:

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

#### Infrastructure Setup:

See [AWS_SETUP.md](./AWS_SETUP.md) for AWS infrastructure setup guide.

---

## 📁 Project Structure

```
.
├── ndvi-calculatorr/
│   ├── server/          # Backend API (Node.js + Express)
│   └── client/          # Admin Tool (React)
├── majmaah-dashboard-react/  # Client Dashboard (React)
├── scripts/             # Deployment scripts
├── .github/workflows/   # GitHub Actions CI/CD
└── docs/                # Documentation
```

---

## 🛠️ Technology Stack

### Backend:
- Node.js 18 + Express
- PostgreSQL 15
- Google Earth Engine API
- AWS SDK (Secrets Manager, ECR, S3, CloudFront)

### Frontend:
- React 18/19
- TypeScript
- Vite
- Tailwind CSS
- Mapbox GL
- Recharts

### Infrastructure:
- AWS RDS (PostgreSQL)
- AWS EC2 (Backend)
- AWS ECR (Docker images)
- AWS S3 + CloudFront (Frontends)
- AWS Secrets Manager

---

## 📚 Documentation

- [COMPREHENSIVE_PROJECT_ANALYSIS.md](./COMPREHENSIVE_PROJECT_ANALYSIS.md) - Complete project analysis
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide
- [AWS_SETUP.md](./AWS_SETUP.md) - AWS infrastructure setup
- [HOW_TO_RUN_EVERYTHING.md](./HOW_TO_RUN_EVERYTHING.md) - Local development guide

---

## 🔐 Environment Variables

### Backend (`ndvi-calculatorr/server/.env`):
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ndvi_majmaah_db
DB_USER=postgres
DB_PASSWORD=your-password
GEE_PRIVATE_KEY=your-private-key
GEE_CLIENT_EMAIL=your-email
GEE_PROJECT_ID=your-project-id
JWT_SECRET=your-jwt-secret
CORS_ORIGINS=http://localhost:5173,http://localhost:3001
```

### Frontends:
See `.env.example` files in each frontend directory.

---

## 🧪 Testing

```bash
# Backend
cd ndvi-calculatorr/server
npm test

# Frontends
cd ndvi-calculatorr/client
npm test

cd majmaah-dashboard-react
npm test
```

---

## 📝 License

[Your License Here]

---

## 👥 Contributors

[Your Team/Contributors]

---

## 📞 Support

For issues or questions:
1. Check [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting) troubleshooting section
2. Review GitHub Actions logs
3. Check application logs

---

**Last Updated:** 2024-01-01

