import { PrismaClient, EvidenceStatus, AuditStatus, AuditType, Severity, FindingStatus, ActivityType } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  DOMAINS_SEED,
  REAL_DATA,
  PERIODS_SEED,
  ACTIVE_PERIOD_LABEL,
  SEED_USERS,
  FINDING_TEMPLATES,
  SUB_AREAS,
  TRAIL_TEMPLATES,
  seededRandom,
} from "./seed-data";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "Password123!";

async function main() {
  console.log("Seeding: users...");
  const users = new Map<string, string>(); // email -> id
  for (const u of SEED_USERS) {
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email, role: u.role, passwordHash },
    });
    users.set(u.email, created.id);
  }
  const auditorEmails = SEED_USERS.filter((u) => u.role === "AUDITOR" || u.role === "DATA_STEWARD").map((u) => u.email);
  const pickAuditor = (r: (min: number, max: number) => number) => users.get(auditorEmails[r(0, auditorEmails.length - 1)])!;

  console.log("Seeding: assessment periods...");
  const periodIds = new Map<string, string>();
  for (const p of PERIODS_SEED) {
    const created = await prisma.assessmentPeriod.upsert({
      where: { label: p.label },
      update: { isActive: p.label === ACTIVE_PERIOD_LABEL },
      create: {
        label: p.label,
        startDate: new Date(p.start),
        endDate: new Date(p.end),
        isActive: p.label === ACTIVE_PERIOD_LABEL,
      },
    });
    periodIds.set(p.label, created.id);
  }

  console.log("Seeding: domains...");
  for (const [i, d] of DOMAINS_SEED.entries()) {
    await prisma.domain.upsert({
      where: { id: d.id },
      update: { name: d.name, shortCode: d.shortCode, color: d.color, sortOrder: i },
      create: { id: d.id, name: d.name, shortCode: d.shortCode, color: d.color, sortOrder: i },
    });
  }
  // keep the id sequence ahead of our manually-assigned ids
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('domains','id'), (SELECT MAX(id) FROM domains))`
  );

  console.log("Seeding: domain snapshots (per quarter) + evidence (current quarter)...");
  for (const d of DOMAINS_SEED) {
    const rd = REAL_DATA[d.id];
    const totalComplete = rd.levelCompleted.reduce((s, v) => s + v, 0);

    // Historical snapshots scale toward the real current-quarter numbers so
    // the quarter selector shows a believable trend instead of static data.
    for (const p of PERIODS_SEED) {
      const progress = p.progress;
      const complete = p.label === ACTIVE_PERIOD_LABEL ? totalComplete : Math.round(totalComplete * progress * (0.5 + 0.5 * progress));
      const partial = p.label === ACTIVE_PERIOD_LABEL ? rd.partial : Math.round(rd.partial * progress);
      const incomplete = Math.max(0, rd.target - complete - partial);
      const complianceScore = rd.target > 0 ? Math.round((complete / rd.target) * 100) : 0;

      await prisma.domainSnapshot.upsert({
        where: { domainId_periodId: { domainId: d.id, periodId: periodIds.get(p.label)! } },
        update: { targetEvidence: rd.target, completeCount: complete, partialCount: partial, incompleteCount: incomplete, complianceScore },
        create: {
          domainId: d.id,
          periodId: periodIds.get(p.label)!,
          targetEvidence: rd.target,
          completeCount: complete,
          partialCount: partial,
          incompleteCount: incomplete,
          complianceScore,
        },
      });
    }

    // Individual evidence rows, seeded only for the active/current quarter.
    // Descriptions are realistic placeholders until the real evidence
    // register is imported (see README).
    const r = seededRandom(d.id * 137 + 42);
    const periodId = periodIds.get(ACTIVE_PERIOD_LABEL)!;
    let evIdx = 1;
    const evidenceRows: {
      code: string; domainId: number; periodId: string; description: string; subArea: string;
      maturityLevel: number; status: EvidenceStatus; score: number; assessorId: string;
    }[] = [];

    for (let ml = 0; ml <= 5; ml++) {
      for (let j = 0; j < rd.levelCompleted[ml]; j++) {
        evidenceRows.push({
          code: `EV-${String(d.id).padStart(2, "0")}-${String(evIdx++).padStart(3, "0")}`,
          domainId: d.id,
          periodId,
          description: `${SUB_AREAS[r(0, SUB_AREAS.length - 1)]} — Level ${ml} specification ${j + 1}`,
          subArea: SUB_AREAS[r(0, SUB_AREAS.length - 1)],
          maturityLevel: ml,
          status: EvidenceStatus.COMPLETE,
          score: r(80, 100),
          assessorId: pickAuditor(r),
        });
      }
    }
    for (let j = 0; j < rd.partial; j++) {
      const ml = r(1, 3);
      evidenceRows.push({
        code: `EV-${String(d.id).padStart(2, "0")}-${String(evIdx++).padStart(3, "0")}`,
        domainId: d.id,
        periodId,
        description: `${SUB_AREAS[r(0, SUB_AREAS.length - 1)]} — Level ${ml} partial assessment`,
        subArea: SUB_AREAS[r(0, SUB_AREAS.length - 1)],
        maturityLevel: ml,
        status: EvidenceStatus.PARTIAL,
        score: r(40, 79),
        assessorId: pickAuditor(r),
      });
    }
    for (let j = 0; j < rd.incomplete; j++) {
      const ml = r(2, 5);
      evidenceRows.push({
        code: `EV-${String(d.id).padStart(2, "0")}-${String(evIdx++).padStart(3, "0")}`,
        domainId: d.id,
        periodId,
        description: `${SUB_AREAS[r(0, SUB_AREAS.length - 1)]} — Level ${ml} pending assessment`,
        subArea: SUB_AREAS[r(0, SUB_AREAS.length - 1)],
        maturityLevel: ml,
        status: EvidenceStatus.INCOMPLETE,
        score: r(0, 39),
        assessorId: pickAuditor(r),
      });
    }

    for (const row of evidenceRows) {
      await prisma.evidence.upsert({ where: { code: row.code }, update: row, create: row });
    }
  }

  console.log("Seeding: audits...");
  const auditIds = new Map<number, string>(); // domainId -> audit id
  for (const [i, d] of DOMAINS_SEED.entries()) {
    const r = seededRandom(d.id * 251 + 73 + i * 19);
    const statuses = [AuditStatus.SCHEDULED, AuditStatus.IN_PROGRESS, AuditStatus.COMPLETED, AuditStatus.OVERDUE];
    const status = statuses[r(0, 3)];
    const month1 = 1 + (i % 3);
    const month2 = month1 + 1;
    const day = Math.min(28, 5 + i * 2);
    const code = `AUD-${String(d.id).padStart(3, "0")}`;
    const completionPct = status === AuditStatus.COMPLETED ? 100 : status === AuditStatus.IN_PROGRESS ? r(30, 80) : status === AuditStatus.OVERDUE ? r(10, 50) : 0;
    const created = await prisma.audit.upsert({
      where: { code },
      update: {},
      create: {
        code,
        domainId: d.id,
        leadAuditorId: pickAuditor(r),
        type: AuditType.FULL_ASSESSMENT,
        scheduledDate: new Date(`2025-0${month1}-${String(day).padStart(2, "0")}`),
        dueDate: new Date(`2025-0${month2}-${String(day).padStart(2, "0")}`),
        status,
        completionPct,
        scopeNotes: `Assessment of ${d.name} against NDI maturity framework.`,
        priorityLevels: "All Levels (0-5)",
      },
    });
    auditIds.set(d.id, created.id);
  }

  console.log("Seeding: findings...");
  const findingIds: string[] = [];
  let findingCounter = 1;
  for (const d of DOMAINS_SEED) {
    const numFindings = 2 + ((d.id * 7) % 5);
    for (let f = 0; f < numFindings; f++) {
      const r = seededRandom(d.id * 313 + f * 97);
      const severities = [Severity.CRITICAL, Severity.HIGH, Severity.MEDIUM, Severity.LOW];
      const statuses = [FindingStatus.OPEN, FindingStatus.IN_PROGRESS, FindingStatus.RESOLVED, FindingStatus.CLOSED];
      const code = `FND-${String(findingCounter++).padStart(4, "0")}`;
      const evidenceCode = `EV-${String(d.id).padStart(2, "0")}-${String(1 + f * 3).padStart(3, "0")}`;
      const evidence = await prisma.evidence.findUnique({ where: { code: evidenceCode } });
      const created = await prisma.finding.upsert({
        where: { code },
        update: {},
        create: {
          code,
          domainId: d.id,
          auditId: auditIds.get(d.id),
          evidenceId: evidence?.id,
          title: FINDING_TEMPLATES[(d.id * 3 + f) % FINDING_TEMPLATES.length],
          description: `During the assessment of ${d.name.replace("NDI ", "")}, compliance gaps were identified in maturity level ${r(1, 4)} requirements. Remediation actions have been recommended and assigned.`,
          severity: severities[r(0, 3)],
          status: statuses[r(0, 3)],
          assigneeId: pickAuditor(r),
          raisedDate: new Date(`2025-0${1 + (f % 2)}-${String(Math.min(28, 3 + f * 5)).padStart(2, "0")}`),
          dueDate: new Date(`2025-0${2 + (f % 3)}-${String(Math.min(28, 10 + f * 3)).padStart(2, "0")}`),
          remediationPlan:
            "1. Review current practices against NDI framework requirements.\n2. Update documentation and policies accordingly.\n3. Conduct team training within 30 days.\n4. Re-assess and validate compliance within 60 days.",
        },
      });
      findingIds.push(created.id);
    }
  }

  console.log("Seeding: activity log (audit trail)...");
  const activityRows: {
    type: ActivityType; action: string; detail: string; userId: string; domainId: number; refType: string; refId: string; createdAt: Date;
  }[] = [];
  for (let i = 0; i < 60; i++) {
    const tpl = TRAIL_TEMPLATES[i % TRAIL_TEMPLATES.length];
    const d = DOMAINS_SEED[i % DOMAINS_SEED.length];
    const date = new Date(2025, 2, 15);
    date.setDate(date.getDate() - Math.floor(i * 0.5));
    const r = seededRandom(i * 71 + 3);
    activityRows.push({
      type: tpl.type,
      action: tpl.action,
      detail: `${tpl.detail} — ${d.name.replace("NDI ", "")}`,
      userId: pickAuditor(r),
      domainId: d.id,
      refType: tpl.type,
      refId:
        tpl.type === "EVIDENCE"
          ? `EV-${String(d.id).padStart(2, "0")}-${String(1 + (i % 10)).padStart(3, "0")}`
          : tpl.type === "FINDING"
          ? `FND-${String(1 + (i % findingIds.length)).padStart(4, "0")}`
          : `AUD-${String(d.id).padStart(3, "0")}`,
      createdAt: date,
    });
  }
  await prisma.activityLog.createMany({ data: activityRows });

  console.log("Seed complete.");
  console.log(`\nDemo login: admin@ndi.local / ${DEFAULT_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
