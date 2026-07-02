"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Domain, MaturityResponse, TrendPoint } from "@/types/api";
import { GroupedBars } from "@/components/charts/simple-bars";
import { TrendChart } from "@/components/charts/trend-chart";

const SERIES = [
  { label: "Complete", color: "var(--teal)" },
  { label: "Incomplete", color: "var(--pink)" },
  { label: "Partial", color: "var(--amber)" },
];

export function DomainwiseTab({ periodLabel }: { periodLabel: string }) {
  const { data: domainsData } = useQuery({
    queryKey: ["domains"],
    queryFn: () => api.get<{ domains: Domain[] }>("/api/domains"),
  });
  const domains = domainsData?.domains ?? [];
  const [domainId, setDomainId] = useState<number | null>(null);
  const activeDomainId = domainId ?? domains[0]?.id ?? null;
  const activeDomain = domains.find((d) => d.id === activeDomainId);

  const { data: maturity } = useQuery({
    queryKey: ["dashboard-maturity", periodLabel, activeDomainId],
    queryFn: () => api.get<MaturityResponse>(`/api/dashboard/maturity?period=${periodLabel}&domainId=${activeDomainId}`),
    enabled: !!activeDomainId,
  });
  const { data: trendData } = useQuery({
    queryKey: ["dashboard-trend", activeDomainId],
    queryFn: () => api.get<{ trend: TrendPoint[] }>(`/api/dashboard/trend?domainId=${activeDomainId}`),
    enabled: !!activeDomainId,
  });

  if (!domains.length) return <div className="empty-state">Loading…</div>;

  const countGroups = (maturity?.levels ?? []).map((m) => ({ label: String(m.level), values: [m.complete, m.incomplete, m.partial] }));
  const pctGroups = (maturity?.levels ?? []).map((m) => {
    const tot = m.total || 1;
    return {
      label: String(m.level),
      values: [Math.round((m.complete / tot) * 100), Math.round((m.incomplete / tot) * 100), Math.round((m.partial / tot) * 100)],
    };
  });

  return (
    <div>
      <div className="filter-row">
        <span className="filter-label">Domain:</span>
        <select className="filter-select" value={activeDomainId ?? ""} onChange={(e) => setDomainId(Number(e.target.value))}>
          {domains.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name.replace("NDI ", "").replace(" Domain", "")}
            </option>
          ))}
        </select>
      </div>
      <div className="charts-grid">
        <div className="chart-card animate-in">
          <div className="chart-title">Evidence Distribution by Maturity Level (Count)</div>
          <div className="chart-subtitle">Domain: {activeDomain?.name.replace("NDI ", "").replace(" Domain", "")}</div>
          <div className="chart-area">
            {maturity?.hasDetailedData ? (
              <GroupedBars groups={countGroups} series={SERIES} />
            ) : (
              <div className="empty-state">Detailed evidence data is only available for the current quarter.</div>
            )}
          </div>
        </div>
        <div className="chart-card animate-in">
          <div className="chart-title">Evidence Distribution by Maturity Level (%)</div>
          <div className="chart-subtitle">Domain: {activeDomain?.name.replace("NDI ", "").replace(" Domain", "")}</div>
          <div className="chart-area">
            {maturity?.hasDetailedData ? (
              <GroupedBars groups={pctGroups} series={SERIES} />
            ) : (
              <div className="empty-state">Detailed evidence data is only available for the current quarter.</div>
            )}
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
