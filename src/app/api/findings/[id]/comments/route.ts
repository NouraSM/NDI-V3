import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, errorResponse, ApiError } from "@/lib/api-utils";
import { logActivity } from "@/lib/activity";
import { createCommentSchema } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requirePermission("COMMENT");
    const body = createCommentSchema.parse(await req.json());

    const finding = await prisma.finding.findUnique({ where: { id: params.id } });
    if (!finding) throw new ApiError(404, "Finding not found");

    const comment = await prisma.findingComment.create({
      data: { findingId: params.id, userId: session.user.id, body: body.body },
      include: { user: { select: { id: true, name: true } } },
    });

    await logActivity({
      type: "FINDING",
      action: "Comment added",
      detail: `${session.user.name} commented on ${finding.code}`,
      userId: session.user.id,
      domainId: finding.domainId,
      refType: "FINDING",
      refId: finding.id,
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
