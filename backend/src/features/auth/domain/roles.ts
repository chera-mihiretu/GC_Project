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

export const AdminRole = {
  SUPER_ADMIN: "admin",
  MODERATOR: "moderator",
} as const;

export type AdminRole = (typeof AdminRole)[keyof typeof AdminRole];
