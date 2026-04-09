# Vendor Management — Issue Tracker & Developer Guide

> **Assignee:** [@abdiesu04](https://github.com/abdiesu04)  
> **Repository:** [chera-mihiretu/GC_Project](https://github.com/chera-mihiretu/GC_Project)  
> **Feature:** Vendor Account Lifecycle (Registration → Verification → Management)

---

## What Is This?

This document describes the **6 GitHub issues** that together implement the vendor management subsystem for Twedarr. The vendor lifecycle covers everything from the moment a vendor signs up to when they are verified by an admin, suspended for violations, or permanently deactivated.

The issues are split across **backend** (4 issues) and **frontend** (2 issues), follow Clean Architecture principles, and are designed to be worked on sequentially within each stack.

---

## The Problem We're Solving

When a vendor signs up on Twedarr today, Better Auth creates their user account and an Organization, but that's where it stops. There is no:

- Way for vendors to complete a business profile
- Document upload for business verification
- Admin review/approval workflow
- Visibility gating (all vendors vs. verified-only)
- Status management (suspend, reinstate, ban)

These 6 issues build that entire pipeline end-to-end.

---

## Vendor Account State Chart

A vendor account moves through 6 states with strictly enforced transitions:

```
                    ┌─────────────┐
     Vendor signs   │             │
     up             │  Registered │
     ──────────────▶│             │
                    └──────┬──────┘
                           │
                  Profile completed
                  Documents uploaded
                           │
                    ┌──────▼──────────────┐
           ┌──────▶│                      │
           │       │ PendingVerification  │
           │       │                      │
           │       └───┬─────────────┬────┘
           │           │             │
           │     Admin approves   Admin rejects
           │           │          (with reason)
           │           │             │
           │    ┌──────▼──────┐  ┌───▼──────┐
           │    │             │  │           │
           │    │  Verified   │  │ Rejected  │──── Resubmit
           │    │             │  │           │     documents
           │    └──┬───────┬──┘  └───────────┘         │
           │       │       │                            │
           │  Policy    Vendor requests                 │
           │  violation   account deletion              │
           │       │       │                            │
           │  ┌────▼────┐  │                            │
           │  │         │  │                            │
           └──│Suspended│  │          ┌─────────────────┘
    Reinstate │         │  │
              └──┬──────┘  │
                 │         │
           Permanent ban   │
                 │         │
              ┌──▼─────────▼──┐
              │               │
              │  Deactivated  │ (terminal — irreversible)
              │               │
              └───────────────┘
```

### State Definitions

| State | What It Means | Vendor Can... | Visible to Couples? |
|-------|---------------|---------------|---------------------|
| **Registered** | Just signed up. Profile incomplete, no documents. | Edit profile, upload documents | No |
| **PendingVerification** | Profile complete, documents submitted. Waiting on admin. | View profile (read-only) | No |
| **Verified** | Admin approved. Fully operational. | Receive bookings, manage business | **Yes** |
| **Rejected** | Admin found issues with documents. Reason provided. | Fix issues, resubmit documents | No |
| **Suspended** | Policy violation detected. Account frozen. | Nothing — all features locked | No |
| **Deactivated** | Permanently closed. Either banned or self-deleted. | Nothing — account is gone | No |

### Valid Transitions (enforced by state machine)

| From | To | Who Triggers It |
|------|----|-----------------|
| `registered` | `pending_verification` | Vendor (submits profile + documents) |
| `pending_verification` | `verified` | Admin (approves) |
| `pending_verification` | `rejected` | Admin (rejects with reason) |
| `rejected` | `pending_verification` | Vendor (resubmits documents) |
| `verified` | `suspended` | Admin (policy violation) |
| `verified` | `deactivated` | Vendor (requests deletion) |
| `suspended` | `verified` | Admin (reinstates) |
| `suspended` | `deactivated` | Admin (permanent ban) |

**Any transition not in this table is invalid and must be rejected.**

---

## Issue Overview

### Dependency Chain

```
Backend:
  #36 (Domain/Schema) ──▶ #37 (Vendor API) ──▶ #39 (Public Listing + Docs)
  #36 (Domain/Schema) ──▶ #38 (Admin API)  ──▶ #39 (Public Listing + Docs)

Frontend:
  #37 (Backend API ready) ──▶ #40 (Vendor Dashboard UI)
  #38 (Backend API ready) ──▶ #41 (Admin Verification Panel)
```

### All Issues at a Glance

| # | Stack | Title | What It Does |
|---|-------|-------|-------------|
| [#36](https://github.com/chera-mihiretu/GC_Project/issues/36) | Backend | **Vendor Profile Domain Layer, Database Schema & Repository** | Foundation: TypeScript types, VendorStatus enum, state machine, PostgreSQL tables (`vendor_profiles`, `vendor_documents`), repository classes |
| [#37](https://github.com/chera-mihiretu/GC_Project/issues/37) | Backend | **Vendor Profile REST API — CRUD + Document Upload** | Vendor-facing endpoints: create/update profile, upload documents, submit for verification. Protected by `requireRole("vendor")` |
| [#38](https://github.com/chera-mihiretu/GC_Project/issues/38) | Backend | **Vendor Verification — Admin Review Endpoints** | Admin-facing endpoints: list vendors by status, approve, reject (with reason), suspend, reinstate, permanently ban. Protected by `requireRole("admin")` |
| [#39](https://github.com/chera-mihiretu/GC_Project/issues/39) | Backend | **Vendor Marketplace Public Listing API + API Documentation** | Public endpoint: search/filter verified vendors. Plus complete `vendor.md` API docs for the frontend team |
| [#40](https://github.com/chera-mihiretu/GC_Project/issues/40) | Frontend | **Vendor Profile Setup & Dashboard UI** | Vendor pages: profile setup wizard, document upload, status-aware dashboard (adapts to registered/pending/verified/rejected/suspended) |
| [#41](https://github.com/chera-mihiretu/GC_Project/issues/41) | Frontend | **Admin Vendor Verification Panel** | Admin pages: vendor management table with status filters, review detail page, approve/reject/suspend/reinstate/ban modals |

---

## Detailed Issue Breakdown

### Issue #36 — Domain Layer, Database Schema & Repository

**The foundation.** Every other issue depends on this one.

**What you build:**
- `VendorProfile` and `VendorDocument` TypeScript interfaces
- `VendorStatus` enum with all 6 states
- A `status-machine.ts` that exports `canTransition(from, to)` and `transition(from, to)` — the single source of truth for valid state changes
- PostgreSQL tables: `vendor_profiles` and `vendor_documents`
- Repository classes that abstract all database operations

**Key files to create:**
```
backend/src/features/vendor/
├── domain/
│   ├── types.ts              # VendorProfile, VendorDocument, VendorStatus
│   └── status-machine.ts     # State transition validation logic
└── infrastructure/
    ├── vendor-profile.repository.ts
    └── vendor-document.repository.ts
```

**Database schema:**
- `vendor_profiles` — id, user_id (FK to Better Auth `user` table), business_name, category, description, phone_number, location, status (default: `registered`), rejection_reason, created_at, updated_at
- `vendor_documents` — id, vendor_profile_id (FK), document_type (business_license / national_id / other), file_url, uploaded_at

**Tests required:** Unit tests for state machine (all valid transitions pass, all invalid transitions throw).

---

### Issue #37 — Vendor Profile REST API

**Vendor-facing CRUD.** This is what the vendor interacts with.

**Endpoints:**

| Method | Path | What It Does |
|--------|------|-------------|
| `POST` | `/api/v1/vendor/profile` | Create vendor profile (business info) |
| `PATCH` | `/api/v1/vendor/profile` | Update profile fields |
| `GET` | `/api/v1/vendor/profile` | Get own profile + documents + status |
| `POST` | `/api/v1/vendor/documents` | Upload a document (multipart/form-data) |
| `DELETE` | `/api/v1/vendor/documents/:id` | Delete a document |
| `POST` | `/api/v1/vendor/profile/submit` | Submit for verification (registered/rejected → pending_verification) |

All endpoints require `requireAuth()` + `requireRole("vendor")`.

**Key files to create:**
```
backend/src/features/vendor/
├── use-cases/
│   ├── create-vendor-profile.ts
│   ├── update-vendor-profile.ts
│   ├── get-vendor-profile.ts
│   ├── upload-document.ts
│   ├── delete-document.ts
│   └── submit-for-verification.ts
└── presentation/
    ├── vendor.routes.ts
    └── vendor.controller.ts
```

**Existing middleware to use:** `requireAuth()` and `requireRole()` from `backend/src/features/auth/presentation/auth.middleware.ts`.

---

### Issue #38 — Admin Vendor Verification Endpoints

**The admin review pipeline.** Admins approve, reject, suspend, reinstate, or ban vendors.

**Endpoints:**

| Method | Path | What It Does |
|--------|------|-------------|
| `GET` | `/api/v1/admin/vendors` | List vendors with status filter + pagination |
| `GET` | `/api/v1/admin/vendors/:id` | Get full vendor detail (profile + documents) |
| `POST` | `/api/v1/admin/vendors/:id/approve` | Approve (pending_verification → verified) |
| `POST` | `/api/v1/admin/vendors/:id/reject` | Reject with reason (pending_verification → rejected) |
| `POST` | `/api/v1/admin/vendors/:id/suspend` | Suspend with reason (verified → suspended) |
| `POST` | `/api/v1/admin/vendors/:id/reinstate` | Reinstate (suspended → verified) |
| `POST` | `/api/v1/admin/vendors/:id/deactivate` | Permanent ban (suspended → deactivated) |

All endpoints require `requireAuth()` + `requireRole("admin")`.

**State transition enforcement:** Every action use-case must call `canTransition()` from the domain state machine before modifying the status. If the transition is invalid, return `409 Conflict`.

**Key files to create:**
```
backend/src/features/vendor/
├── use-cases/
│   ├── list-vendors-admin.ts
│   ├── get-vendor-detail-admin.ts
│   ├── approve-vendor.ts
│   ├── reject-vendor.ts
│   ├── suspend-vendor.ts
│   ├── reinstate-vendor.ts
│   └── deactivate-vendor.ts
└── presentation/
    ├── admin-vendor.routes.ts
    └── admin-vendor.controller.ts
```

---

### Issue #39 — Public Listing API + Documentation

**Two deliverables:** a public search endpoint and the complete API docs.

**Endpoints:**

| Method | Path | Auth | What It Does |
|--------|------|------|-------------|
| `GET` | `/api/v1/vendors` | None (public) | Search/filter verified vendors |
| `GET` | `/api/v1/vendors/:id` | None (public) | Get single verified vendor profile |

Only vendors with `status = 'verified'` are returned. All other statuses are hidden.

**API Documentation:** Create `backend/docs/api/vendor.md` documenting every endpoint from issues #37, #38, and #39 following the same format as the existing `backend/docs/api/auth.md`.

---

### Issue #40 — Vendor Profile Setup & Dashboard UI

**The vendor experience.** Two pages:

1. **`/vendor/dashboard`** — Status-aware landing page:
   - `registered` → prompt to complete profile
   - `pending_verification` → "Under Review" banner, read-only profile
   - `verified` → full dashboard with edit option
   - `rejected` → rejection reason banner + "Resubmit" button
   - `suspended` → "Account Suspended" banner, everything locked

2. **`/vendor/profile/setup`** — Profile setup wizard:
   - Business info form (name, category, description, phone, location)
   - Document upload with preview
   - Submit for verification button

**Key files to create:**
```
frontend/src/
├── app/(vendor)/vendor/
│   ├── dashboard/page.tsx
│   └── profile/setup/page.tsx
├── components/vendor/
│   ├── vendor-status-banner.tsx
│   ├── vendor-profile-form.tsx
│   ├── document-upload.tsx
│   └── vendor-setup-wizard.tsx
├── services/
│   └── vendor.service.ts
└── types/
    └── vendor.ts
```

---

### Issue #41 — Admin Vendor Verification Panel

**The admin experience.** Two pages:

1. **`/admin/vendors`** — Vendor management list:
   - Table with columns: business name, category, status badge, date
   - Filter by status (tabs or dropdown)
   - Search by name/email
   - Pagination

2. **`/admin/vendors/[id]`** — Vendor review detail:
   - Full profile + uploaded documents (with preview/download)
   - Context-dependent action buttons (approve/reject/suspend/reinstate/ban)
   - Modals for rejection reason and suspension reason
   - Irreversibility warning for permanent ban

**Key files to create:**
```
frontend/src/
├── app/(admin)/admin/vendors/
│   ├── page.tsx
│   └── [id]/page.tsx
├── components/admin/
│   ├── vendor-table.tsx
│   ├── vendor-status-badge.tsx
│   ├── vendor-review-card.tsx
│   ├── document-viewer.tsx
│   ├── rejection-modal.tsx
│   ├── suspend-modal.tsx
│   └── confirm-dialog.tsx
└── services/
    └── admin-vendor.service.ts
```

---

## Branch & PR Rules

| Stack | Branch Name | Created From | PR Target |
|-------|------------|-------------|-----------|
| Backend | `backend-abdiesu04` | `main-backend` | `backend-abdiesu04` → `main-backend` |
| Frontend | `frontend-abdiesu04` | `main-frontend` | `frontend-abdiesu04` → `main-frontend` |

**Rules:**
- Never push directly to `main`, `main-backend`, or `main-frontend`
- All PRs must compile cleanly with `npm run build` (zero TypeScript errors)
- Backend PRs must include unit tests and update `backend/docs/api/vendor.md`
- Frontend PRs must have no hydration errors or ESLint warnings
- Follow Clean Architecture: domain and use-case layers must never import from infrastructure or presentation
- Use the existing `requireAuth()` and `requireRole()` middleware from `backend/src/features/auth/presentation/auth.middleware.ts`
- Use the existing `AuthGuard` component from `frontend/src/components/auth-guard.tsx` for protected pages

---

## Existing Code You'll Work With

These files already exist and are relevant to the vendor feature:

| File | What It Provides |
|------|-----------------|
| `backend/src/features/auth/domain/roles.ts` | `UserRole` enum (`couple`, `vendor`, `admin`) and `OrgRole` enum (`owner`, `member`) |
| `backend/src/features/auth/presentation/auth.middleware.ts` | `requireAuth()` and `requireRole()` Express middleware |
| `backend/src/features/auth/domain/types.ts` | `SessionContext` type attached to `req.authContext` |
| `backend/src/config/db.ts` | PostgreSQL connection pool (Neon) — use this for queries |
| `backend/src/lib/auth.ts` | Better Auth instance with Organization + Admin plugins |
| `frontend/src/components/auth-guard.tsx` | `AuthGuard` component for role-based route protection |
| `frontend/src/lib/auth-client.ts` | Better Auth client with `useSession()` hook |
| `frontend/src/services/auth.service.ts` | Auth API client functions |
| `backend/docs/api/auth.md` | Example of the API documentation format to follow |

---

## Recommended Work Order

```
Week 1:  #36 (Domain + Schema) → #37 (Vendor CRUD API)
Week 2:  #38 (Admin API) → #39 (Public Listing + Docs)
Week 3:  #40 (Vendor Dashboard UI) → #41 (Admin Panel UI)
```

Each issue builds on the previous one. Start with #36 — it's the foundation everything else depends on.
