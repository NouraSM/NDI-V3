import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, errorResponse, ApiError } from "@/lib/api-utils";
import { logActivity } from "@/lib/activity";
import { recomputeSnapshot } from "@/lib/snapshot";
import { updateEvidenceSchema } from "@/lib/validation";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requirePermission("EDIT_EVIDENCE");
    const body = updateEvidenceSchema.parse(await req.json());

    const existing = await prisma.evidence.findUnique({ where: { id: params.id } });
    if (!existing) throw new ApiError(404, "Evidence not found");

    const evidence = await prisma.evidence.update({
      where: { id: params.id },
      data: body,
      include: { assessor: { select: { id: true, name: true } } },
    });

    await recomputeSnapshot(existing.domainId, existing.periodId);

    await logActivity({
      type: "EVIDENCE",
      action: "Evidence status updated",
      detail: `${session.user.name} updated ${existing.code}${body.status ? ` to ${body.status}` : ""}`,
      userId: session.user.id,
      domainId: existing.domainId,
      refType: "EVIDENCE",
      refId: evidence.id,
    });

    return NextResponse.json({ evidence });
  } catch (err) {
    return errorResponse(err);
  }
}
