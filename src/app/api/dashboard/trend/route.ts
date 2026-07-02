import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, errorResponse } from "@/lib/api-utils";

export async function GET(req: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const domainIdParam = searchParams.get("domainId");

    const periods = await prisma.assessmentPeriod.findMany({ orderBy: { startDate: "asc" } });
    const snapshots = await prisma.domainSnapshot.findMany({
      where: domainIdParam ? { domainId: Number(domainIdParam) } : {},
      include: { period: true },
    });

    const trend = periods.map((p) => {
      const rows = snapshots.filter((s) => s.periodId === p.id);
      const complete = rows.reduce((s, r) => s + r.completeCount, 0);
      const partial = rows.reduce((s, r) => s + r.partialCount, 0);
      const incomplete = rows.reduce((s, r) => s + r.incompleteCount, 0);
      return { period: p.label, complete, partial, incomplete };
    });

    return NextResponse.json({ trend });
  } catch (err) {
    return errorResponse(err);
  }
}
