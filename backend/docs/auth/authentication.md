# Authentication System — Twedarr Platform

## Overview

Twedarr uses **Better Auth** (self-hosted authentication library) with the **Organization Plugin** and **Admin Plugin** to handle the complete user identity lifecycle. All user data is stored in **PostgreSQL hosted on Neon** (serverless Postgres) — no external identity providers hold core auth data, ensuring full data sovereignty.

Authentication is implemented within the **User Management Subsystem** and serves as the foundation for every other module in the platform.

---

## 1. User Roles

### 1.1 Couple (Personal Role)

| Attribute | Detail |
|-----------|--------|
| **Description** | Primary users — couples and family members planning a wedding |
| **Technology** | Better Auth Standard User |
| **Access Scope** | Full access to their own Wedding Project (budget, checklist, guest list, vendor bookings) |
| **Login Methods** | Email & password, Google OAuth, Apple OAuth |

### 1.2 Vendor (Organization Role)

Vendors are registered as **Organizations** (not individual user accounts) using the Better Auth Organization Plugin. This enables multi-tenancy and internal role separation.

| Sub-Role | Technology | Access Scope |
|----------|------------|-------------|
| **Vendor Owner** | Organization Plugin (Owner) | Full access to Vendor Dashboard — portfolio, pricing, banking info; can invite staff |
| **Vendor Staff / Member** | Organization Plugin (Member) | Read/Write on chat & schedule; Read-only on financial data |

### 1.3 Administrator (System-Wide Role)

| Sub-Role | Technology | Access Scope |
|----------|------------|-------------|
| **Super Admin** | Admin Plugin | Full access to all tables, user management, system configs |
| **Content Moderator** | Admin Plugin (assigned by Super Admin) | Limited administrative privileges |

### 1.4 RBAC Summary Table

| Role | Context | Plugin | Access Scope |
|------|---------|--------|-------------|
| Super Admin | System-wide | Admin Plugin | Full access to all tables, user management, system configs |
| Content Moderator | System-wide | Admin Plugin | Limited admin privileges (assigned by Super Admin) |
| Vendor Owner | Organization | Organization Plugin (Owner) | Full Vendor Dashboard; can invite staff |
| Vendor Staff | Organization | Organization Plugin (Member) | R/W chat & schedule; read-only financial data |
| Couple | Personal | Standard User | Full access to own Wedding Project |

---

## 2. Registration

### 2.1 Unified Registration Endpoint

All users register through a single endpoint. The system collects:
- Basic profile data (name, email/phone, password)
- Role selection: **Couple**, **Vendor**, or **Administrator**

### 2.2 Role-Specific Flows

**Couple:**
- Can register via email/password or social signup (Google / Apple OAuth)
- Email or phone verification is performed post-registration
- Password is hashed immediately (bcrypt or equivalent)
- Role-based permissions are assigned instantly

**Vendor:**
- Registration automatically creates an **Organization** (not a single user account)
- The registrant becomes the **Vendor Owner**
- Vendor Owner can later invite staff members via email
- Business verification (licenses, ID) is required before full activation, but basic authentication is granted at registration

**Administrator:**
- Registered through the same flow
- Super Admin privileges must be assigned by an existing Super Admin

### 2.3 Post-Registration

1. Email/phone verification is sent
2. Password is hashed and stored (never stored in plain text)
3. Role and permissions are assigned in the database
4. User is redirected to their role-specific dashboard

---

## 3. Login Methods

### 3.1 Email & Password (All Roles)

- Password complexity rules are enforced at registration and update
- Passwords are hashed using bcrypt (or equivalent) — never stored in plain text
- Rate limiting is applied to prevent brute-force attacks

### 3.2 Social Login / OAuth (Couples Only)

- **Google OAuth** — one-click signup/login
- **Apple OAuth** — one-click signup/login
- Social login creates or links to an existing Couple account
- No password is required for social-only accounts

### 3.3 Session Management

| Mechanism | Detail |
|-----------|--------|
| **Session type** | Secure, HTTP-only session cookies |
| **Why not JWT in localStorage?** | Prevents XSS attacks commonly associated with client-side token storage |
| **Token handling** | Managed server-side by Better Auth; no client-side JWT exposure |
| **Transport** | All authentication traffic over HTTPS/TLS |

---

## 4. Authentication Flow

```
┌─────────────────────────────────────────────────────┐
│                    User visits app                    │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│         Registration / Login page                    │
│         Select role: Couple / Vendor / Admin         │
└──────────────────────┬──────────────────────────────┘
                       │
            ┌──────────┴──────────┐
            ▼                     ▼
   Email & Password         Social Login
   (all roles)              (Couples only)
            │                     │
            ▼                     ▼
┌─────────────────────────────────────────────────────┐
│         Better Auth validates credentials            │
│         - Hash comparison (email/pass)               │
│         - OAuth token exchange (social)              │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│         Create secure HTTP-only session cookie       │
│         Load role + permissions from PostgreSQL (Neon)│
└──────────────────────┬──────────────────────────────┘
                       │
            ┌──────────┼──────────┬──────────┐
            ▼          ▼          ▼          ▼
         Couple     Vendor     Vendor     Admin
        Dashboard   Owner      Staff    Dashboard
                   Dashboard  Dashboard
```

### Step-by-Step

1. User visits the registration or login page
2. Selects role (Couple / Vendor / Admin)
3. Enters email/phone + password **or** uses social login (Google/Apple)
4. Better Auth validates credentials:
   - Email/password: hash comparison against stored hash
   - Social login: OAuth token exchange with provider
5. On success: secure HTTP-only session cookie is created
6. Role and permissions are loaded from PostgreSQL
7. User is redirected to their **role-specific dashboard**
8. All subsequent API calls include the session cookie for validation
9. RBAC is enforced at the API gateway level and within each subsystem

---

## 5. Authorization (Post-Authentication)

Once authenticated, **strict RBAC** is enforced:

- The User Management Subsystem provides the user's role and permissions to all other subsystems (Vendor Management, Budgeting, Communication, etc.)
- Access is checked at the **API gateway level** and within each subsystem
- **Vendor organizations** use the Organization Plugin for multi-tenancy and internal role separation (Owner vs. Member)
- **Administrators** use the Admin Plugin for system-wide oversight:
  - User suspension and banning
  - Account reactivation
  - Secure impersonation (with full audit logging)

---

## 6. Security Features

| Feature | Implementation |
|---------|---------------|
| OWASP Compliance | Authentication follows OWASP security guidelines |
| Password Storage | Hashed with bcrypt; never stored in plain text |
| Data Encryption | Sensitive data encrypted at rest and in transit (TLS) |
| Session Security | HTTP-only cookies; strict input validation |
| XSS Prevention | No client-side JWT/token exposure |
| Admin Controls | View, suspend, ban, impersonate users (with audit logs) |
| User Appeals | Suspended users can appeal through the platform |
| Transport | All auth traffic over HTTPS/TLS |

---

## 7. Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Authentication Library | Better Auth | Full user identity lifecycle |
| Multi-Tenancy | Better Auth Organization Plugin | Vendor org structure (Owner / Member) |
| Admin Management | Better Auth Admin Plugin | System-wide user oversight |
| Database | PostgreSQL (Neon) | User data, sessions, roles, permissions |
| Social Login | Google OAuth, Apple OAuth | One-click login for Couples |
| Password Hashing | bcrypt | Secure credential storage |
| Session Transport | HTTP-only cookies over HTTPS | Secure session management |

---

## 8. Subsystem Dependencies

The User Management Subsystem (authentication) is consumed by:

- **Vendor Management Subsystem** — verifies vendor identity and org membership
- **Budget & Planning Subsystem** — checks Couple ownership of wedding project
- **Communication Subsystem** — validates chat participants
- **AI Recommendation Subsystem** — reads user preferences tied to identity
- **Payment Subsystem** — confirms identity for financial operations

All subsystems receive the authenticated user's role and permissions via the session cookie validated at the API gateway.
