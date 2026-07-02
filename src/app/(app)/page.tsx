"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { usePeriodLabel } from "@/hooks/use-period-label";
import type { DashboardOverview } from "@/types/api";
import { Gauge } from "@/components/charts/gauge";

function OverallContent() {
  const router = useRouter();
  const periodLabel = usePeriodLabel();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-overview", periodLabel],
    queryFn: () => api.get<DashboardOverview>(`/api/dashboard/overview?period=${periodLabel}`),
    enabled: !!periodLabel,
  });

  if (isLoading || !data) return <div className="overall-content empty-state">Loading…</div>;
  if (isError) return <div className="overall-content empty-state">Failed to load dashboard data.</div>;

  const { kpis, domains } = data;
  const bottom5 = [...domains].sort((a, b) => a.complianceScore - b.complianceScore).slice(0, 5);

  return (
    <div className="overall-content">
      <div className="overall-hero animate-in">
        <div className="overall-hero-inner">
          <h1>
            Sutherland <span>Enterprise Data Management Office</span>
          </h1>
          <p>
            Comprehensive NDI compliance assessment across {domains.length} data management domains. Monitor
            maturity levels, track evidence completion, and drive data governance excellence.
          </p>
          <div className="overall-stats-strip">
            <div className="overall-stat">
              <div className="overall-stat-value">{domains.length}</div>
              <div className="overall-stat-label">NDI Domains</div>
            </div>
            <div className="overall-stat">
              <div className="overall-stat-value">{kpis.total}</div>
              <div className="overall-stat-label">Total Evidences</div>
            </div>
            <div className="overall-stat">
              <div className="overall-stat-value teal">{kpis.complete}</div>
              <div className="overall-stat-label">Complete</div>
            </div>
            <div className="overall-stat">
              <div className="overall-stat-value amber">{kpis.partial}</div>
              <div className="overall-stat-label">Partial</div>
            </div>
            <div className="overall-stat">
              <div className="overall-stat-value pink-c">{kpis.incomplete}</div>
              <div className="overall-stat-label">Incomplete</div>
            </div>
            <div className="overall-stat">
              <div className="overall-stat-value purple">{kpis.complianceScore}%</div>
              <div className="overall-stat-label">Compliance</div>
            </div>
          </div>
        </div>
      </div>

      <div className="overall-quick-row">
        <div className="quick-card animate-in">
          <h4>Compliance Overview</h4>
          <div className="chart-subtitle">Overall gauge for {data.period.label}</div>
          <Gauge pct={kpis.complianceScore} label="Overall Compliance" />
        </div>
        <div className="quick-card animate-in">
          <h4>Domains Requiring Attention</h4>
          <div className="chart-subtitle">Lowest compliance scores — click to investigate</div>
          <div className="risk-list">
            {bottom5.map((d) => {
              const riskColor = d.complianceScore < 40 ? "var(--pink)" : d.complianceScore < 60 ? "var(--amber)" : "var(--teal)";
              return (
                <button className="risk-item" key={d.id} onClick={() => router.push(`/domains/${d.id}`)}>
                  <div className="risk-dot" style={{ background: riskColor }} />
                  <div className="risk-name">{d.name.replace("NDI ", "").replace(" Domain", "")}</div>
                  <div className="risk-score" style={{ color: riskColor }}>
                    {d.complianceScore}%
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="overall-section-header">
        <h3>All NDI Domains</h3>
        <button className="see-all" onClick={() => router.push("/dashboard")}>
          Open NDI Dashboard →
        </button>
      </div>
      <div className="domain-cards-grid">
        {domains.map((d, i) => {
          const pctColor = d.complianceScore >= 60 ? "var(--teal-dark)" : d.complianceScore >= 40 ? "#c76a00" : "var(--pink)";
          return (
            <button
              key={d.id}
              className="domain-card animate-in"
              style={{ borderTopColor: d.color, animationDelay: `${i * 0.04}s` }}
              onClick={() => router.push(`/domains/${d.id}`)}
            >
              <div className="domain-card-header">
                <div className="domain-card-icon" style={{ background: d.color }}>
                  {d.shortCode.substring(0, 2)}
                </div>
                <div className="domain-card-name">{d.name.replace("NDI ", "")}</div>
              </div>
              <div className="domain-card-metrics">
                <div className="dc-metric">
                  <div className="dc-metric-val" style={{ color: "var(--teal)" }}>
                    {d.complete}
                  </div>
                  <div className="dc-metric-lbl">Complete</div>
                </div>
                <div className="dc-metric">
                  <div className="dc-metric-val" style={{ color: "var(--amber)" }}>
                    {d.partial}
                  </div>
                  <div className="dc-metric-lbl">Partial</div>
                </div>
                <div className="dc-metric">
                  <div className="dc-metric-val" style={{ color: "var(--pink)" }}>
                    {d.incomplete}
                  </div>
                  <div className="dc-metric-lbl">Incomplete</div>
                </div>
              </div>
              <div className="domain-card-progress">
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${d.complianceScore}%`, background: d.color }} />
                </div>
                <div className="domain-card-pct" style={{ color: pctColor }}>
                  {d.complianceScore}%
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function OverallPage() {
  return (
    <Suspense fallback={<div className="overall-content empty-state">Loading…</div>}>
      <OverallContent />
    </Suspense>
  );
}
