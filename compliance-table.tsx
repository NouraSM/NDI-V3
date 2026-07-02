"use client";

import { useRouter } from "next/navigation";
import type { DashboardDomainRow } from "@/types/api";

export function ComplianceTable({ domains }: { domains: DashboardDomainRow[] }) {
  const router = useRouter();
  return (
    <table className="compliance-table">
      <thead>
        <tr>
          <th>Domain</th>
          <th>Total</th>
          <th>Complete</th>
          <th>Partial</th>
          <th>Incomplete</th>
          <th>Compliance</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {domains.map((d) => {
          const statusClass = d.complianceScore >= 60 ? "ev-complete" : d.complianceScore >= 40 ? "ev-partial" : "ev-incomplete";
          const statusText = d.complianceScore >= 60 ? "On Track" : d.complianceScore >= 40 ? "Needs Attention" : "At Risk";
          return (
            <tr key={d.id} onClick={() => router.push(`/domains/${d.id}`)}>
              <td style={{ fontWeight: 600, color: "var(--navy)" }}>{d.name.replace("NDI ", "").replace(" Domain", "")}</td>
              <td>{d.total}</td>
              <td style={{ color: "var(--teal)", fontWeight: 600 }}>{d.complete}</td>
              <td style={{ color: "var(--amber)", fontWeight: 600 }}>{d.partial}</td>
              <td style={{ color: "var(--pink)", fontWeight: 600 }}>{d.incomplete}</td>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="progress-bar-bg" style={{ width: 80 }}>
                    <div className="progress-bar-fill" style={{ width: `${d.complianceScore}%`, background: d.color }} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{d.complianceScore}%</span>
                </div>
              </td>
              <td>
                <span className={`evidence-status ${statusClass}`}>{statusText}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
