import type { Request, Response, NextFunction } from "express";
import { pool } from "../../../config/db.js";

/**
 * Middleware that resolves the vendor organization owner for the current user.
 * For owners: vendorOwnerId = their own id.
 * For staff (org members): vendorOwnerId = the org owner's user id.
 * Must run after requireAuth().
 */
export function resolveVendorContext() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.authContext?.user.id;
    if (!userId) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "No active session" } });
      return;
    }

    try {
      const memberResult = await pool.query(
        `SELECT m."organizationId", m.role
         FROM "member" m
         WHERE m."userId" = $1
         LIMIT 1`,
        [userId],
      );

      if (memberResult.rows.length === 0) {
        req.authContext!.vendorOwnerId = userId;
        req.authContext!.orgRole = "owner";
        next();
        return;
      }

      const { organizationId, role: orgRole } = memberResult.rows[0];
      req.authContext!.orgRole = orgRole as "owner" | "member";

      if (orgRole === "owner") {
        req.authContext!.vendorOwnerId = userId;
      } else {
        const ownerResult = await pool.query(
          `SELECT m."userId"
           FROM "member" m
           WHERE m."organizationId" = $1 AND m.role = 'owner'
           LIMIT 1`,
          [organizationId],
        );

        if (ownerResult.rows.length === 0) {
          res.status(403).json({ error: { code: "FORBIDDEN", message: "Organization has no owner" } });
          return;
        }

        req.authContext!.vendorOwnerId = ownerResult.rows[0].userId;
      }

      next();
    } catch {
      res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to resolve vendor context" } });
    }
  };
}
