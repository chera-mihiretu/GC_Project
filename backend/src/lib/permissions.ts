/**
 * @fileoverview Role-Based Access Control (RBAC) configuration for vendor organizations.
 * 
 * This module defines the permission matrix for organization members using
 * Better Auth's access control system. It establishes what actions different
 * roles (owner vs member) can perform on various resources.
 * 
 * @module lib/permissions
 */
import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  adminAc,
} from "better-auth/plugins/organization/access";

/**
 * Permission statement definitions for all protected resources.
 * 
 * Each resource type maps to an array of allowed actions (CRUD operations).
 * These statements form the foundation of the access control matrix.
 */
const statement = {
  ...defaultStatements,
  /** Portfolio management - images, descriptions, service showcases */
  portfolio: ["create", "read", "update", "delete"],
  /** Pricing configuration - packages, rates, custom quotes */
  pricing: ["create", "read", "update", "delete"],
  /** Banking details - payout accounts, financial information */
  banking: ["read", "update"],
  /** Chat conversations - customer communication */
  chat: ["create", "read", "update", "delete"],
  /** Availability scheduling - booking calendar management */
  schedule: ["create", "read", "update", "delete"],
  /** Staff management - team member invitations and removal */
  staff: ["invite", "remove", "read"],
} as const;

/**
 * Access control instance with all permission statements registered.
 */
export const ac = createAccessControl(statement);

/**
 * Owner role with full administrative access to all resources.
 * 
 * Business owners have complete control over their organization,
 * including staff management and financial settings.
 */
export const ownerRole = ac.newRole({
  portfolio: ["create", "read", "update", "delete"],
  pricing: ["create", "read", "update", "delete"],
  banking: ["read", "update"],
  chat: ["create", "read", "update", "delete"],
  schedule: ["create", "read", "update", "delete"],
  staff: ["invite", "remove", "read"],
  ...adminAc.statements,
});

/**
 * Member role with limited access appropriate for staff members.
 * 
 * Staff can view portfolio and pricing but cannot modify them.
 * They have full access to chat and scheduling to handle day-to-day
 * customer interactions, but cannot manage other staff members.
 */
export const memberRole = ac.newRole({
  portfolio: ["read"],
  pricing: ["read"],
  banking: ["read"],
  chat: ["create", "read", "update", "delete"],
  schedule: ["create", "read", "update", "delete"],
  staff: ["read"],
});