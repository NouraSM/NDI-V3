import { z } from "zod";

export const evidenceStatusEnum = z.enum(["COMPLETE", "PARTIAL", "INCOMPLETE"]);
export const severityEnum = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);
export const findingStatusEnum = z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]);
export const auditStatusEnum = z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "OVERDUE"]);
export const auditTypeEnum = z.enum(["FULL_ASSESSMENT", "FOLLOW_UP_REVIEW", "SPOT_CHECK", "COMPLIANCE_VERIFICATION"]);

export const createEvidenceSchema = z.object({
  domainId: z.number().int().positive(),
  periodId: z.string().min(1),
  description: z.string().min(3).max(500),
  subArea: z.string().min(1).max(100),
  maturityLevel: z.number().int().min(0).max(5),
  status: evidenceStatusEnum,
  score: z.number().int().min(0).max(100),
  assessorId: z.string().optional(),
});

export const updateEvidenceSchema = createEvidenceSchema.partial().omit({ domainId: true, periodId: true });

export const createAuditSchema = z.object({
  domainId: z.number().int().positive(),
  leadAuditorId: z.string().min(1),
  type: auditTypeEnum.default("FULL_ASSESSMENT"),
  scheduledDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  scopeNotes: z.string().max(2000).optional(),
  priorityLevels: z.string().max(100).optional(),
});

export const updateAuditSchema = z.object({
  status: auditStatusEnum.optional(),
  completionPct: z.number().int().min(0).max(100).optional(),
  leadAuditorId: z.string().optional(),
  dueDate: z.coerce.date().optional(),
});

export const createFindingSchema = z.object({
  domainId: z.number().int().positive(),
  auditId: z.string().optional(),
  evidenceId: z.string().optional(),
  title: z.string().min(3).max(300),
  description: z.string().min(3).max(2000),
  severity: severityEnum,
  assigneeId: z.string().optional(),
  dueDate: z.coerce.date(),
  remediationPlan: z.string().max(2000).optional(),
});

export const updateFindingSchema = z.object({
  status: findingStatusEnum.optional(),
  severity: severityEnum.optional(),
  assigneeId: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  remediationPlan: z.string().max(2000).optional(),
});

export const createCommentSchema = z.object({
  body: z.string().min(1).max(2000),
});
