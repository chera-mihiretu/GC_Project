# Progress Log - Twedar Wedding Platform

**Project:** Twedar - Wedding Planning Platform  
**Student:** Tamirat Kebede (kika1s1)  
**Repository:** GC_Project

---

## Progress Tab - Git Commit Log

### Week 1 (Dec 7, 2025) - Project Documentation

| Commit Hash | Date | Component/Pattern | Description |
|-------------|------|-------------------|-------------|
| `bac5626` | Dec 07, 2025 | **Documentation** | Create professional README with project overview and tech stack |

---

### Week 11 (Mar 17, 2026) - Authentication Service Layer

| Commit Hash | Date | Component/Pattern | Description |
|-------------|------|-------------------|-------------|
| `3101ef8` | Mar 17, 2026 | **Service Layer Pattern** | Add `forgetPassword` and `resetPassword` service functions for password recovery flow |

---

### Week 12 (Mar 24-28, 2026) - Password Reset UI Components

| Commit Hash | Date | Component/Pattern | Description |
|-------------|------|-------------------|-------------|
| `0a36193` | Mar 24, 2026 | **Component Design** | Add forget-password page with email reset request form |
| `27fcc8a` | Mar 28, 2026 | **Component Design** | Add reset-password page with token validation |

---

### Week 13 (Mar 31, 2026) - UI Enhancement

| Commit Hash | Date | Component/Pattern | Description |
|-------------|------|-------------------|-------------|
| `f33fbcc` | Mar 31, 2026 | **UI Enhancement** | Add forgot password link to login page |

---

## Summary

| Week | Date | Commits | Focus Area |
|------|------|---------|------------|
| Week 1 | Dec 07, 2025 | 1 | Documentation |
| Week 11 | Mar 17, 2026 | 1 | Auth service functions |
| Week 12 | Mar 24-28, 2026 | 2 | Password reset UI |
| Week 13 | Mar 31, 2026 | 1 | UI enhancement |

**Total Commits:** 5

---

## Design Patterns Practiced

| Pattern | Implementation | Commit |
|---------|---------------|--------|
| **Service Layer** | forgetPassword/resetPassword functions in auth service | `3101ef8` |
| **Component Design** | Forget-password and reset-password React pages | `0a36193`, `27fcc8a` |

---

## Components Built

### Frontend Components
- **Forget Password Page** - Email input form to request password reset link
- **Reset Password Page** - New password form with token validation and confirmation
- **Login Page Enhancement** - Added "Forgot password?" link

### Service Functions
- `forgetPassword(email, redirectTo)` - Sends password reset email
- `resetPassword(token, newPassword)` - Resets password with valid token

---

*Last Updated: April 7, 2026*
