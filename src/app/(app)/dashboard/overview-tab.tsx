"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { DashboardOverview, MaturityResponse } from "@/types/api";
import { SimpleBars, MaturityBars } from "@/components/charts/simple-bars";
import { ComplianceTable } from "@/components/compliance-table";

export function OverviewTab({ periodLabel }: { periodLabel: string }) {
  const { data: overview } = useQuery({
    queryKey: ["dashboard-overview", periodLabel],
    queryFn: () => api.get<DashboardOverview>(`/api/dashboard/overview?period=${periodLabel}`),
  });
  const { data: maturity } = useQuery({
    queryKey: ["dashboard-maturity", periodLabel],
    queryFn: () => api.get<MaturityResponse>(`/api/dashboard/maturity?period=${periodLabel}`),
  });

  if (!overview) return <div className="empty-state">Loading…</div>;
  const { kpis, domains } = overview;

  return (
    <div>
      <div className="kpi-row">
        <div className="kpi-card animate-in">
          <div className="kpi-label">Total Evidences</div>
          <div className="kpi-value">{kpis.total}</div>
          <div className="kpi-delta up">Across {domains.length} Domains</div>
        </div>
        <div className="kpi-card animate-in">
          <div className="kpi-label">Complete Evidences</div>
          <div className="kpi-value" style={{ color: "var(--teal)" }}>
            {kpis.complete}
          </div>
          <div className="kpi-delta up">{Math.round((kpis.complete / Math.max(kpis.total, 1)) * 100)}% of total</div>
        </div>
        <div className="kpi-card animate-in">
          <div className="kpi-label">Partial Evidences</div>
          <div className="kpi-value" style={{ color: "var(--amber)" }}>
            {kpis.partial}
          </div>
          <div className="kpi-delta up">{Math.round((kpis.partial / Math.max(kpis.total, 1)) * 100)}% of total</div>
        </div>
        <div className="kpi-card animate-in">
          <div className="kpi-label">Incomplete Evidences</div>
          <div className="kpi-value" style={{ color: "var(--pink)" }}>
            {kpis.incomplete}
          </div>
          <div className="kpi-delta down">{Math.round((kpis.incomplete / Math.max(kpis.total, 1)) * 100)}% of total</div>
        </div>
        <div className="kpi-card animate-in">
          <div className="kpi-label">Compliance Score</div>
          <div className="kpi-value" style={{ color: "var(--purple)" }}>
            {kpis.complianceScore}%
          </div>
          <div className="kpi-delta up">{periodLabel}</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card animate-in">
          <div className="chart-title">Complete Evidence Compliance by Domain</div>
          <div className="chart-subtitle">Percentage of fully compliant evidence across all domains</div>
          <div className="chart-area">
            <SimpleBars
              bars={domains.map((d) => ({ label: d.shortCode, value: d.complianceScore, color: d.color, valueLabel: `${d.complianceScore}%` }))}
            />
          </div>
        </div>
        <div className="chart-card animate-in">
          <div className="chart-title">Complete Evidence Compliance by Maturity Level</div>
          <div className="chart-subtitle">Distribution across maturity levels 0–5 (current quarter evidence)</div>
          <div className="chart-area">
            {maturity?.hasDetailedData ? (
              <MaturityBars
                bars={maturity.levels.map((m) => ({
                  label: String(m.level),
                  value: m.compliancePct,
                  color: ["var(--pink)", "var(--pink)", "#e67e22", "var(--teal)", "var(--purple)", "#3498db"][m.level],
                  valueLabel: `${m.compliancePct}%`,
                }))}
              />
            ) : (
              <div className="empty-state">Detailed evidence data is only available for the current quarter.</div>
            )}
          </div>
        </div>
      </div>

      <div className="chart-card full animate-in">
        <div className="chart-title">Domain Compliance Summary</div>
        <div className="chart-subtitle">Click a domain row to view detailed analysis</div>
        <ComplianceTable domains={domains} />
      </div>
    </div>
  );
}
