import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requirePermission, errorResponse } from "@/lib/api-utils";
import { logActivity } from "@/lib/activity";
import { createAuditSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireSession();
    const audits = await prisma.audit.findMany({
      include: { domain: true, leadAuditor: { select: { id: true, name: true } }, _count: { select: { findings: true } } },
      orderBy: { scheduledDate: "asc" },
    });
    return NextResponse.json({ audits });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission("MANAGE_AUDITS");
    const body = createAuditSchema.parse(await req.json());

    const count = await prisma.audit.count();
    const code = `AUD-${String(count + 1).padStart(3, "0")}`;

    const audit = await prisma.audit.create({
      data: { ...body, code },
      include: { domain: true, leadAuditor: { select: { id: true, name: true } } },
    });

    await logActivity({
      type: "AUDIT",
      action: "Audit scheduled",
      detail: `${session.user.name} scheduled ${code} for ${audit.domain.name.replace("NDI ", "")}`,
      userId: session.user.id,
      domainId: body.domainId,
      refType: "AUDIT",
      refId: audit.id,
    });

    return NextResponse.json({ audit }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
