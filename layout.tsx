import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const [domains, periods] = await Promise.all([
    prisma.domain.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, shortCode: true, color: true } }),
    prisma.assessmentPeriod.findMany({ orderBy: { startDate: "asc" }, select: { id: true, label: true, isActive: true } }),
  ]);

  return (
    <Shell
      user={session?.user ?? null}
      domains={domains}
      periods={periods.map((p) => ({ ...p, id: p.id, label: p.label, isActive: p.isActive }))}
    >
      {children}
    </Shell>
  );
}
