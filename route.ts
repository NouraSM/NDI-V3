import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, errorResponse } from "@/lib/api-utils";

// Any authenticated user can list users (needed to populate assignee/auditor
// dropdowns); only ADMIN can be given write access to this resource — no
// mutation route exists yet, which is intentional (see README "Nice-to-haves").
export async function GET() {
  try {
    await requireSession();
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ users });
  } catch (err) {
    return errorResponse(err);
  }
}
