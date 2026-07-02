import { prisma } from "@/lib/prisma";
import { requireSession, errorResponse, ApiError } from "@/lib/api-utils";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET(req: Request) {
  try {
    await requireSession();
    const periodLabel = new URL(req.url).searchParams.get("period");
    const period = periodLabel
      ? await prisma.assessmentPeriod.findUnique({ where: { label: periodLabel } })
      : await prisma.assessmentPeriod.findFirst({ where: { isActive: true } });
    if (!period) throw new ApiError(404, "Assessment period not found");

    const snapshots = await prisma.domainSnapshot.findMany({
      where: { periodId: period.id },
      include: { domain: true },
      orderBy: { domain: { sortOrder: "asc" } },
    });

    const csv = toCsv(
      snapshots.map((s) => ({
        domain: s.domain.name,
        shortCode: s.domain.shortCode,
        total: s.targetEvidence,
        complete: s.completeCount,
        partial: s.partialCount,
        incomplete: s.incompleteCount,
        complianceScore: `${s.complianceScore}%`,
      })),
      [
        { key: "domain", header: "Domain" },
        { key: "shortCode", header: "Code" },
        { key: "total", header: "Total Evidence" },
        { key: "complete", header: "Complete" },
        { key: "partial", header: "Partial" },
        { key: "incomplete", header: "Incomplete" },
        { key: "complianceScore", header: "Compliance Score" },
      ]
    );

    return csvResponse(csv, `compliance-report-${period.label}.csv`);
  } catch (err) {
    return errorResponse(err);
  }
}
