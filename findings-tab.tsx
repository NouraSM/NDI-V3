"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Domain, Finding } from "@/types/api";
import { MaturityBars } from "@/components/charts/simple-bars";
import { FindingModal } from "@/components/finding-modal";

const SEV_CLASS: Record<string, string> = { CRITICAL: "sev-critical", HIGH: "sev-high", MEDIUM: "sev-medium", LOW: "sev-low" };
const STATUS_CLASS: Record<string, string> = { OPEN: "fs-open", IN_PROGRESS: "fs-in_progress", RESOLVED: "fs-resolved", CLOSED: "fs-closed" };
const SEV_COLOR: Record<string, string> = { CRITICAL: "var(--pink)", HIGH: "#e74c3c", MEDIUM: "var(--amber)", LOW: "var(--teal)" };
const ST_COLOR: Record<string, string> = { OPEN: "var(--pink)", IN_PROGRESS: "var(--amber)", RESOLVED: "var(--teal)", CLOSED: "var(--text-light)" };

export function FindingsTab() {
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const [domainId, setDomainId] = useState("all");
  const [openFinding, setOpenFinding] = useState<string | null>(null);

  const { data: domainsData } = useQuery({ queryKey: ["domains"], queryFn: () => api.get<{ domains: Domain[] }>("/api/domains") });
  const { data } = useQuery({
    queryKey: ["findings", { severity, status, domainId }],
    queryFn: () => api.get<{ findings: Finding[] }>(`/api/findings?severity=${severity}&status=${status}&domainId=${domainId}`),
  });

  const findings = data?.findings ?? [];
  const sevCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  const stCounts = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 };
  findings.forEach((f) => {
    sevCounts[f.severity]++;
    stCounts[f.status]++;
  });

  return (
    <div>
      <div className="filter-row">
        <span className="filter-label">Severity:</span>
        <select className="filter-select" value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="all">All</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <span className="filter-label">Status:</span>
        <select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
        <span className="filter-label">Domain:</span>
        <select className="filter-select" value={domainId} onChange={(e) => setDomainId(e.target.value)}>
          <option value="all">All Domains</option>
          {domainsData?.domains.map((d) => (
            <option key={d.id} value={d.id}>
              {d.shortCode}
            </option>
          ))}
        </select>
      </div>

      <div className="charts-grid">
        <div className="chart-card animate-in">
          <div className="chart-title">Findings by Severity</div>
          <div className="chart-subtitle">Distribution across severity levels</div>
          <MaturityBars
            bars={Object.entries(sevCounts).map(([k, v]) => ({ label: k, value: v, color: SEV_COLOR[k] }))}
          />
        </div>
        <div className="chart-card animate-in">
          <div className="chart-title">Findings by Status</div>
          <div className="chart-subtitle">Current resolution status</div>
          <MaturityBars
            bars={Object.entries(stCounts).map(([k, v]) => ({ label: k.replace("_", " "), value: v, color: ST_COLOR[k] }))}
          />
        </div>
      </div>

      <div className="chart-card full">
        <div className="chart-title">All Audit Findings</div>
        <div className="chart-subtitle">Click any finding to view details</div>
        <table className="audit-schedule-tbl">
          <thead>
            <tr>
              <th>ID</th>
              <th>Domain</th>
              <th>Title</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Assignee</th>
              <th>Days Open</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            {findings.map((f) => {
              const daysOpen = Math.max(0, Math.round((Date.now() - new Date(f.raisedDate).getTime()) / 86400000));
              return (
                <tr key={f.id} onClick={() => setOpenFinding(f.id)} style={{ cursor: "pointer" }}>
                  <td style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: 11, fontWeight: 700 }}>{f.code}</td>
                  <td style={{ fontWeight: 600 }}>{f.domain.shortCode}</td>
                  <td style={{ maxWidth: 260, whiteSpace: "normal", lineHeight: 1.3 }}>{f.title}</td>
                  <td>
                    <span className={`severity-badge ${SEV_CLASS[f.severity]}`}>{f.severity}</span>
                  </td>
                  <td>
                    <span className={`finding-status ${STATUS_CLASS[f.status]}`}>{f.status.replace("_", " ")}</span>
                  </td>
                  <td>{f.assignee?.name ?? "Unassigned"}</td>
                  <td style={{ fontWeight: 700, color: daysOpen > 30 ? "var(--pink)" : "var(--text)" }}>{daysOpen}d</td>
                  <td style={{ fontSize: 12, color: "var(--text-light)" }}>{new Date(f.dueDate).toISOString().slice(0, 10)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {openFinding && <FindingModal findingId={openFinding} onClose={() => setOpenFinding(null)} />}
    </div>
  );
}
