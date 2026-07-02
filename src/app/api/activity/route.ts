import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, errorResponse } from "@/lib/api-utils";
import type { Prisma, ActivityType } from "@prisma/client";

export async function GET(req: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const domainId = searchParams.get("domainId");
    const limit = Math.min(100, Number(searchParams.get("limit") ?? "30"));

    const where: Prisma.ActivityLogWhereInput = {
      ...(type && type !== "all" ? { type: type.toUpperCase() as ActivityType } : {}),
      ...(domainId ? { domainId: Number(domainId) } : {}),
    };

    const activity = await prisma.activityLog.findMany({
      where,
      include: { user: { select: { id: true, name: true } }, domain: { select: { id: true, shortCode: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ activity });
  } catch (err) {
    return errorResponse(err);
  }
}
