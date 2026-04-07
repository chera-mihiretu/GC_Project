import {
  isAuthenticated,
  hasRole,
  hasAnyRole,
  isBanned,
} from "./validate-session.js";
import type { SessionContext } from "../domain/types.js";
import { UserRole } from "../domain/roles.js";

const mockContext: SessionContext = {
  user: {
    id: "usr_1",
    name: "Test User",
    email: "test@example.com",
    emailVerified: true,
    role: UserRole.COUPLE,
    banned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  session: {
    id: "sess_1",
    userId: "usr_1",
    expiresAt: new Date(Date.now() + 86400000),
    token: "token_abc",
  },
};

describe("validate-session use cases", () => {
  describe("isAuthenticated", () => {
    it("returns true for valid context", () => {
      expect(isAuthenticated(mockContext)).toBe(true);
    });

    it("returns false for null context", () => {
      expect(isAuthenticated(null)).toBe(false);
    });
  });

  describe("hasRole", () => {
    it("returns true when user has the required role", () => {
      expect(hasRole(mockContext, UserRole.COUPLE)).toBe(true);
    });

    it("returns false when user does not have the required role", () => {
      expect(hasRole(mockContext, UserRole.ADMIN)).toBe(false);
    });
  });

  describe("hasAnyRole", () => {
    it("returns true when user has one of the required roles", () => {
      expect(
        hasAnyRole(mockContext, [UserRole.COUPLE, UserRole.VENDOR]),
      ).toBe(true);
    });

    it("returns false when user has none of the required roles", () => {
      expect(
        hasAnyRole(mockContext, [UserRole.VENDOR, UserRole.ADMIN]),
      ).toBe(false);
    });
  });

  describe("isBanned", () => {
    it("returns false for non-banned user", () => {
      expect(isBanned(mockContext)).toBe(false);
    });

    it("returns true for banned user", () => {
      const banned = {
        ...mockContext,
        user: { ...mockContext.user, banned: true },
      };
      expect(isBanned(banned)).toBe(true);
    });
  });
});
