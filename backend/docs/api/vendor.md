# Vendor Management API — Frontend Integration Guide

> **Base URL:** `/api/v1`  
> **Session:** HTTP-only secure cookies (sent automatically by browser)

---

## 1. Vendor Profile Endpoints (Vendor-Facing)

All endpoints require authentication as a **vendor** role.

### 1.1 Create Vendor Profile — `POST /api/v1/vendor/profile`

**Auth:** `requireAuth` + `requireRole("vendor")`

**Request Body:**
```json
{
  "businessName": "Addis Catering",
  "category": "catering",
  "description": "Premium Ethiopian catering for weddings",
  "phoneNumber": "+251911234567",
  "location": "Addis Ababa"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `businessName` | string | No | Business display name |
| `category` | string | No | Business category |
| `description` | string | No | Business description |
| `phoneNumber` | string | No | Contact number |
| `location` | string | No | City or area |

**Response — Success (201):**
```json
{
  "vendorProfile": {
    "id": "vp_abc123",
    "userId": "usr_xyz",
    "businessName": "Addis Catering",
    "category": "catering",
    "description": "Premium Ethiopian catering for weddings",
    "phoneNumber": "+251911234567",
    "location": "Addis Ababa",
    "status": "registered",
    "rejectionReason": null,
    "createdAt": "2026-04-07T10:00:00.000Z",
    "updatedAt": "2026-04-07T10:00:00.000Z"
  }
}
```

**Error (409):** Profile already exists for this user.

---

### 1.2 Update Vendor Profile — `PATCH /api/v1/vendor/profile`

**Auth:** `requireAuth` + `requireRole("vendor")`

**Request Body (partial):**
```json
{
  "description": "Updated description",
  "phoneNumber": "+251922345678"
}
```

**Response — Success (200):** Returns updated `vendorProfile`.

**Error (403):** Cannot update while suspended or deactivated.

---

### 1.3 Get Own Vendor Profile — `GET /api/v1/vendor/profile`

**Auth:** `requireAuth` + `requireRole("vendor")`

**Response — Success (200):**
```json
{
  "vendorProfile": {
    "id": "vp_abc123",
    "userId": "usr_xyz",
    "businessName": "Addis Catering",
    "category": "catering",
    "status": "registered",
    "rejectionReason": null,
    "documents": [
      {
        "id": "doc_abc",
        "documentType": "business_license",
        "fileUrl": "/uploads/vendors/1234-uuid.pdf",
        "uploadedAt": "2026-04-07T10:05:00.000Z"
      }
    ],
    "createdAt": "2026-04-07T10:00:00.000Z",
    "updatedAt": "2026-04-07T10:00:00.000Z"
  }
}
```

**Error (404):** No vendor profile found.

---

### 1.4 Upload Document — `POST /api/v1/vendor/documents`

**Auth:** `requireAuth` + `requireRole("vendor")`

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | PDF, JPG, or PNG (max 5MB) |
| `documentType` | string | Yes | `business_license`, `national_id`, or `other` |

**Response — Success (201):**
```json
{
  "document": {
    "id": "doc_abc",
    "vendorProfileId": "vp_abc123",
    "documentType": "business_license",
    "fileUrl": "/uploads/vendors/1234-uuid.pdf",
    "uploadedAt": "2026-04-07T10:05:00.000Z"
  }
}
```

**Error (400):** No file uploaded or missing `documentType`.  
**Error (403):** Cannot upload in suspended, deactivated, or pending_verification status.

---

### 1.5 Delete Document — `DELETE /api/v1/vendor/documents/:documentId`

**Auth:** `requireAuth` + `requireRole("vendor")`

**Response — Success (200):**
```json
{ "success": true }
```

**Error (404):** Document not found or doesn't belong to this vendor.

---

### 1.6 Submit for Verification — `POST /api/v1/vendor/profile/submit`

**Auth:** `requireAuth` + `requireRole("vendor")`

Transitions status from `registered` → `pending_verification` or `rejected` → `pending_verification`.

**Validation:**
- All required fields must be filled: `businessName`, `category`, `phoneNumber`, `location`
- At least one document must be uploaded

**Response — Success (200):**
```json
{
  "vendorProfile": {
    "id": "vp_abc123",
    "status": "pending_verification"
  }
}
```

**Error (400):** Profile incomplete or no documents uploaded.  
**Error (409):** Cannot submit from current status (e.g., already pending or verified).

---

## 2. Admin Vendor Endpoints

All endpoints require authentication as an **admin** role.

### 2.1 List Vendors — `GET /api/v1/admin/vendors`

**Auth:** `requireAuth` + `requireRole("admin")`

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | — | Filter: `registered`, `pending_verification`, `verified`, `rejected`, `suspended`, `deactivated` |
| `category` | string | — | Filter by category |
| `search` | string | — | Search by business name or description |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `sortBy` | string | `createdAt` | Sort: `businessName` or `createdAt` |
| `order` | string | `desc` | `asc` or `desc` |

**Response — Success (200):**
```json
{
  "vendors": [ { "id": "...", "businessName": "...", "status": "pending_verification", ... } ],
  "total": 12,
  "page": 1,
  "limit": 20
}
```

---

### 2.2 Get Vendor Detail — `GET /api/v1/admin/vendors/:vendorId`

**Response (200):** Full vendor profile including documents.

---

### 2.3 Approve Vendor — `POST /api/v1/admin/vendors/:vendorId/approve`

**Transition:** `pending_verification` → `verified`

**Response (200):**
```json
{
  "vendorProfile": { "id": "...", "status": "verified" },
  "message": "Vendor approved successfully"
}
```

---

### 2.4 Reject Vendor — `POST /api/v1/admin/vendors/:vendorId/reject`

**Transition:** `pending_verification` → `rejected`

**Request Body:**
```json
{ "reason": "Business license is expired. Please upload a valid one." }
```

Reason must be at least 10 characters.

---

### 2.5 Suspend Vendor — `POST /api/v1/admin/vendors/:vendorId/suspend`

**Transition:** `verified` → `suspended`

**Request Body:**
```json
{ "reason": "Policy violation: misleading pricing" }
```

---

### 2.6 Reinstate Vendor — `POST /api/v1/admin/vendors/:vendorId/reinstate`

**Transition:** `suspended` → `verified`

---

### 2.7 Deactivate Vendor — `POST /api/v1/admin/vendors/:vendorId/deactivate`

**Transition:** `suspended` → `deactivated` (irreversible)

---

## 3. Public Vendor Endpoints

No authentication required. Only returns `verified` vendors.

### 3.1 List Verified Vendors — `GET /api/v1/vendors`

**Query Parameters:** Same as admin list (except `status` — always `verified`).

### 3.2 Get Vendor Public Profile — `GET /api/v1/vendors/:vendorId`

**Response (200):** Full vendor profile. Returns 404 if vendor is not in `verified` status.

---

## Error Code Reference

| HTTP Status | Meaning |
|-------------|---------|
| 400 | Validation error (incomplete profile, missing reason, bad file) |
| 401 | Not authenticated |
| 403 | Insufficient permissions or status prevents action |
| 404 | Resource not found |
| 409 | Invalid state transition |
| 500 | Server error |

---

## Frontend Integration Notes

1. **File uploads use `multipart/form-data`**, not JSON. Use `FormData` in the browser.
2. **Status drives the entire UI.** Always check `vendorProfile.status` to determine what the vendor can see and do.
3. **Uploaded files are served** from `/uploads/vendors/` as static files.
4. **Rejection reason** is in `vendorProfile.rejectionReason` — display it when status is `rejected`.
5. **Admin actions** return the updated vendor profile so you can update UI state without refetching.
