import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { can, type Permission } from "@/lib/rbac";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function errorResponse(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: { code: err.status, message: err.message } }, { status: err.status });
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: { code: 400, message: "Validation failed", issues: err.flatten() } },
      { status: 400 }
    );
  }
  console.error(err);
  return NextResponse.json({ error: { code: 500, message: "Internal server error" } }, { status: 500 });
}

/** Resolves the current session or throws a 401 ApiError. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new ApiError(401, "Authentication required");
  return session;
}

/** Resolves the current session and enforces a permission, or throws 401/403. */
export async function requirePermission(permission: Permission) {
  const session = await requireSession();
  if (!can(session.user.role, permission)) {
    throw new ApiError(403, "You do not have permission to perform this action");
  }
  return session;
}
