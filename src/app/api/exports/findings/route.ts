import { prisma } from "@/lib/prisma";
import { requireSession, errorResponse } from "@/lib/api-utils";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET(req: Request) {
  try {
    await requireSession();
    const openOnly = new URL(req.url).searchParams.get("openOnly") === "1";
    const findings = await prisma.finding.findMany({
      where: openOnly ? { status: { in: ["OPEN", "IN_PROGRESS"] } } : undefined,
      include: { domain: true, assignee: { select: { name: true } } },
      orderBy: { raisedDate: "desc" },
    });

    const csv = toCsv(
      findings.map((f) => ({
        id: f.code,
        domain: f.domain.shortCode,
        title: f.title,
        severity: f.severity,
        status: f.status,
        assignee: f.assignee?.name ?? "Unassigned",
        raisedDate: f.raisedDate.toISOString().slice(0, 10),
        dueDate: f.dueDate.toISOString().slice(0, 10),
      })),
      [
        { key: "id", header: "ID" },
        { key: "domain", header: "Domain" },
        { key: "title", header: "Title" },
        { key: "severity", header: "Severity" },
        { key: "status", header: "Status" },
        { key: "assignee", header: "Assignee" },
        { key: "raisedDate", header: "Raised Date" },
        { key: "dueDate", header: "Due Date" },
      ]
    );

    return csvResponse(csv, openOnly ? "remediation-tracker.csv" : "findings-register.csv");
  } catch (err) {
    return errorResponse(err);
  }
}
