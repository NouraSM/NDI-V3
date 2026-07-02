import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, errorResponse } from "@/lib/api-utils";

export async function GET() {
  try {
    await requireSession();
    const domains = await prisma.domain.findMany({
      orderBy: { sortOrder: "asc" },
      include: { steward: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ domains });
  } catch (err) {
    return errorResponse(err);
  }
}
