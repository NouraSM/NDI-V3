import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, errorResponse, ApiError } from "@/lib/api-utils";

export async function GET(req: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const periodLabel = searchParams.get("period");

    const period = periodLabel
      ? await prisma.assessmentPeriod.findUnique({ where: { label: periodLabel } })
      : await prisma.assessmentPeriod.findFirst({ where: { isActive: true } });
    if (!period) throw new ApiError(404, "Assessment period not found");

    const snapshots = await prisma.domainSnapshot.findMany({
      where: { periodId: period.id },
      include: { domain: true },
      orderBy: { domain: { sortOrder: "asc" } },
    });

    const totals = snapshots.reduce(
      (acc, s) => {
        acc.total += s.targetEvidence;
        acc.complete += s.completeCount;
        acc.partial += s.partialCount;
        acc.incomplete += s.incompleteCount;
        return acc;
      },
      { total: 0, complete: 0, partial: 0, incomplete: 0 }
    );
    const complianceScore = totals.total > 0 ? Math.round((totals.complete / totals.total) * 100) : 0;

    const domains = snapshots.map((s) => ({
      id: s.domain.id,
      name: s.domain.name,
      shortCode: s.domain.shortCode,
      color: s.domain.color,
      total: s.targetEvidence,
      complete: s.completeCount,
      partial: s.partialCount,
      incomplete: s.incompleteCount,
      complianceScore: s.complianceScore,
    }));

    return NextResponse.json({
      period: { id: period.id, label: period.label },
      kpis: { ...totals, complianceScore },
      domains,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
