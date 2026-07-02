"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Domain, DashboardOverview, HeatmapResponse, TrendPoint } from "@/types/api";
import { Gauge } from "@/components/charts/gauge";
import { TrendChart } from "@/components/charts/trend-chart";

export function DiagnosticTab({ periodLabel }: { periodLabel: string }) {
  const { data: domainsData } = useQuery({
    queryKey: ["domains"],
    queryFn: () => api.get<{ domains: Domain[] }>("/api/domains"),
  });
  const { data: overview } = useQuery({
    queryKey: ["dashboard-overview", periodLabel],
    queryFn: () => api.get<DashboardOverview>(`/api/dashboard/overview?period=${periodLabel}`),
  });
  const { data: trendData } = useQuery({
    queryKey: ["dashboard-trend-all"],
    queryFn: () => api.get<{ trend: TrendPoint[] }>("/api/dashboard/trend"),
  });

  const shortDomains = (domainsData?.domains ?? []).slice(0, 8);
  const domainIds = shortDomains.map((d) => d.id).join(",");
  // Single batched request for all 8 domains' heatmap rows, instead of one
  // request (and one DB round-trip) per domain.
  const { data: heatmapData } = useQuery({
    queryKey: ["dashboard-heatmap", periodLabel, domainIds],
    queryFn: () => api.get<HeatmapResponse>(`/api/dashboard/heatmap?period=${periodLabel}&domainIds=${domainIds}`),
    enabled: !!periodLabel && shortDomains.length > 0,
  });

  if (!overview || !domainsData) return <div className="empty-state">Loading…</div>;

  return (
    <div>
      <div className="charts-grid">
        <div className="chart-card animate-in">
          <div className="chart-title">Evidence Completion Heatmap</div>
          <div className="chart-subtitle">Maturity Level vs completion % per domain (current quarter)</div>
          <div className="chart-area">
            <div className="heatmap-grid" style={{ gridTemplateColumns: "100px repeat(6, 1fr)" }}>
              <div className="heatmap-header" />
              {Array.from({ length: 6 }, (_, i) => (
                <div className="heatmap-header" style={{ textAlign: "center" }} key={i}>
                  ML {i}
                </div>
              ))}
              {shortDomains.map((d) => {
                const levels = heatmapData?.byDomain[d.id] ?? [];
                return (
                  <div key={d.id} style={{ display: "contents" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", padding: "4px 0" }}>
                      {d.shortCode}
                    </div>
                    {Array.from({ length: 6 }, (_, level) => {
                      const m = levels.find((l) => l.level === level);
                      const pct = m?.compliancePct ?? 0;
                      const bg = pct >= 70 ? "rgba(0,201,183,0.25)" : pct >= 40 ? "rgba(245,166,35,0.25)" : "rgba(239,51,94,0.2)";
                      const fg = pct >= 70 ? "var(--teal-dark)" : pct >= 40 ? "#c76a00" : "var(--pink)";
                      return (
                        <div className="heatmap-cell" style={{ background: bg, color: fg }} key={level}>
                          {pct}%
                          <div className="heatmap-cell-label">
                            {m?.complete ?? 0}/{m?.total ?? 0}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="chart-card animate-in">
          <div className="chart-title">Compliance Score Distribution</div>
          <div className="chart-subtitle">Overall compliance gauge for {periodLabel}</div>
          <div className="chart-area">
            <Gauge pct={overview.kpis.complianceScore} label="Overall Compliance" />
          </div>
        </div>
      </div>
      <div className="chart-card full animate-in">
        <div className="chart-title">Evidence Completion Trend Over Time</div>
        <div className="chart-subtitle">Across all tracked assessment periods</div>
        <div className="chart-area">{trendData ? <TrendChart trend={trendData.trend} /> : null}</div>
      </div>
    </div>
  );
}
