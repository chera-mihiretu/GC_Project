export const UserRole = {
  COUPLE: "couple",
  VENDOR: "vendor",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const OrgRole = {
  OWNER: "owner",
  MEMBER: "member",
} as const;

export type OrgRole = (typeof OrgRole)[keyof typeof OrgRole];

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role?: UserRole;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
}

export interface SessionData {
  user: AuthUser;
  session: AuthSession;
}

export const ROLE_DASHBOARD_MAP: Record<string, string> = {
  couple: "/dashboard",
  vendor: "/vendor/dashboard",
  admin: "/admin/dashboard",
};
