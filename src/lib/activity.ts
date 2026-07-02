import { prisma } from "@/lib/prisma";
import type { ActivityType } from "@prisma/client";

export async function logActivity(params: {
  type: ActivityType;
  action: string;
  detail: string;
  userId?: string;
  domainId?: number;
  refType?: string;
  refId?: string;
}) {
  await prisma.activityLog.create({ data: params });
}
