"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Audit } from "@/types/api";

export function ScheduleTab() {
  const { data } = useQuery({
    queryKey: ["audits"],
    queryFn: () => api.get<{ audits: Audit[] }>("/api/audits"),
  });

  return (
    <div className="chart-card full">
      <div className="chart-title">Audit Schedule & Calendar</div>
      <div className="chart-subtitle">Upcoming and past audits across all domains</div>
      <table className="audit-schedule-tbl">
        <thead>
          <tr>
            <th>Audit ID</th>
            <th>Domain</th>
            <th>Lead Auditor</th>
            <th>Scheduled</th>
            <th>Due</th>
            <th>Progress</th>
            <th>Findings</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data?.audits.map((a) => {
            const statusClass = "as-" + a.status.toLowerCase();
            const barColor = a.completionPct === 100 ? "var(--teal)" : a.completionPct > 0 ? "var(--amber)" : "var(--border)";
            return (
              <tr key={a.id}>
                <td style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: 11, fontWeight: 700 }}>{a.code}</td>
                <td style={{ fontWeight: 600 }}>{a.domain.shortCode}</td>
                <td>{a.leadAuditor.name}</td>
                <td style={{ fontSize: 12, color: "var(--text-light)" }}>{new Date(a.scheduledDate).toISOString().slice(0, 10)}</td>
                <td style={{ fontSize: 12, color: "var(--text-light)" }}>{new Date(a.dueDate).toISOString().slice(0, 10)}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="progress-bar-bg" style={{ width: 70 }}>
                      <div className="progress-bar-fill" style={{ width: `${a.completionPct}%`, background: barColor }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{a.completionPct}%</span>
                  </div>
                </td>
                <td style={{ fontWeight: 700, textAlign: "center" }}>{a._count?.findings ?? 0}</td>
                <td>
                  <span className={`audit-status ${statusClass}`}>{a.status.replace("_", " ")}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
