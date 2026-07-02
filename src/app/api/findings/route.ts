import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requirePermission, errorResponse } from "@/lib/api-utils";
import { logActivity } from "@/lib/activity";
import { createFindingSchema } from "@/lib/validation";
import type { Prisma, Severity, FindingStatus } from "@prisma/client";

export async function GET(req: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const severity = searchParams.get("severity");
    const status = searchParams.get("status");
    const domainId = searchParams.get("domainId");

    const where: Prisma.FindingWhereInput = {
      ...(severity && severity !== "all" ? { severity: severity.toUpperCase() as Severity } : {}),
      ...(status && status !== "all" ? { status: status.toUpperCase().replace(" ", "_") as FindingStatus } : {}),
      ...(domainId && domainId !== "all" ? { domainId: Number(domainId) } : {}),
    };

    const findings = await prisma.finding.findMany({
      where,
      include: {
        domain: { select: { id: true, name: true, shortCode: true } },
        assignee: { select: { id: true, name: true } },
        evidence: { select: { id: true, code: true } },
      },
      orderBy: { raisedDate: "desc" },
    });

    return NextResponse.json({ findings });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission("MANAGE_FINDINGS");
    const body = createFindingSchema.parse(await req.json());

    const count = await prisma.finding.count();
    const code = `FND-${String(count + 1).padStart(4, "0")}`;

    const finding = await prisma.finding.create({
      data: { ...body, code },
      include: { domain: true, assignee: { select: { id: true, name: true } } },
    });

    await logActivity({
      type: "FINDING",
      action: "Finding raised",
      detail: `${session.user.name} raised ${code}: ${finding.title}`,
      userId: session.user.id,
      domainId: body.domainId,
      refType: "FINDING",
      refId: finding.id,
    });

    return NextResponse.json({ finding }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
