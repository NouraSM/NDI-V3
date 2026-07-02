"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { MaturityResponse, TrendPoint } from "@/types/api";
import { Donut } from "@/components/charts/donut";
import { Gauge } from "@/components/charts/gauge";
import { GroupedBars } from "@/components/charts/simple-bars";
import { TrendChart } from "@/components/charts/trend-chart";

const SERIES = [
  { label: "Complete", color: "var(--teal)" },
  { label: "Incomplete", color: "var(--pink)" },
  { label: "Partial", color: "var(--amber)" },
];

export function PbiPanel({
  domainId,
  periodLabel,
  complete,
  partial,
  incomplete,
  total,
  complianceScore,
}: {
  domainId: number;
  periodLabel: string;
  complete: number;
  partial: number;
  incomplete: number;
  total: number;
  complianceScore: number;
}) {
  const { data: maturity } = useQuery({
    queryKey: ["dashboard-maturity", periodLabel, domainId],
    queryFn: () => api.get<MaturityResponse>(`/api/dashboard/maturity?period=${periodLabel}&domainId=${domainId}`),
  });
  const { data: trendData } = useQuery({
    queryKey: ["dashboard-trend", domainId],
    queryFn: () => api.get<{ trend: TrendPoint[] }>(`/api/dashboard/trend?domainId=${domainId}`),
  });

  const countGroups = (maturity?.levels ?? []).map((m) => ({
    label: `ML ${m.level}`,
    values: [m.complete, m.incomplete, m.partial],
  }));

  return (
    <div className="pbi-grid">
      <div className="pbi-card animate-in">
        <h4>Evidence Status Breakdown</h4>
        <div className="chart-subtitle">Distribution of evidence completion status</div>
        <div className="donut-container">
          <Donut
            data={[
              { label: "Complete", value: complete, color: "var(--teal)" },
              { label: "Partial", value: partial, color: "var(--amber)" },
              { label: "Incomplete", value: incomplete, color: "var(--pink)" },
            ]}
            total={total}
          />
        </div>
      </div>
      <div className="pbi-card animate-in">
        <h4>Compliance Score</h4>
        <div className="chart-subtitle">Overall domain compliance for {periodLabel}</div>
        <Gauge pct={complianceScore} label="Domain Compliance" />
      </div>
      <div className="pbi-card full animate-in">
        <h4>Evidence Distribution by Maturity Level</h4>
        <div className="chart-subtitle">Count of evidences at each maturity level by status</div>
        <div className="chart-area">
          {maturity?.hasDetailedData ? (
            <GroupedBars groups={countGroups} series={SERIES} />
          ) : (
            <div className="empty-state">Detailed evidence data is only available for the current quarter.</div>
          )}
        </div>
      </div>
      <div className="pbi-card full animate-in">
        <h4>Evidence Completion Trend</h4>
        <div className="chart-subtitle">Historical trend across all tracked assessment periods</div>
        <div className="chart-area">{trendData ? <TrendChart trend={trendData.trend} /> : null}</div>
      </div>
    </div>
  );
}
