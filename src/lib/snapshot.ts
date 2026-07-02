import { prisma } from "@/lib/prisma";

/**
 * Recomputes the DomainSnapshot roll-up for a domain+period from its
 * Evidence rows. Called after any evidence mutation so dashboard KPIs
 * (which read from DomainSnapshot for performance) stay in sync with
 * the underlying evidence records instead of drifting.
 */
export async function recomputeSnapshot(domainId: number, periodId: string) {
  const rows = await prisma.evidence.findMany({ where: { domainId, periodId }, select: { status: true } });
  const completeCount = rows.filter((r) => r.status === "COMPLETE").length;
  const partialCount = rows.filter((r) => r.status === "PARTIAL").length;
  const incompleteCount = rows.filter((r) => r.status === "INCOMPLETE").length;

  const existing = await prisma.domainSnapshot.findUnique({ where: { domainId_periodId: { domainId, periodId } } });
  const targetEvidence = existing?.targetEvidence ?? rows.length;
  const complianceScore = targetEvidence > 0 ? Math.round((completeCount / targetEvidence) * 100) : 0;

  await prisma.domainSnapshot.upsert({
    where: { domainId_periodId: { domainId, periodId } },
    update: { completeCount, partialCount, incompleteCount, complianceScore },
    create: { domainId, periodId, targetEvidence, completeCount, partialCount, incompleteCount, complianceScore },
  });
}
