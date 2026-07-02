import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, errorResponse, ApiError } from "@/lib/api-utils";

export async function GET(req: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const periodLabel = searchParams.get("period");
    const domainIdParam = searchParams.get("domainId");

    const period = periodLabel
      ? await prisma.assessmentPeriod.findUnique({ where: { label: periodLabel } })
      : await prisma.assessmentPeriod.findFirst({ where: { isActive: true } });
    if (!period) throw new ApiError(404, "Assessment period not found");

    const evidence = await prisma.evidence.findMany({
      where: { periodId: period.id, ...(domainIdParam ? { domainId: Number(domainIdParam) } : {}) },
      select: { maturityLevel: true, status: true },
    });

    const levels = Array.from({ length: 6 }, (_, level) => {
      const rows = evidence.filter((e) => e.maturityLevel === level);
      const complete = rows.filter((e) => e.status === "COMPLETE").length;
      const partial = rows.filter((e) => e.status === "PARTIAL").length;
      const incomplete = rows.filter((e) => e.status === "INCOMPLETE").length;
      const total = complete + partial + incomplete;
      return { level, complete, partial, incomplete, total, compliancePct: total > 0 ? Math.round((complete / total) * 100) : 0 };
    });

    return NextResponse.json({
      period: { id: period.id, label: period.label },
      hasDetailedData: evidence.length > 0,
      levels,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
