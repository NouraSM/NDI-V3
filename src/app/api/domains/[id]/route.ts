import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, errorResponse, ApiError } from "@/lib/api-utils";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const domainId = Number(params.id);
    const { searchParams } = new URL(req.url);
    const periodLabel = searchParams.get("period");

    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
      include: { steward: { select: { id: true, name: true } } },
    });
    if (!domain) throw new ApiError(404, "Domain not found");

    const period = periodLabel
      ? await prisma.assessmentPeriod.findUnique({ where: { label: periodLabel } })
      : await prisma.assessmentPeriod.findFirst({ where: { isActive: true } });
    if (!period) throw new ApiError(404, "Assessment period not found");

    const snapshot = await prisma.domainSnapshot.findUnique({
      where: { domainId_periodId: { domainId, periodId: period.id } },
    });

    return NextResponse.json({
      domain,
      period: { id: period.id, label: period.label },
      snapshot: snapshot ?? { targetEvidence: 0, completeCount: 0, partialCount: 0, incompleteCount: 0, complianceScore: 0 },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
