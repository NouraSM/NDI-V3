"use client";

import { Suspense, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { usePeriodLabel } from "@/hooks/use-period-label";
import type { Domain, Period } from "@/types/api";
import { ExcelPanel } from "./excel-panel";
import { PbiPanel } from "./pbi-panel";
import { AuditPanel } from "./audit-panel";

type Tab = "excel" | "pbi" | "audit";

interface DomainDetailResponse {
  domain: Domain;
  period: Period;
  snapshot: { targetEvidence: number; completeCount: number; partialCount: number; incompleteCount: number; complianceScore: number };
}

function DomainDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const domainId = Number(params.id);
  const periodLabel = usePeriodLabel();
  const [tab, setTab] = useState<Tab>("excel");

  const { data } = useQuery({
    queryKey: ["domain-detail", domainId, periodLabel],
    queryFn: () => api.get<DomainDetailResponse>(`/api/domains/${domainId}?period=${periodLabel}`),
    enabled: !!periodLabel,
  });

  if (!data) return <div className="domain-detail-content empty-state">Loading…</div>;
  const { domain, snapshot } = data;
  const shortName = domain.name.replace("NDI ", "").replace(" Domain", "");

  return (
    <div className="domain-detail-content">
      <div className="domain-header-bar">
        <div>
          <div className="breadcrumb">
            <a onClick={() => router.push("/")}>Overall</a>
            <span>›</span>
            <a onClick={() => router.push("/dashboard")}>NDI Dashboard</a>
            <span>›</span>
            <span>{domain.shortCode}</span>
          </div>
          <h2>
            <span>NDI</span> {shortName}
          </h2>
        </div>
      </div>

      <div className="domain-kpi-row">
        <div className="domain-kpi teal animate-in">
          <div className="domain-kpi-label">Total Evidences</div>
          <div className="domain-kpi-value">{snapshot.targetEvidence}</div>
        </div>
        <div className="domain-kpi animate-in" style={{ borderLeftColor: "var(--teal)" }}>
          <div className="domain-kpi-label">Complete</div>
          <div className="domain-kpi-value" style={{ color: "var(--teal)" }}>
            {snapshot.completeCount}
          </div>
        </div>
        <div className="domain-kpi amber animate-in">
          <div className="domain-kpi-label">Partial</div>
          <div className="domain-kpi-value" style={{ color: "var(--amber)" }}>
            {snapshot.partialCount}
          </div>
        </div>
        <div className="domain-kpi pink animate-in">
          <div className="domain-kpi-label">Incomplete</div>
          <div className="domain-kpi-value" style={{ color: "var(--pink)" }}>
            {snapshot.incompleteCount}
          </div>
        </div>
      </div>

      <div className="section-tabs">
        <button className={`section-tab${tab === "excel" ? " active" : ""}`} onClick={() => setTab("excel")}>
          📊 Excel Data Sheet
        </button>
        <button className={`section-tab${tab === "pbi" ? " active" : ""}`} onClick={() => setTab("pbi")}>
          📈 Power BI Dashboard
        </button>
        <button className={`section-tab${tab === "audit" ? " active" : ""}`} onClick={() => setTab("audit")}>
          🔍 Audit & Findings
        </button>
      </div>

      {tab === "excel" && periodLabel && <ExcelPanel domainId={domainId} domainName={domain.name} periodLabel={periodLabel} />}
      {tab === "pbi" && periodLabel && (
        <PbiPanel
          domainId={domainId}
          periodLabel={periodLabel}
          complete={snapshot.completeCount}
          partial={snapshot.partialCount}
          incomplete={snapshot.incompleteCount}
          total={snapshot.targetEvidence}
          complianceScore={snapshot.complianceScore}
        />
      )}
      {tab === "audit" && <AuditPanel domainId={domainId} />}
    </div>
  );
}

export default function DomainDetailPage() {
  return (
    <Suspense fallback={<div className="domain-detail-content empty-state">Loading…</div>}>
      <DomainDetailContent />
    </Suspense>
  );
}
