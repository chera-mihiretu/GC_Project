# Authentication API — Frontend Integration Guide

> **Auth Library:** Better Auth  
> **Base URL:** `/api/auth`  
> **Session:** HTTP-only secure cookies (managed automatically by Better Auth)

---

## Endpoints

### 1. Register — `POST /api/auth/register`

**Description:** Creates a new user account. For Vendors, this also creates an Organization with the registrant as Owner.

**Request Headers:**
| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |

**Request Body:**
```json
{
  "name": "Abebe Kebede",
  "email": "abebe@example.com",
  "password": "SecureP@ss123",
  "role": "couple"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Full name |
| `email` | string | Yes | Email address |
| `password` | string | Yes | Min 8 chars, must include uppercase, lowercase, number, special char |
| `role` | string | Yes | One of: `couple`, `vendor`, `admin` |

**Response — Success (201):**
```json
{
  "user": {
    "id": "usr_abc123",
    "name": "Abebe Kebede",
    "email": "abebe@example.com",
    "role": "couple",
    "emailVerified": false,
    "createdAt": "2026-04-02T10:00:00.000Z"
  }
}
```

**Response — Error (400):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email already registered"
  }
}
```

**Response — Error (422):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Password does not meet complexity requirements"
  }
}
```

---

### 2. Login — `POST /api/auth/login`

**Description:** Authenticates a user with email and password. Sets a secure HTTP-only session cookie on success.

**Request Body:**
```json
{
  "email": "abebe@example.com",
  "password": "SecureP@ss123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Registered email |
| `password` | string | Yes | Account password |

**Response — Success (200):**
```json
{
  "user": {
    "id": "usr_abc123",
    "name": "Abebe Kebede",
    "email": "abebe@example.com",
    "role": "couple",
    "emailVerified": true
  },
  "session": {
    "expiresAt": "2026-04-09T10:00:00.000Z"
  }
}
```

> A secure HTTP-only cookie is automatically set in the response headers. The frontend does **not** need to store or manage tokens.

**Response — Error (401):**
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

---

### 3. Social Login — `GET /api/auth/social/{provider}`

**Description:** Initiates OAuth flow with Google or Apple. Redirects the user to the provider's consent screen. Available for **Couple** role only.

**URL Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `provider` | string | Yes | One of: `google`, `apple` |

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `callbackUrl` | string | No | URL to redirect after successful auth (defaults to `/dashboard`) |

**Example:** `GET /api/auth/social/google?callbackUrl=/dashboard`

**Flow:**
1. Frontend redirects user to this endpoint
2. User is sent to Google/Apple consent screen
3. On approval, user is redirected back to `callbackUrl` with session cookie set

---

### 4. Get Current Session — `GET /api/auth/session`

**Description:** Returns the currently authenticated user's session and profile. Use this to check if a user is logged in and get their role.

**Request Headers:**
| Header | Value |
|--------|-------|
| `Cookie` | Session cookie (sent automatically by browser) |

**Response — Authenticated (200):**
```json
{
  "user": {
    "id": "usr_abc123",
    "name": "Abebe Kebede",
    "email": "abebe@example.com",
    "role": "couple",
    "emailVerified": true
  },
  "session": {
    "expiresAt": "2026-04-09T10:00:00.000Z"
  }
}
```

**Response — Not Authenticated (401):**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No active session"
  }
}
```

---

### 5. Logout — `POST /api/auth/logout`

**Description:** Destroys the current session and clears the session cookie.

**Request Headers:**
| Header | Value |
|--------|-------|
| `Cookie` | Session cookie (sent automatically by browser) |

**Response — Success (200):**
```json
{
  "success": true
}
```

---

### 6. Verify Email — `GET /api/auth/verify-email`

**Description:** Verifies a user's email address using the token from the verification link. A verification email is **automatically sent on sign-up**. If the user tries to sign in without verifying, a `403` is returned and a new verification email is sent automatically.

**Behavior:**
- **Auto-send on sign-up:** A verification email is dispatched when a user registers.
- **Required for sign-in:** Users with unverified email receive `403` on sign-in attempts.
- **Auto sign-in after verification:** After clicking the verification link, the user is automatically signed in and redirected to the `callbackURL`.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | Yes | Verification token from the email link |

**Example:** `GET /api/auth/verify-email?token=abc123def456`

**Response — Success (200):**
The user is redirected to the callback URL with a session cookie set.

**Response — Error (400):**
```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Verification token is invalid or expired"
  }
}
```

---

### 7. Resend Verification Email — `POST /api/auth/send-verification-email`

**Description:** Manually triggers sending a new verification email to the specified address.

**Request Body:**
```json
{
  "email": "abebe@example.com",
  "callbackURL": "/dashboard"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Email address to verify |
| `callbackURL` | string | No | URL to redirect after verification (defaults to `/`) |

**Response — Success (200):**
```json
{
  "success": true
}
```

**Response — Error (400):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email not found"
  }
}
```

---

### 8. Request Password Reset — `POST /api/auth/forget-password`

**Description:** Sends a password reset email to the specified address. The email contains a link with a reset token.

**Request Body:**
```json
{
  "email": "abebe@example.com",
  "redirectTo": "/reset-password"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Registered email address |
| `redirectTo` | string | No | Frontend URL for the reset form (token is appended as query param) |

**Response — Success (200):**
```json
{
  "success": true
}
```

> A password reset email is sent. The response is always `200` to prevent email enumeration.

---

### 9. Reset Password — `POST /api/auth/reset-password`

**Description:** Resets the user's password using the token received via email.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecureP@ss456"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | Yes | Reset token from the email link |
| `newPassword` | string | Yes | New password (same complexity rules as registration) |

**Response — Success (200):**
```json
{
  "success": true
}
```

**Response — Error (400):**
```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Reset token is invalid or expired"
  }
}
```

---

### 10. Invite Vendor Staff — `POST /api/auth/organization/invite`

**Description:** Allows a **Vendor Owner** to invite a staff member to their organization via email.

**Request Headers:**
| Header | Value |
|--------|-------|
| `Cookie` | Session cookie (Vendor Owner must be authenticated) |
| `Content-Type` | `application/json` |

**Request Body:**
```json
{
  "email": "staff@example.com",
  "role": "member"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Email of the person to invite |
| `role` | string | Yes | Organization role: `member` |

**Response — Success (200):**
```json
{
  "success": true,
  "message": "Invitation sent to staff@example.com"
}
```

**Response — Error (403):**
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Only Vendor Owners can invite staff"
  }
}
```

---

## Error Code Reference

| HTTP Status | Code | Meaning |
|-------------|------|---------|
| 400 | `VALIDATION_ERROR` | Invalid input data |
| 400 | `INVALID_TOKEN` | Expired or malformed token |
| 401 | `INVALID_CREDENTIALS` | Wrong email or password |
| 401 | `UNAUTHORIZED` | No active session / not logged in |
| 403 | `FORBIDDEN` | Authenticated but insufficient permissions |
| 403 | `EMAIL_NOT_VERIFIED` | Email not verified (sign-in blocked; verification email re-sent) |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | Duplicate resource (e.g., email already registered) |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |

---

## Frontend Integration Notes

1. **No token management required.** Better Auth uses HTTP-only cookies. The browser sends them automatically with every request.
2. **Check session on app load.** Call `GET /api/auth/session` in your root layout to determine if the user is logged in and which role-specific UI to render.
3. **Redirect by role.** After login, redirect users based on `user.role`:
   - `couple` → `/dashboard`
   - `vendor` → `/vendor/dashboard`
   - `admin` → `/admin/dashboard`
4. **Social login is a redirect.** For Google/Apple login, navigate the browser to `GET /api/auth/social/{provider}` — do not use `fetch()`.
5. **Handle 401 globally.** If any API call returns 401, redirect to the login page.
6. **Handle 403 on sign-in.** A `403` response on sign-in means the user's email is not yet verified. Show a "check your inbox" message. A new verification email is sent automatically.
7. **Auto sign-in after verification.** When the user clicks the verification link, they are automatically signed in and redirected — no manual login step needed.
8. **Password reset flow.** Call `POST /api/auth/forget-password` to trigger a reset email. The `redirectTo` URL receives the reset token as a query param. Submit the new password via `POST /api/auth/reset-password`.
