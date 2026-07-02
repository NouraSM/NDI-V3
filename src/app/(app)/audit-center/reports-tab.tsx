"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { DashboardOverview, Finding } from "@/types/api";
import { Gauge } from "@/components/charts/gauge";
import { MaturityBars } from "@/components/charts/simple-bars";

const SEV_COLOR: Record<string, string> = { CRITICAL: "var(--pink)", HIGH: "#e74c3c", MEDIUM: "var(--amber)", LOW: "var(--teal)" };

const EXPORTS = [
  { key: "compliance", title: "Full Compliance Report", desc: "Per-domain compliance breakdown for the current quarter (CSV)", icon: "📄", bg: "rgba(239,51,94,0.1)", color: "var(--pink)" },
  { key: "compliance", title: "Executive Summary", desc: "One-page domain compliance overview for leadership (CSV)", icon: "📊", bg: "rgba(124,92,252,0.1)", color: "var(--purple)" },
  { key: "findings", title: "Findings Register (CSV)", desc: "Every finding with severity, status, assignee, and due dates", icon: "📋", bg: "rgba(245,166,35,0.1)", color: "#b37300" },
  { key: "activity", title: "Audit Trail Log (CSV)", desc: "Complete chronological log of all system actions", icon: "🔒", bg: "rgba(0,201,183,0.1)", color: "var(--teal-dark)" },
  { key: "findings?openOnly=1", title: "Remediation Tracker (CSV)", desc: "Open findings with assigned owners and target resolution dates", icon: "🎯", bg: "rgba(52,152,219,0.1)", color: "#3498db" },
  { key: "maturity", title: "Domain Maturity Report (CSV)", desc: "Evidence counts by maturity level per domain", icon: "📈", bg: "rgba(142,68,173,0.1)", color: "#8e44ad" },
];

export function ReportsTab({ periodLabel }: { periodLabel: string }) {
  const { data: overview } = useQuery({
    queryKey: ["dashboard-overview", periodLabel],
    queryFn: () => api.get<DashboardOverview>(`/api/dashboard/overview?period=${periodLabel}`),
  });
  const { data: findingsData } = useQuery({
    queryKey: ["findings", { severity: "all", status: "all", domainId: "all" }],
    queryFn: () => api.get<{ findings: Finding[] }>("/api/findings?severity=all&status=all&domainId=all"),
  });

  const findings = findingsData?.findings ?? [];
  const resolvedRatio = findings.length ? findings.filter((f) => f.status === "RESOLVED" || f.status === "CLOSED").length / findings.length : 0;
  const readiness = overview ? Math.round(overview.kpis.complianceScore * 0.6 + resolvedRatio * 40) : 0;

  const buckets: Record<string, number[]> = { CRITICAL: [], HIGH: [], MEDIUM: [], LOW: [] };
  findings
    .filter((f) => f.status !== "CLOSED")
    .forEach((f) => {
      const days = Math.max(0, Math.round((Date.now() - new Date(f.raisedDate).getTime()) / 86400000));
      buckets[f.severity].push(days);
    });
  const avgAging = Object.fromEntries(
    Object.entries(buckets).map(([sev, days]) => [sev, days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 0])
  );

  return (
    <div>
      <div className="charts-grid">
        <div className="chart-card animate-in">
          <div className="chart-title">Compliance Readiness Report</div>
          <div className="chart-subtitle">Overall audit readiness across all domains</div>
          <Gauge pct={readiness} label="Audit Readiness" />
        </div>
        <div className="chart-card animate-in">
          <div className="chart-title">Finding Aging Analysis</div>
          <div className="chart-subtitle">Average days open by severity (excluding closed)</div>
          <MaturityBars
            bars={Object.entries(avgAging).map(([sev, avg]) => ({ label: sev, value: avg, color: SEV_COLOR[sev], valueLabel: `${avg}d` }))}
          />
        </div>
      </div>
      <div className="chart-card full animate-in">
        <div className="chart-title">Export & Download Reports</div>
        <div className="chart-subtitle">Generate audit reports for stakeholders</div>
        <div className="export-grid">
          {EXPORTS.map((e, i) => (
            <a key={i} className="export-card" href={`/api/exports/${e.key}${e.key.includes("?") ? "&" : "?"}period=${periodLabel}`}>
              <div className="export-icon" style={{ background: e.bg, color: e.color }}>
                {e.icon}
              </div>
              <h5>{e.title}</h5>
              <p>{e.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
