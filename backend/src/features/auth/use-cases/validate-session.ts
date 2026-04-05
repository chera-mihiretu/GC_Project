import type { SessionContext } from "../domain/types.js";
import type { UserRole } from "../domain/roles.js";

export function hasRole(
  context: SessionContext,
  requiredRole: UserRole,
): boolean {
  return context.user.role === requiredRole;
}

export function hasAnyRole(
  context: SessionContext,
  roles: UserRole[],
): boolean {
  return roles.some((role) => context.user.role === role);
}

export function isAuthenticated(
  context: SessionContext | null,
): context is SessionContext {
  return context !== null && !!context.user && !!context.session;
}

export function isBanned(context: SessionContext): boolean {
  return context.user.banned === true;
}
