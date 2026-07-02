export type Role = "ADMIN" | "DATA_STEWARD" | "AUDITOR" | "VIEWER";
export type EvidenceStatus = "COMPLETE" | "PARTIAL" | "INCOMPLETE";
export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type FindingStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type AuditStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
export type ActivityType = "EVIDENCE" | "FINDING" | "AUDIT" | "SYSTEM";

export interface Domain {
  id: number;
  name: string;
  shortCode: string;
  color: string;
  description: string | null;
  sortOrder: number;
  steward: { id: string; name: string } | null;
}

export interface Period {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface DashboardDomainRow {
  id: number;
  name: string;
  shortCode: string;
  color: string;
  total: number;
  complete: number;
  partial: number;
  incomplete: number;
  complianceScore: number;
}

export interface DashboardOverview {
  period: { id: string; label: string };
  kpis: { total: number; complete: number; partial: number; incomplete: number; complianceScore: number };
  domains: DashboardDomainRow[];
}

export interface MaturityLevelRow {
  level: number;
  complete: number;
  partial: number;
  incomplete: number;
  total: number;
  compliancePct: number;
}

export interface MaturityResponse {
  period: { id: string; label: string };
  hasDetailedData: boolean;
  levels: MaturityLevelRow[];
}

export interface HeatmapResponse {
  period: { id: string; label: string };
  hasDetailedData: boolean;
  byDomain: Record<number, MaturityLevelRow[]>;
}

export interface TrendPoint {
  period: string;
  complete: number;
  partial: number;
  incomplete: number;
}

export interface EvidenceItem {
  id: string;
  code: string;
  domainId: number;
  periodId: string;
  description: string;
  subArea: string;
  maturityLevel: number;
  status: EvidenceStatus;
  score: number;
  assessor: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Audit {
  id: string;
  code: string;
  domainId: number;
  domain: Domain;
  leadAuditor: { id: string; name: string };
  type: string;
  scheduledDate: string;
  dueDate: string;
  status: AuditStatus;
  completionPct: number;
  _count?: { findings: number };
}

export interface Finding {
  id: string;
  code: string;
  domainId: number;
  domain: { id: number; name: string; shortCode: string };
  auditId: string | null;
  evidenceId: string | null;
  evidence?: { id: string; code: string } | null;
  title: string;
  description: string;
  severity: Severity;
  status: FindingStatus;
  assignee: { id: string; name: string } | null;
  raisedDate: string;
  dueDate: string;
  remediationPlan: string | null;
  comments?: { id: string; body: string; user: { id: string; name: string }; createdAt: string }[];
}

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  action: string;
  detail: string;
  user: { id: string; name: string } | null;
  domain: { id: number; shortCode: string } | null;
  refType: string | null;
  refId: string | null;
  createdAt: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}
