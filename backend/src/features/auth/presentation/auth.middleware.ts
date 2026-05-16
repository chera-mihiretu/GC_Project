import type { Request, Response, NextFunction } from "express";
import { getSessionFromHeaders } from "../infrastructure/session-repository.js";
import {
  isAuthenticated,
  hasRole,
  hasAnyRole,
  isBanned,
} from "../use-cases/validate-session.js";
import type { SessionContext } from "../domain/types.js";
import type { UserRole } from "../domain/roles.js";
import { pool } from "../../../config/db.js";

const ACTIVITY_THROTTLE_MS = 5 * 60 * 1000;
const recentlyStamped = new Map<string, number>();

function stampLastActive(userId: string): void {
  const now = Date.now();
  const last = recentlyStamped.get(userId);
  if (last && now - last < ACTIVITY_THROTTLE_MS) return;
  recentlyStamped.set(userId, now);
  pool.query(
    'UPDATE "user" SET "lastActiveAt" = NOW() WHERE id = $1',
    [userId],
  ).catch(() => {});
}

declare global {
  namespace Express {
    interface Request {
      authContext?: SessionContext;
    }
  }
}

export function requireAuth() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const context = await getSessionFromHeaders(
      req.headers as Record<string, string | string[] | undefined>,
    );

    if (!isAuthenticated(context)) {
      res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "No active session" },
      });
      return;
    }

    if (isBanned(context)) {
      res.status(403).json({
        error: { code: "FORBIDDEN", message: "Account is suspended" },
      });
      return;
    }

    req.authContext = context;
    stampLastActive(context.user.id);
    next();
  };
}

export function requireRole(...roles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const context = await getSessionFromHeaders(
      req.headers as Record<string, string | string[] | undefined>,
    );

    if (!isAuthenticated(context)) {
      res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "No active session" },
      });
      return;
    }

    if (isBanned(context)) {
      res.status(403).json({
        error: { code: "FORBIDDEN", message: "Account is suspended" },
      });
      return;
    }

    if (!hasAnyRole(context, roles)) {
      if (roles.includes("vendor" as UserRole)) {
        try {
          const result = await pool.query(
            `SELECT m."organizationId" FROM "member" m WHERE m."userId" = $1 LIMIT 1`,
            [context.user.id],
          );
          if (result.rows.length > 0) {
            req.authContext = context;
            next();
            return;
          }
        } catch {
          // Fall through to forbidden
        }
      }

      res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Insufficient permissions",
        },
      });
      return;
    }

    req.authContext = context;
    next();
  };
}
