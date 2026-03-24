import type { UserRole, AdminRole } from "./roles.js";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role?: UserRole;
  banned?: boolean;
  banReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
}

export interface SessionContext {
  user: AuthUser;
  session: AuthSession;
}
