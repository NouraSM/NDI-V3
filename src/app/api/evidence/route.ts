import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requirePermission, errorResponse, ApiError } from "@/lib/api-utils";
import { logActivity } from "@/lib/activity";
import { recomputeSnapshot } from "@/lib/snapshot";
import { createEvidenceSchema } from "@/lib/validation";
import type { Prisma, EvidenceStatus } from "@prisma/client";

export async function GET(req: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const domainId = searchParams.get("domainId");
    const periodLabel = searchParams.get("period");
    const status = searchParams.get("status");
    const q = searchParams.get("q");
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(200, Math.max(1, Number(searchParams.get("pageSize") ?? "100")));

    const period = periodLabel
      ? await prisma.assessmentPeriod.findUnique({ where: { label: periodLabel } })
      : await prisma.assessmentPeriod.findFirst({ where: { isActive: true } });
    if (!period) throw new ApiError(404, "Assessment period not found");

    const where: Prisma.EvidenceWhereInput = {
      periodId: period.id,
      ...(domainId ? { domainId: Number(domainId) } : {}),
      ...(status && status !== "all" ? { status: status.toUpperCase() as EvidenceStatus } : {}),
      ...(q
        ? {
            OR: [
              { code: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { assessor: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.evidence.findMany({
        where,
        include: { assessor: { select: { id: true, name: true } } },
        orderBy: { code: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.evidence.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, pageSize });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission("EDIT_EVIDENCE");
    const body = createEvidenceSchema.parse(await req.json());

    const count = await prisma.evidence.count({ where: { domainId: body.domainId } });
    const code = `EV-${String(body.domainId).padStart(2, "0")}-${String(count + 1).padStart(3, "0")}`;

    const evidence = await prisma.evidence.create({
      data: { ...body, code },
      include: { assessor: { select: { id: true, name: true } } },
    });

    await recomputeSnapshot(body.domainId, body.periodId);

    await logActivity({
      type: "EVIDENCE",
      action: "Evidence created",
      detail: `${session.user.name} added evidence ${code}`,
      userId: session.user.id,
      domainId: body.domainId,
      refType: "EVIDENCE",
      refId: evidence.id,
    });

    return NextResponse.json({ evidence }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
