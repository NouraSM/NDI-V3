import { prisma } from "@/lib/prisma";
import { requireSession, errorResponse } from "@/lib/api-utils";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  try {
    await requireSession();
    const activity = await prisma.activityLog.findMany({
      include: { user: { select: { name: true } }, domain: { select: { shortCode: true } } },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const csv = toCsv(
      activity.map((a) => ({
        timestamp: a.createdAt.toISOString(),
        type: a.type,
        action: a.action,
        detail: a.detail,
        user: a.user?.name ?? "System",
        domain: a.domain?.shortCode ?? "—",
        ref: a.refId ?? "—",
      })),
      [
        { key: "timestamp", header: "Timestamp" },
        { key: "type", header: "Type" },
        { key: "action", header: "Action" },
        { key: "detail", header: "Detail" },
        { key: "user", header: "User" },
        { key: "domain", header: "Domain" },
        { key: "ref", header: "Reference" },
      ]
    );

    return csvResponse(csv, "audit-trail-log.csv");
  } catch (err) {
    return errorResponse(err);
  }
}
