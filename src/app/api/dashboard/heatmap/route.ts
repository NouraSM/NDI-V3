import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, errorResponse, ApiError } from "@/lib/api-utils";

// Batched version of /api/dashboard/maturity for multiple domains at once —
// powers the diagnostic-tab heatmap in a single query instead of one
// request per domain (was 8 round-trips + 8 DB queries, now 1 of each).
export async function GET(req: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const periodLabel = searchParams.get("period");
    const domainIdsParam = searchParams.get("domainIds"); // comma-separated

    const period = periodLabel
      ? await prisma.assessmentPeriod.findUnique({ where: { label: periodLabel } })
      : await prisma.assessmentPeriod.findFirst({ where: { isActive: true } });
    if (!period) throw new ApiError(404, "Assessment period not found");

    const domainIds = domainIdsParam
      ? domainIdsParam.split(",").map(Number).filter((n) => !Number.isNaN(n))
      : undefined;

    const evidence = await prisma.evidence.findMany({
      where: { periodId: period.id, ...(domainIds ? { domainId: { in: domainIds } } : {}) },
      select: { domainId: true, maturityLevel: true, status: true },
    });

    const byDomain: Record<number, { level: number; complete: number; partial: number; incomplete: number; total: number; compliancePct: number }[]> = {};
    const domainsToBuild = domainIds ?? Array.from(new Set(evidence.map((e) => e.domainId)));

    for (const domainId of domainsToBuild) {
      const domainEvidence = evidence.filter((e) => e.domainId === domainId);
      byDomain[domainId] = Array.from({ length: 6 }, (_, level) => {
        const rows = domainEvidence.filter((e) => e.maturityLevel === level);
        const complete = rows.filter((e) => e.status === "COMPLETE").length;
        const partial = rows.filter((e) => e.status === "PARTIAL").length;
        const incomplete = rows.filter((e) => e.status === "INCOMPLETE").length;
        const total = complete + partial + incomplete;
        return { level, complete, partial, incomplete, total, compliancePct: total > 0 ? Math.round((complete / total) * 100) : 0 };
      });
    }

    return NextResponse.json({
      period: { id: period.id, label: period.label },
      hasDetailedData: evidence.length > 0,
      byDomain,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
