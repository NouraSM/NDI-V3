"use client";

import { Suspense, useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { can } from "@/lib/rbac";
import { usePeriodLabel } from "@/hooks/use-period-label";
import type { Audit, Finding } from "@/types/api";
import { ScheduleTab } from "./schedule-tab";
import { FindingsTab } from "./findings-tab";
import { TrailTab } from "./trail-tab";
import { ReportsTab } from "./reports-tab";
import { NewAuditModal } from "./new-audit-modal";

type Tab = "schedule" | "findings" | "trail" | "reports";

function AuditCenterContent() {
  const { data: session } = useSession();
  const periodLabel = usePeriodLabel();
  const [tab, setTab] = useState<Tab>("schedule");
  const [showNewAudit, setShowNewAudit] = useState(false);
  const canManageAudits = can(session?.user?.role, "MANAGE_AUDITS");

  const { data: auditsData } = useQuery({ queryKey: ["audits"], queryFn: () => api.get<{ audits: Audit[] }>("/api/audits") });
  const { data: findingsData } = useQuery({
    queryKey: ["findings", { severity: "all", status: "all", domainId: "all" }],
    queryFn: () => api.get<{ findings: Finding[] }>("/api/findings?severity=all&status=all&domainId=all"),
  });

  const audits = auditsData?.audits ?? [];
  const findings = findingsData?.findings ?? [];
  const totalFindings = findings.length;
  const openFindings = findings.filter((f) => f.status === "OPEN").length;
  const criticalOpen = findings.filter((f) => f.severity === "CRITICAL" && f.status !== "CLOSED").length;
  const resolvedPct = totalFindings ? Math.round((findings.filter((f) => f.status === "RESOLVED" || f.status === "CLOSED").length / totalFindings) * 100) : 0;
  const completedAudits = audits.filter((a) => a.status === "COMPLETED").length;

  return (
    <div className="audit-content">
      <div className="audit-page-header">
        <div>
          <div className="breadcrumb">
            <a href="/">Overall</a>
            <span>›</span>
            <span>Audit Center</span>
          </div>
          <h2>Audit Center</h2>
        </div>
        {canManageAudits && (
          <button className="audit-action-btn" onClick={() => setShowNewAudit(true)}>
            + Schedule New Audit
          </button>
        )}
      </div>

      <div className="kpi-row">
        <div className="kpi-card animate-in">
          <div className="kpi-label">Total Findings</div>
          <div className="kpi-value">{totalFindings}</div>
          <div className="kpi-delta down">Across all domains</div>
        </div>
        <div className="kpi-card animate-in">
          <div className="kpi-label">Open Findings</div>
          <div className="kpi-value" style={{ color: "var(--pink)" }}>
            {openFindings}
          </div>
          <div className="kpi-delta down">Requires attention</div>
        </div>
        <div className="kpi-card animate-in">
          <div className="kpi-label">Critical (Unresolved)</div>
          <div className="kpi-value" style={{ color: "#c9223f" }}>
            {criticalOpen}
          </div>
          <div className="kpi-delta down">High priority</div>
        </div>
        <div className="kpi-card animate-in">
          <div className="kpi-label">Resolution Rate</div>
          <div className="kpi-value" style={{ color: "var(--teal)" }}>
            {resolvedPct}%
          </div>
          <div className="kpi-delta up">Resolved or closed</div>
        </div>
        <div className="kpi-card animate-in">
          <div className="kpi-label">Audits Completed</div>
          <div className="kpi-value" style={{ color: "var(--purple)" }}>
            {completedAudits}/{audits.length}
          </div>
          <div className="kpi-delta up">This cycle</div>
        </div>
      </div>

      <div className="overview-tabs" style={{ marginBottom: 20 }}>
        <button className={`overview-tab${tab === "schedule" ? " active" : ""}`} onClick={() => setTab("schedule")}>
          Audit Schedule
        </button>
        <button className={`overview-tab${tab === "findings" ? " active" : ""}`} onClick={() => setTab("findings")}>
          All Findings
        </button>
        <button className={`overview-tab${tab === "trail" ? " active" : ""}`} onClick={() => setTab("trail")}>
          Activity Trail
        </button>
        <button className={`overview-tab${tab === "reports" ? " active" : ""}`} onClick={() => setTab("reports")}>
          Reports & Export
        </button>
      </div>

      {tab === "schedule" && <ScheduleTab />}
      {tab === "findings" && <FindingsTab />}
      {tab === "trail" && <TrailTab />}
      {tab === "reports" && periodLabel && <ReportsTab periodLabel={periodLabel} />}

      {showNewAudit && <NewAuditModal onClose={() => setShowNewAudit(false)} />}
    </div>
  );
}

export default function AuditCenterPage() {
  return (
    <Suspense fallback={<div className="audit-content empty-state">Loading…</div>}>
      <AuditCenterContent />
    </Suspense>
  );
}
