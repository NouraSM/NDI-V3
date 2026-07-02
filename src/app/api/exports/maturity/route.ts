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

    const evidence = await prisma.evidence.findMany({
      where: { periodId: period.id },
      include: { domain: true },
    });

    const rows: Record<string, { domain: string; level: number; complete: number; partial: number; incomplete: number }> = {};
    for (const e of evidence) {
      const key = `${e.domainId}-${e.maturityLevel}`;
      rows[key] ??= { domain: e.domain.shortCode, level: e.maturityLevel, complete: 0, partial: 0, incomplete: 0 };
      if (e.status === "COMPLETE") rows[key].complete++;
      else if (e.status === "PARTIAL") rows[key].partial++;
      else rows[key].incomplete++;
    }

    const csv = toCsv(Object.values(rows), [
      { key: "domain", header: "Domain" },
      { key: "level", header: "Maturity Level" },
      { key: "complete", header: "Complete" },
      { key: "partial", header: "Partial" },
      { key: "incomplete", header: "Incomplete" },
    ]);

    return csvResponse(csv, `domain-maturity-report-${period.label}.csv`);
  } catch (err) {
    return errorResponse(err);
  }
}
