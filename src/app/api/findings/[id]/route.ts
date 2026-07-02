import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requirePermission, errorResponse, ApiError } from "@/lib/api-utils";
import { logActivity } from "@/lib/activity";
import { updateFindingSchema } from "@/lib/validation";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const finding = await prisma.finding.findUnique({
      where: { id: params.id },
      include: {
        domain: true,
        assignee: { select: { id: true, name: true } },
        evidence: { select: { id: true, code: true } },
        audit: { select: { id: true, code: true } },
        comments: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
      },
    });
    if (!finding) throw new ApiError(404, "Finding not found");
    return NextResponse.json({ finding });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requirePermission("MANAGE_FINDINGS");
    const body = updateFindingSchema.parse(await req.json());

    const existing = await prisma.finding.findUnique({ where: { id: params.id } });
    if (!existing) throw new ApiError(404, "Finding not found");

    const finding = await prisma.finding.update({
      where: { id: params.id },
      data: body,
      include: { domain: true, assignee: { select: { id: true, name: true } } },
    });

    await logActivity({
      type: "FINDING",
      action: "Finding status changed",
      detail: `${session.user.name} updated ${existing.code}${body.status ? ` to ${body.status}` : ""}`,
      userId: session.user.id,
      domainId: existing.domainId,
      refType: "FINDING",
      refId: finding.id,
    });

    return NextResponse.json({ finding });
  } catch (err) {
    return errorResponse(err);
  }
}
