import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  adminAc,
} from "better-auth/plugins/organization/access";

const statement = {
  ...defaultStatements,
  portfolio: ["create", "read", "update", "delete"],
  pricing: ["create", "read", "update", "delete"],
  banking: ["read", "update"],
  chat: ["create", "read", "update", "delete"],
  schedule: ["create", "read", "update", "delete"],
  staff: ["invite", "remove", "read"],
} as const;

export const ac = createAccessControl(statement);

export const ownerRole = ac.newRole({
  portfolio: ["create", "read", "update", "delete"],
  pricing: ["create", "read", "update", "delete"],
  banking: ["read", "update"],
  chat: ["create", "read", "update", "delete"],
  schedule: ["create", "read", "update", "delete"],
  staff: ["invite", "remove", "read"],
  ...adminAc.statements,
});

export const memberRole = ac.newRole({
  portfolio: ["read"],
  pricing: ["read"],
  banking: ["read"],
  chat: ["create", "read", "update", "delete"],
  schedule: ["create", "read", "update", "delete"],
  staff: ["read"],
});
