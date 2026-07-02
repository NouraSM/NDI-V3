"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Audit, Finding, ActivityEntry } from "@/types/api";
import { FindingModal } from "@/components/finding-modal";

const SEV_CLASS: Record<string, string> = { CRITICAL: "sev-critical", HIGH: "sev-high", MEDIUM: "sev-medium", LOW: "sev-low" };
const STATUS_CLASS: Record<string, string> = { OPEN: "fs-open", IN_PROGRESS: "fs-in_progress", RESOLVED: "fs-resolved", CLOSED: "fs-closed" };
const SEV_COLOR: Record<string, string> = { CRITICAL: "var(--pink)", HIGH: "#e74c3c", MEDIUM: "var(--amber)", LOW: "var(--teal)" };

export function AuditPanel({ domainId }: { domainId: number }) {
  const [openFinding, setOpenFinding] = useState<string | null>(null);

  const { data: auditsData } = useQuery({
    queryKey: ["audits"],
    queryFn: () => api.get<{ audits: Audit[] }>("/api/audits"),
  });
  const { data: findingsData } = useQuery({
    queryKey: ["findings", { domainId }],
    queryFn: () => api.get<{ findings: Finding[] }>(`/api/findings?domainId=${domainId}`),
  });
  const { data: activityData } = useQuery({
    queryKey: ["activity", { domainId }],
    queryFn: () => api.get<{ activity: ActivityEntry[] }>(`/api/activity?domainId=${domainId}&limit=10`),
  });

  const domainAudit = auditsData?.audits.find((a) => a.domainId === domainId);
  const findings = findingsData?.findings ?? [];
  const openCount = findings.filter((f) => f.status === "OPEN" || f.status === "IN_PROGRESS").length;
  const resolvedCount = findings.filter((f) => f.status === "RESOLVED" || f.status === "CLOSED").length;
  const bannerColor = domainAudit?.status === "COMPLETED" ? "var(--teal)" : "var(--amber)";

  return (
    <div>
      <div className="chart-card" style={{ borderLeft: `4px solid ${bannerColor}`, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>
              Audit Status: {domainAudit ? domainAudit.status.replace("_", " ") : "Not Scheduled"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-light)" }}>
              Lead: {domainAudit?.leadAuditor.name ?? "—"} · Scheduled:{" "}
              {domainAudit ? new Date(domainAudit.scheduledDate).toISOString().slice(0, 10) : "—"} · Due:{" "}
              {domainAudit ? new Date(domainAudit.dueDate).toISOString().slice(0, 10) : "—"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Stat value={openCount} label="Open" color="var(--pink)" />
            <Stat value={resolvedCount} label="Resolved" color="var(--teal)" />
            <Stat value={findings.length} label="Total" color="var(--navy)" />
          </div>
        </div>
      </div>

      <div className="domain-audit-section">
        <div className="domain-audit-header">
          <h4>Findings ({findings.length})</h4>
        </div>
        {findings.map((f) => (
          <button className="finding-card" key={f.id} onClick={() => setOpenFinding(f.id)}>
            <div className="finding-card-severity" style={{ background: SEV_COLOR[f.severity] }} />
            <div className="finding-card-body">
              <div className="finding-card-title">{f.title}</div>
              <div className="finding-card-meta">
                <span>
                  <span className={`severity-badge ${SEV_CLASS[f.severity]}`}>{f.severity}</span>
                </span>
                <span>
                  <span className={`finding-status ${STATUS_CLASS[f.status]}`}>{f.status.replace("_", " ")}</span>
                </span>
                <span>📎 {f.evidence?.code ?? "—"}</span>
                <span>👤 {f.assignee?.name ?? "Unassigned"}</span>
              </div>
            </div>
          </button>
        ))}
        {findings.length === 0 && <div className="empty-state">No findings recorded for this domain.</div>}
      </div>

      <div className="domain-audit-section">
        <div className="domain-audit-header">
          <h4>Recent Activity</h4>
        </div>
        <div className="trail-timeline">
          {activityData?.activity.map((t) => (
            <div className="trail-item" key={t.id}>
              <div className={`trail-dot ${t.type.toLowerCase()}`} />
              <div className="trail-body">
                <div className="trail-header">
                  <div className="trail-action">
                    <span className={`trail-tag ${t.type.toLowerCase()}`}>{t.type}</span> {t.action}
                  </div>
                  <div className="trail-time">{new Date(t.createdAt).toLocaleString()}</div>
                </div>
                <div className="trail-detail">
                  <span className="trail-user">{t.user?.name ?? "System"}</span> — {t.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {openFinding && <FindingModal findingId={openFinding} onClose={() => setOpenFinding(null)} />}
    </div>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 10, color: "var(--text-light)", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}
