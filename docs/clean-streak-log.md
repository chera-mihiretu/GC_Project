# The Clean Streak — Progress & Assessment Log

> **Project:** Twedarr — Ethiopian Wedding Planning Platform  
> **Repository:** [github.com/chera-mihiretu/GC_Project](https://github.com/chera-mihiretu/GC_Project)  
> **Developer:** Chera Mihiretu  
> **Schedule:** Tue — Thu — Sat  
> **University:** Adama Science and Technology University  

---

## Tab 1: Progress — Git Commit Log

### Week 1 — Mar 19 to Mar 22, 2026

| # | Date | Commit Hash | Description | Design Pattern / Component |
|---|------|-------------|-------------|----------------------------|
| 1 | Thu Mar 19 | `2c64b0e` | **feat:** Replace MongoDB with PostgreSQL — migrated the entire data layer from a document database to a relational database hosted on Neon (serverless Postgres) | **Repository Pattern, Database Adapter Pattern** — swapped the persistence layer without altering business logic; demonstrates Dependency Inversion |
| 2 | Sat Mar 21 | `b55d28e` | **feat:** Configure Better Auth with Express, Organization Plugin & Admin Plugin — set up the self-hosted authentication library with multi-tenancy and admin capabilities | **Plugin / Strategy Pattern, Middleware Integration** — Better Auth acts as a pluggable auth strategy; Organization and Admin plugins extend behavior without modifying core auth |

---

### Week 2 — Mar 24 to Mar 28, 2026

| # | Date | Commit Hash | Description | Design Pattern / Component |
|---|------|-------------|-------------|----------------------------|
| 3 | Tue Mar 24 | `d83c60e` | **feat:** Add RBAC middleware with Clean Architecture auth feature — created `domain/`, `use-cases/`, `infrastructure/`, `presentation/` layers for the auth module | **Clean Architecture, Middleware Pattern, Dependency Inversion Principle** — inner layers (domain, use-cases) have zero imports from outer layers; RBAC is enforced via Express middleware |
| 4 | Thu Mar 26 | `9ed68fb` | **feat:** Vendor Organization with custom RBAC and auto-creation — vendor registration auto-creates a Better Auth Organization; registrant becomes Owner | **Factory Pattern, Multi-Tenancy (Organization Pattern)** — Organization is auto-instantiated on vendor signup; Owner/Member roles enforce tenant-level access control |
| 5 | Sat Mar 28 | `be73c86` | **feat:** Set up Better Auth client, TypeScript types, and auth service on frontend — created `auth-client.ts`, `auth.service.ts`, and `types/auth.ts` | **Service Layer Pattern, Client Adapter Pattern** — frontend consumes backend auth API through a typed service layer; auth client abstracts HTTP-only cookie session management |

---

### Week 3 — Mar 31 to Apr 5, 2026

| # | Date | Commit Hash | Description | Design Pattern / Component |
|---|------|-------------|-------------|----------------------------|
| 6 | Tue Mar 31 | `6936c06` | **feat:** Add login, register, and verify-email pages — built auth UI with Next.js App Router route groups `(auth)/` | **Component Composition, Route Group Pattern** — Next.js route groups organize auth pages under a shared layout without affecting URL structure |
| 7 | Thu Apr 02 | `fa547ea` | **feat:** Auth guards, protected routes, and 401 handling — created `AuthGuard` component wrapping role-based dashboard pages | **Guard / Higher-Order Component Pattern** — `AuthGuard` checks session on mount, redirects unauthenticated users; role-based routing to `/dashboard`, `/vendor/dashboard`, `/admin/dashboard` |
| — | Thu Apr 02 | `d60dbeb` | **chore:** Scaffold backend with Clean Architecture directory structure | **Clean Architecture Template** — `features/<name>/{domain, use-cases, infrastructure, presentation}` |
| — | Thu Apr 02 | `df32a9f` | **chore:** Scaffold frontend with Next.js App Router and TypeScript | **App Router Architecture** — `app/`, `components/`, `hooks/`, `services/`, `types/` |
| — | Thu Apr 02 | `cb394c6` | **refactor:** Convert entire backend from JavaScript to TypeScript | **Type Safety Migration** — strict mode TypeScript across all backend modules |
| — | Thu Apr 02 | `47b0c79` | **chore:** Add CI workflow for backend tests and Cursor rules | **CI/CD Pipeline, Development Standards** |
| 8 | Sat Apr 05 | `a2f8488` | **feat:** Migrate auth UI to Tailwind CSS + react-icons — replaced CSS Modules with utility-first approach | **Design System Pattern (Utility-First CSS)** — Tailwind enforces consistent spacing, typography, and color tokens across all auth components |
| — | Sat Apr 05 | `11b1d34` | **feat:** Redesign auth pages with wedding-themed UI | **Theming / UI Component Library** |
| — | Sat Apr 05 | `faa826c` | **chore:** Update database config for Neon serverless Postgres | **Configuration Pattern** — environment-driven database connection with SSL |
| — | Sat Apr 05 | `719af1c` | **fix:** Switch to `@neondatabase/serverless` driver for Neon | **Adapter Pattern** — replaced standard `pg` driver with Neon-specific serverless adapter |

---

### Week 4 — Apr 6 to Apr 11, 2026 (current)

| # | Date | Commit Hash | Description | Design Pattern / Component |
|---|------|-------------|-------------|----------------------------|
| 9 | Mon Apr 06 | `903d721` | **feat:** Add email module with Nodemailer and Better Auth email verification — new Clean Architecture feature under `features/email/` with domain types, infrastructure (transporter), and use-cases (send-email) | **Clean Architecture (new feature module), Dependency Injection** — email transporter is injected into use-cases; domain types define the contract; infrastructure implements it |
| — | Mon Apr 06 | `8a2f641` | **fix:** Correct `toNodeHandler` call signature and update sign-up verification docs | **Adapter Pattern Fix** — Better Auth handler correctly bridges to Express/Node |
| — | Mon Apr 06 | `31546de` | **fix:** Auth flow bugs — verify-email redirect, login session, check-email page | **Bug Fix — Integration Debugging** |
| — | Mon Apr 06 | `47f5044` | **fix:** Redirect verification email link to frontend after backend verification | **Redirect Pattern** — backend verifies token, then 302 redirects to frontend route |
| | Wed Apr 08 | | *(upcoming)* | |
| | Sat Apr 11 | | *(upcoming)* | |

---

## Tab 2: Ideation — System Breakdown & Component Decomposition

### System Overview

Twedarr is a **multi-tenant wedding planning platform** connecting couples with vendors. The system is decomposed into the following subsystems to respect cognitive load — each subsystem is independently developable and has clearly defined boundaries.

### Subsystem Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TWEDARR PLATFORM                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐   ┌──────────────────┐   ┌────────────────┐  │
│  │  1. User Mgmt &  │   │  2. Vendor       │   │  3. Wedding    │  │
│  │  Authentication   │──▶│  Management      │   │  Planning &    │  │
│  │                   │   │                  │   │  Budgeting     │  │
│  │  - Registration   │   │  - Portfolio     │   │                │  │
│  │  - Login/Session  │   │  - Pricing       │   │  - Budget Tool │  │
│  │  - RBAC           │   │  - Staff Mgmt    │   │  - Checklist   │  │
│  │  - Email Verify   │   │  - Banking       │   │  - Guest List  │  │
│  │  - Social OAuth   │   │  - Verification  │   │  - Timeline    │  │
│  └────────┬─────────┘   └────────┬─────────┘   └───────┬────────┘  │
│           │                      │                      │           │
│           ▼                      ▼                      ▼           │
│  ┌──────────────────┐   ┌──────────────────┐   ┌────────────────┐  │
│  │  4. Communication │   │  5. AI           │   │  6. Payment &  │  │
│  │  Subsystem        │   │  Recommendation  │   │  Booking       │  │
│  │                   │   │                  │   │                │  │
│  │  - Real-time Chat │   │  - Vendor Match  │   │  - Deposits    │  │
│  │  - Notifications  │   │  - Budget Advice │   │  - Contracts   │  │
│  │  - Email Alerts   │   │  - Preferences   │   │  - Invoicing   │  │
│  └──────────────────┘   └──────────────────┘   └────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Dependency Flow

All subsystems consume from the **User Management & Authentication** subsystem. The auth module provides session identity, role, and permissions to every other module via HTTP-only session cookies validated at the API gateway.

```
User Mgmt ──▶ Vendor Mgmt (verifies vendor identity & org membership)
User Mgmt ──▶ Wedding Planning (checks Couple ownership of project)
User Mgmt ──▶ Communication (validates chat participants)
User Mgmt ──▶ AI Recommendation (reads user preferences tied to identity)
User Mgmt ──▶ Payment (confirms identity for financial operations)
```

### Role-to-Subsystem Access Matrix

| Subsystem | Couple | Vendor Owner | Vendor Staff | Super Admin | Content Mod |
|-----------|--------|-------------|-------------|-------------|-------------|
| User Mgmt & Auth | Own profile | Own profile + Org | Own profile | Full access | Limited |
| Vendor Management | Browse only | Full CRUD | Read + Chat/Schedule | Full access | Moderate |
| Wedding Planning | Full (own project) | — | — | Full access | Read only |
| Communication | Chat with vendors | Chat with couples | Chat with couples | Monitor | Monitor |
| AI Recommendations | Receive suggestions | Appear in results | — | Configure | — |
| Payment & Booking | Make payments | Receive payments | Read-only financials | Full access | — |

### Frontend Route Architecture (Implemented)

```
app/
├── (auth)/                    # Route group — no URL prefix
│   ├── layout.tsx             # Shared auth layout (centered card)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── verify-email/page.tsx
│   └── check-email/page.tsx
├── (couple)/
│   └── dashboard/page.tsx     # Protected — role: couple
├── (vendor)/
│   └── vendor/dashboard/page.tsx  # Protected — role: vendor
├── (admin)/
│   └── admin/dashboard/page.tsx   # Protected — role: admin
├── layout.tsx                 # Root layout — session check
└── page.tsx                   # Landing page
```

### Figma / Design Interconnection

*(To be populated with Figma design links and screen-to-component mapping as designs are finalized)*

| Screen | Figma Link | Frontend Route | Components Used |
|--------|-----------|----------------|-----------------|
| Login | — | `/login` | AuthLayout, LoginForm, SocialLoginButton |
| Register | — | `/register` | AuthLayout, RegisterForm, RoleSelector |
| Verify Email | — | `/verify-email` | AuthLayout, VerificationStatus |
| Check Email | — | `/check-email` | AuthLayout, EmailPrompt |
| Couple Dashboard | — | `/dashboard` | AuthGuard, DashboardLayout |
| Vendor Dashboard | — | `/vendor/dashboard` | AuthGuard, VendorLayout |
| Admin Dashboard | — | `/admin/dashboard` | AuthGuard, AdminLayout |

---

## Tab 3: Component Model Practice — Architecture Deep Dive

### Clean Architecture Implementation

The backend strictly follows **Clean Architecture** (Robert C. Martin). Each feature is an isolated module with four layers and a strict dependency rule: inner layers never import from outer layers.

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                            │
│         Express Controllers, Routes, Middlewares                │
│         (auth.middleware.ts, routes)                             │
├─────────────────────────────────────────────────────────────────┤
│                    USE-CASES LAYER                               │
│         Application Business Logic, Services                    │
│         (validate-session.ts, send-email.ts)                    │
├─────────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE LAYER                          │
│         PostgreSQL Repositories, External APIs                  │
│         (session-repository.ts, nodemailer-transporter.ts)      │
├─────────────────────────────────────────────────────────────────┤
│                    DOMAIN LAYER                                  │
│         Entities, Types, Interfaces, Business Rules             │
│         (roles.ts, types.ts)                                    │
└─────────────────────────────────────────────────────────────────┘

         ▲ Dependencies point INWARD only ▲
```

### Implemented Feature Modules

#### 1. Auth Feature (`src/features/auth/`)

```
features/auth/
├── domain/
│   ├── roles.ts          # Role enum: couple, vendor, admin
│   └── types.ts          # Session, User, Permission interfaces
├── use-cases/
│   ├── validate-session.ts       # Core logic: validate cookie → return user+role
│   └── validate-session.test.ts  # Unit test for session validation
├── infrastructure/
│   └── session-repository.ts     # Queries PostgreSQL (Neon) for session data
└── presentation/
    └── auth.middleware.ts         # Express middleware: extracts session, enforces RBAC
```

**Dependency Flow:**
```
auth.middleware.ts (Presentation)
    │
    ▼
validate-session.ts (Use Case)
    │
    ▼
session-repository.ts (Infrastructure) ──▶ PostgreSQL (Neon)
    │
    ▼
types.ts, roles.ts (Domain) ◀── Pure types, no external dependencies
```

#### 2. Email Feature (`src/features/email/`)

```
features/email/
├── domain/
│   └── types.ts                          # EmailPayload interface
├── use-cases/
│   ├── send-email.ts                     # Core logic: compose and dispatch email
│   └── send-email.test.ts               # Unit test with mocked transporter
├── infrastructure/
│   └── nodemailer-transporter.ts         # Nodemailer SMTP configuration
│   └── nodemailer-transporter.test.ts    # Integration test for transporter
└── index.ts                              # Module barrel export
```

**Dependency Flow:**
```
Better Auth email hook (Presentation)
    │
    ▼
send-email.ts (Use Case) ◀── receives EmailPayload (Domain type)
    │
    ▼
nodemailer-transporter.ts (Infrastructure) ──▶ SMTP Server
```

### Design Patterns Catalog

| Pattern | Where Applied | Purpose |
|---------|--------------|---------|
| **Clean Architecture** | All backend features (`features/auth/`, `features/email/`) | Isolate business logic from frameworks; enable testability and swappability |
| **Repository Pattern** | `session-repository.ts` | Abstract database access behind an interface; swap PostgreSQL for any data source |
| **Middleware Pattern** | `auth.middleware.ts` | Intercept HTTP requests to validate sessions and enforce RBAC before reaching controllers |
| **Factory Pattern** | Vendor registration flow | Auto-create Organization entity when a vendor registers |
| **Adapter Pattern** | `@neondatabase/serverless` driver, `toNodeHandler()` | Bridge between Better Auth's handler and Express; bridge between Neon's serverless driver and standard pg |
| **Plugin / Strategy Pattern** | Better Auth Organization + Admin plugins | Extend auth behavior (multi-tenancy, admin controls) without modifying core auth logic |
| **Guard Pattern (HOC)** | `auth-guard.tsx` on frontend | Wrap protected pages; check session, redirect if unauthorized |
| **Service Layer Pattern** | `auth.service.ts` on frontend | Centralize all auth API calls behind typed functions consumed by UI components |
| **Dependency Injection** | Email use-case receives transporter | Use-cases don't instantiate infrastructure; they receive it, enabling mock injection in tests |
| **Route Group Pattern** | Next.js `(auth)/`, `(couple)/`, `(vendor)/`, `(admin)/` | Organize routes by concern without affecting URL paths; apply shared layouts per group |

### RBAC Implementation Model

```
Request → Express Middleware (Presentation)
              │
              ├── Extract session cookie
              ├── Call validate-session (Use Case)
              │       │
              │       ├── Query session-repository (Infrastructure)
              │       │       └── PostgreSQL: sessions + users table
              │       │
              │       └── Return { user, role, permissions }
              │
              ├── Check: Does user.role match required role?
              │       ├── YES → next() → Controller handles request
              │       └── NO  → 403 Forbidden
              │
              └── Check: Is session valid / not expired?
                      ├── YES → proceed
                      └── NO  → 401 Unauthorized
```

### Technology Integration Map

| Layer | Technology | Integration Point |
|-------|-----------|-------------------|
| **Runtime** | Node.js + TypeScript (strict) | All backend code |
| **Framework** | Express.js | HTTP routing, middleware pipeline |
| **Auth Library** | Better Auth | Session management, RBAC, Organization multi-tenancy |
| **Database** | PostgreSQL on Neon | User data, sessions, organizations (SSL required) |
| **Email** | Nodemailer | SMTP transport for verification & password reset emails |
| **Frontend** | Next.js (App Router) + React | Server Components, route groups, client auth guard |
| **Styling** | Tailwind CSS | Utility-first design system for auth UI |
| **CI/CD** | GitHub Actions | Automated test runs on backend PRs |

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total feature commits (non-merge) | 15+ |
| Backend feature modules | 2 (auth, email) |
| Frontend pages | 7 (login, register, verify-email, check-email, couple dashboard, vendor dashboard, admin dashboard) |
| Design patterns practiced | 10 |
| Architecture style | Clean Architecture (4-layer) |
| Weeks of active development | 3 complete, Week 4 in progress |
| PR workflow | Feature branch → integration branch → main |
