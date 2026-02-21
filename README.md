# Global University America (GUA) - Online University System

![GUA Logo](assets/logo.png)

## 🎓 Project Overview

Global University America (GUA) is a comprehensive online university management system designed to modernize and automate academic operations. The platform provides four distinct portals for different user roles:

- **Public Website**: SEO-optimized landing page with program information
- **Admin Panel**: Full content management and administrative control
- **Student Portal**: Course enrollment, grades, and transcript access
- **Faculty Portal**: Course management, grading, and material uploads

## 🏗️ Architecture

**Modular Monolith Architecture**
- Backend: ASP.NET Core 8 Web API
- Frontend: Next.js 14 (App Router) + Tailwind CSS
- Database: PostgreSQL 16
- Authentication: JWT + Refresh Token
- Deployment: Direct deployment on VDS (no Docker)

## 📁 Project Structure

```
global-university-america/
├── backend/                 # .NET Core 8 Backend
│   ├── GUA.Api/            # API layer
│   ├── GUA.Core/           # Business logic & domain
│   ├── GUA.Infrastructure/ # Data access & services
│   └── GUA.Shared/         # DTOs & constants
│
├── frontend/               # Next.js Frontend
│   ├── apps/
│   │   ├── public-site/    # Public website
│   │   ├── admin-panel/    # Admin dashboard
│   │   ├── student-portal/ # Student portal
│   │   └── faculty-portal/ # Faculty portal
│   └── packages/
│       ├── ui/             # Shared components
│       ├── config/         # Tailwind config
│       └── api-client/     # API utilities
│
├── deployment/             # Deployment configs
├── docs/                   # Documentation
└── assets/                 # Static assets (logos, etc.)
```

## 🎨 Branding

- **Primary Color**: Maroon/Bordo (#8B1A1A, #A52A2A)
- **Accent Colors**: Gold (#D4AF37) or Navy (#1E3A8A)
- **Typography**: Professional, academic aesthetic

## 🚀 Tech Stack

### Backend
- ASP.NET Core 8
- Entity Framework Core 8
- PostgreSQL
- JWT Authentication
- FluentValidation
- Serilog
- MailKit (Brevo SMTP)

### Frontend
- Next.js 14 (App Router)
- Tailwind CSS
- shadcn/ui
- React Hook Form + Zod
- TanStack Query
- Lucide Icons

### DevOps
- Nginx (reverse proxy)
- Let's Encrypt SSL
- systemd services
- Automated PostgreSQL backups

## 📋 Development Phases

### Phase 1: Core Infrastructure & Admin Panel ✅ (In Progress)
- Backend API setup
- Database schema
- Authentication system
- Admin panel with content management

### Phase 2: Public Website (Upcoming)
- SEO-optimized landing pages
- Programs, departments, faculty pages
- Blog and gallery
- Contact and admissions forms

### Phase 3: Student Portal (Upcoming)
- Course enrollment
- Grades viewing
- Transcript access
- Profile management

### Phase 4: Faculty Portal (Upcoming)
- Course management
- Grade entry and publishing
- Course materials upload

### Phase 5: Advanced Features (Upcoming)
- Admissions workflow
- GPA calculation engine
- Transcript PDF generation
- Email notifications (Brevo)

### Phase 6: Deployment & Security (Upcoming)
- VDS deployment
- SSL setup
- Automated backups
- Security hardening

## 🔧 Development Setup

### Prerequisites
- .NET 8 SDK
- Node.js 20+ LTS
- PostgreSQL 16
- Git

### Backend Setup
```bash
cd backend
dotnet restore
dotnet ef database update
dotnet run --project GUA.Api
```

### Frontend Setup
```bash
cd frontend/apps/admin-panel
npm install
npm run dev
```

## 📚 Documentation

- [API Documentation](docs/API.md)
- [Database Schema](docs/DATABASE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## 🔐 Security

- JWT-based authentication
- Role-based authorization (RBAC)
- HTTPS enforcement
- CORS protection
- Input validation
- Audit logging
- Encrypted passwords (BCrypt)

## 📧 Email Integration

- **Service**: Brevo SMTP
- **Free Tier**: 500 emails/day
- **Use Cases**: Application status, password reset, grade notifications

## 🌐 Domain

- **Production**: gua.edu.pl
- **Admin Panel**: gua.edu.pl/admin
- **Student Portal**: gua.edu.pl/student
- **Faculty Portal**: gua.edu.pl/faculty

## 📄 License

Proprietary - Global University America

## 👥 Contributors

- Development Team: Claude Code & User
- University Administration: GUA Team

---

**Status**: 🚧 Active Development - Phase 1 in progress

**Last Updated**: February 2026
