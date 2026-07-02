import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, errorResponse } from "@/lib/api-utils";

export async function GET() {
  try {
    await requireSession();
    const periods = await prisma.assessmentPeriod.findMany({ orderBy: { startDate: "asc" } });
    return NextResponse.json({ periods });
  } catch (err) {
    return errorResponse(err);
  }
}
