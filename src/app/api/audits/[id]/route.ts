import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, errorResponse, ApiError } from "@/lib/api-utils";
import { logActivity } from "@/lib/activity";
import { updateAuditSchema } from "@/lib/validation";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requirePermission("MANAGE_AUDITS");
    const body = updateAuditSchema.parse(await req.json());

    const existing = await prisma.audit.findUnique({ where: { id: params.id } });
    if (!existing) throw new ApiError(404, "Audit not found");

    const audit = await prisma.audit.update({
      where: { id: params.id },
      data: body,
      include: { domain: true, leadAuditor: { select: { id: true, name: true } } },
    });

    await logActivity({
      type: "AUDIT",
      action: "Audit updated",
      detail: `${session.user.name} updated ${existing.code}${body.status ? ` — status: ${body.status}` : ""}`,
      userId: session.user.id,
      domainId: existing.domainId,
      refType: "AUDIT",
      refId: audit.id,
    });

    return NextResponse.json({ audit });
  } catch (err) {
    return errorResponse(err);
  }
}
