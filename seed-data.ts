// Real NDI assessment reference data, carried over verbatim from the
// original frontend prototype (reference/NDI-Dashboard-original.html).
// This is the only part of the seed that represents actual assessment
// results; everything else derived from it (evidence rows, findings,
// audit trail) is realistic *placeholder* data until the real evidence
// register is supplied — see README "Replacing placeholder data".

export const DOMAINS_SEED = [
  { id: 1, name: "NDI Open Data Domain", shortCode: "OD", color: "#ef335e" },
  { id: 2, name: "NDI Personal Data Protection Domain", shortCode: "PDP", color: "#7c5cfc" },
  { id: 3, name: "NDI Reference and Master Data Management Domain", shortCode: "RMDM", color: "#00c9b7" },
  { id: 4, name: "NDI Business Intelligence and Analytics Domain", shortCode: "BIA", color: "#f5a623" },
  { id: 5, name: "NDI Data Architecture and Modelling Domain", shortCode: "DAM", color: "#3498db" },
  { id: 6, name: "NDI Data Catalog and Meta Data Management Domain", shortCode: "DMCM", color: "#e67e22" },
  { id: 7, name: "NDI Data Classification Domain", shortCode: "DC", color: "#9b59b6" },
  { id: 8, name: "NDI Data Governance Domain", shortCode: "DG", color: "#1abc9c" },
  { id: 9, name: "NDI Data Operations Domain", shortCode: "DO", color: "#e74c3c" },
  { id: 10, name: "NDI Data Quality Domain", shortCode: "DQ", color: "#2ecc71" },
  { id: 11, name: "NDI Data Sharing & Interoperability Domain", shortCode: "DSI", color: "#f39c12" },
  { id: 12, name: "NDI Data Value Realization Domain", shortCode: "DVR", color: "#8e44ad" },
  { id: 13, name: "NDI Document and Content Management Domain", shortCode: "DCM", color: "#16a085" },
  { id: 14, name: "NDI Freedom of Information Domain", shortCode: "FOI", color: "#c0392b" },
] as const;

// Per-domain: completed specs by maturity level [L0,L1,L2,L3,L4,L5], partiallyCompleted, incomplete, target
export const REAL_DATA: Record<number, { levelCompleted: number[]; partial: number; incomplete: number; target: number }> = {
  1: { levelCompleted: [3, 10, 15, 0, 0, 0], partial: 1, incomplete: 5, target: 34 },
  2: { levelCompleted: [3, 7, 8, 0, 0, 0], partial: 3, incomplete: 3, target: 24 },
  3: { levelCompleted: [3, 5, 0, 0, 0, 0], partial: 1, incomplete: 19, target: 28 },
  4: { levelCompleted: [6, 15, 1, 0, 0, 0], partial: 1, incomplete: 32, target: 55 },
  5: { levelCompleted: [2, 9, 0, 0, 0, 0], partial: 0, incomplete: 16, target: 27 },
  6: { levelCompleted: [3, 14, 0, 0, 0, 0], partial: 0, incomplete: 22, target: 39 },
  7: { levelCompleted: [3, 4, 1, 0, 0, 0], partial: 0, incomplete: 15, target: 23 },
  8: { levelCompleted: [7, 12, 17, 0, 0, 0], partial: 3, incomplete: 8, target: 47 },
  9: { levelCompleted: [3, 10, 1, 0, 0, 0], partial: 0, incomplete: 25, target: 39 },
  10: { levelCompleted: [7, 10, 0, 0, 0, 0], partial: 0, incomplete: 26, target: 43 },
  11: { levelCompleted: [4, 15, 6, 0, 0, 0], partial: 1, incomplete: 20, target: 46 },
  12: { levelCompleted: [2, 6, 0, 0, 0, 0], partial: 0, incomplete: 11, target: 19 },
  13: { levelCompleted: [3, 8, 0, 0, 0, 0], partial: 2, incomplete: 23, target: 36 },
  14: { levelCompleted: [2, 3, 10, 0, 0, 0], partial: 0, incomplete: 6, target: 21 },
};

export const PERIODS_SEED = [
  { label: "2024Q2", start: "2024-04-01", end: "2024-06-30", progress: 0.4 },
  { label: "2024Q3", start: "2024-07-01", end: "2024-09-30", progress: 0.6 },
  { label: "2024Q4", start: "2024-10-01", end: "2024-12-31", progress: 0.8 },
  { label: "2025Q1", start: "2025-01-01", end: "2025-03-31", progress: 1 },
] as const;

export const ACTIVE_PERIOD_LABEL = "2025Q1";

export const SEED_USERS = [
  { name: "System Admin", email: "admin@ndi.local", role: "ADMIN" as const },
  { name: "Ahmed K.", email: "ahmed.k@ndi.local", role: "AUDITOR" as const },
  { name: "Sara M.", email: "sara.m@ndi.local", role: "AUDITOR" as const },
  { name: "Omar H.", email: "omar.h@ndi.local", role: "DATA_STEWARD" as const },
  { name: "Nora A.", email: "nora.a@ndi.local", role: "DATA_STEWARD" as const },
  { name: "Khalid R.", email: "khalid.r@ndi.local", role: "DATA_STEWARD" as const },
  { name: "Layla T.", email: "layla.t@ndi.local", role: "AUDITOR" as const },
  { name: "Hassan B.", email: "hassan.b@ndi.local", role: "VIEWER" as const },
];

export const FINDING_TEMPLATES = [
  "Data classification policy not documented for sensitive categories",
  "Access control matrix incomplete — missing role definitions",
  "Metadata catalog missing descriptions for 40% of data assets",
  "Data quality rules not automated — manual checks only",
  "Retention policy not aligned with regulatory requirements",
  "No formal data sharing agreement template in place",
  "Business glossary incomplete — missing critical terms",
  "Data lineage not tracked for key transformation pipelines",
  "Incident response procedure not tested in 12+ months",
  "Master data governance committee meetings not documented",
  "PII inventory not updated since last assessment cycle",
  "Data architecture diagrams outdated — last revision 18+ months",
  "No formal training program for data stewards",
  "KPI definitions inconsistent across reporting systems",
  "Backup and recovery procedures not validated quarterly",
  "Open data catalog missing licensing information",
  "Interoperability standards not adopted across systems",
  "Content management retention schedules not enforced",
  "FOI response process exceeds mandated timeline",
  "Analytics environment lacks proper access logging",
];

export const SUB_AREAS = ["Policy", "Process", "Technology", "People", "Governance", "Metrics", "Standards", "Procedures"];

export const TRAIL_TEMPLATES = [
  { type: "EVIDENCE" as const, action: "Evidence status updated", detail: "changed status" },
  { type: "EVIDENCE" as const, action: "Evidence uploaded", detail: "uploaded supporting document for evidence item" },
  { type: "EVIDENCE" as const, action: "Score recalculated", detail: "automatic score recalculation triggered" },
  { type: "FINDING" as const, action: "Finding raised", detail: "new finding created during audit review" },
  { type: "FINDING" as const, action: "Finding assigned", detail: "finding assigned to team member for remediation" },
  { type: "FINDING" as const, action: "Finding resolved", detail: "remediation completed and evidence attached" },
  { type: "AUDIT" as const, action: "Audit scheduled", detail: "new audit cycle scheduled for domain" },
  { type: "AUDIT" as const, action: "Audit started", detail: "audit fieldwork commenced" },
  { type: "SYSTEM" as const, action: "Compliance report generated", detail: "quarterly compliance report auto-generated" },
  { type: "SYSTEM" as const, action: "Data refresh completed", detail: "all domain data refreshed from source systems" },
];

// Small deterministic PRNG so the seed is reproducible across runs.
export function seededRandom(seed: number) {
  let s = seed;
  return (min: number, max: number) => {
    s = (s * 9301 + 49297) % 233280;
    return Math.floor(min + (s / 233280) * (max - min + 1));
  };
}
