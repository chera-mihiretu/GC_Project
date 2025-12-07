<p align="center">
  <img src="https://img.shields.io/badge/💍-TWEDAR-FF69B4?style=for-the-badge&labelColor=white" alt="Twedar Logo" height="60"/>
</p>

<h1 align="center">Twedar</h1>

<p align="center">
  <strong>Your Dream Wedding, One Platform Away</strong>
</p>

<p align="center">
  A modern wedding planning platform connecting couples with trusted vendors. Built with scalability, security, and seamless user experience in mind.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#api-documentation">API Docs</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#team">Team</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue?style=flat-square" alt="Version"/>
  <img src="https://img.shields.io/badge/license-ISC-green?style=flat-square" alt="License"/>
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs Welcome"/>
</p>

---

## Overview

**Twedar** is a comprehensive wedding planning platform developed as a capstone project at Adama Science and Technology University. The platform bridges the gap between couples planning their perfect wedding and vendors offering professional wedding services.

### Platform Roles

| Role | Description |
|------|-------------|
| **Couple** | Manage wedding planning: budget, checklist, guest list, and vendor bookings |
| **Vendor Owner** | Full vendor management: portfolio, pricing, banking, and staff invitations |
| **Vendor Staff** | Limited vendor access: chat, schedule, and read-only financial data |
| **Admin** | System-wide management: users, configurations, and content moderation |

---

## Features

- **Secure Authentication:** Email/password and social login (Google, Apple) with HTTP-only session cookies
- **Email Verification:** Automated verification flow with auto sign-in after confirmation
- **Role-Based Access Control (RBAC):** Granular permissions for Couples, Vendors, and Admins
- **Vendor Organizations:** Multi-tenant vendor accounts with owner/staff hierarchy
- **Staff Invitations:** Vendor owners can invite team members via email
- **Password Recovery:** Secure token-based password reset flow
- **Modern UI:** Wedding-themed responsive design with Tailwind CSS

---

## Tech Stack

### Frontend

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework

### Backend

- **Node.js** - JavaScript runtime
- **Express 5** - Web framework
- **TypeScript 6** - Type-safe JavaScript
- **PostgreSQL** - Relational database

### Infrastructure & Auth

- **Neon** - Serverless PostgreSQL hosting
- **Better Auth 1.5** - Authentication library
- **Jest 30** - Testing framework
- **GitHub Actions** - CI/CD pipeline

---

## Architecture

The backend follows **Clean Architecture** principles with domain-driven feature modules:

```
backend/src/
├── features/
│   ├── auth/                 # Authentication & RBAC
│   │   ├── domain/           # Entities, interfaces
│   │   ├── use-cases/        # Business logic
│   │   ├── infrastructure/   # PostgreSQL repositories
│   │   └── presentation/     # Express controllers, routes
│   └── email/                # Email service (Nodemailer)
├── shared/                   # Cross-cutting concerns
└── server.ts                 # Application entry point
```

The frontend uses **Next.js App Router** with route groups for role-based layouts:

```
frontend/src/app/
├── (auth)/                   # Login, register, verify-email
├── (couple)/                 # Couple dashboard
├── (vendor)/                 # Vendor dashboard
├── (admin)/                  # Admin dashboard
├── layout.tsx                # Root layout
└── page.tsx                  # Landing page
```

---

## Getting Started

### Prerequisites

- **Node.js** v20+
- **PostgreSQL** (or [Neon](https://neon.tech) serverless account)
- **npm** or **yarn**

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/chera-mihiretu/GC_Project.git
cd GC_Project
```

2. **Set up the backend**

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials and secrets
npm install
npm run build
npm run dev
```

3. **Set up the frontend**

```bash
cd frontend
npm install
npm run dev
```

4. **Access the application**

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database (Neon)
DATABASE_URL=postgresql://user:password@endpoint.neon.tech/dbname?sslmode=require

# Better Auth
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3001

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
```

---

## API Documentation

Comprehensive API documentation is available in [`backend/docs/api/`](./backend/docs/api/):

| Module | Documentation |
|--------|---------------|
| Authentication | [`auth.md`](./backend/docs/api/auth.md) |

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create new account |
| `POST` | `/api/auth/login` | Sign in with email/password |
| `GET` | `/api/auth/social/:provider` | OAuth login (Google/Apple) |
| `GET` | `/api/auth/session` | Get current user session |
| `POST` | `/api/auth/logout` | Sign out |
| `POST` | `/api/auth/forget-password` | Request password reset |
| `POST` | `/api/auth/reset-password` | Reset password with token |

---

## Testing

The backend includes comprehensive test coverage using Jest and Supertest:

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

---

## Contributing

We welcome contributions! Please follow our branching strategy:

### Branch Naming

- **Feature branches:** `frontend-<name>` or `backend-<name>`
- **Integration branches:** `main-frontend`, `main-backend`
- **Production:** `main`

### Pull Request Flow

1. Fork the repository
2. Create your feature branch from the appropriate integration branch
3. Ensure all tests pass: `npm test`
4. Submit a PR to the integration branch

---

## Team

<table>
  <tr>
    <td align="center">
      <strong>Chera Mihiretu</strong><br/>
      <sub>Full Stack Developer</sub>
    </td>
    <td align="center">
      <strong>Tamirat Kebede</strong><br/>
      <sub>Developer</sub>
    </td>
    <td align="center">
      <strong>Abdi Esayas</strong><br/>
      <sub>Developer</sub>
    </td>
    <td align="center">
      <strong>Hanamariam Mesfin</strong><br/>
      <sub>Developer</sub>
    </td>
    <td align="center">
      <strong>Sura Takele</strong><br/>
      <sub>Developer</sub>
    </td>
  </tr>
</table>

<p align="center">
  <strong>Adama Science and Technology University</strong><br/>
  <em>Capstone Project 2026</em>
</p>

---

<p align="center">
  Made with ❤️ in Ethiopia
</p>
