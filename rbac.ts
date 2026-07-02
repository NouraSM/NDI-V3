import type { Role } from "@prisma/client";

// Central role→permission map. Keep this the single source of truth for
// "who can do what" instead of scattering role checks across routes.
export const PERMISSIONS = {
  MANAGE_USERS: ["ADMIN"],
  MANAGE_AUDITS: ["ADMIN", "AUDITOR"],
  MANAGE_FINDINGS: ["ADMIN", "AUDITOR"],
  EDIT_EVIDENCE: ["ADMIN", "AUDITOR", "DATA_STEWARD"],
  COMMENT: ["ADMIN", "AUDITOR", "DATA_STEWARD"],
  VIEW: ["ADMIN", "AUDITOR", "DATA_STEWARD", "VIEWER"],
} as const satisfies Record<string, Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}
