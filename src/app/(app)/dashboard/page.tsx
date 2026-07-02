"use client";

import { Suspense, useState } from "react";
import { usePeriodLabel } from "@/hooks/use-period-label";
import { OverviewTab } from "./overview-tab";
import { DomainwiseTab } from "./domainwise-tab";
import { DiagnosticTab } from "./diagnostic-tab";

type TabId = "overview" | "domainwise" | "diagnostic";

function DashboardContent() {
  const periodLabel = usePeriodLabel();
  const [tab, setTab] = useState<TabId>("overview");

  return (
    <div className="overview-content">
      <div className="overview-tabs">
        <button className={`overview-tab${tab === "overview" ? " active" : ""}`} onClick={() => setTab("overview")}>
          Overview
        </button>
        <button className={`overview-tab${tab === "domainwise" ? " active" : ""}`} onClick={() => setTab("domainwise")}>
          Domain-Wise Analysis
        </button>
        <button className={`overview-tab${tab === "diagnostic" ? " active" : ""}`} onClick={() => setTab("diagnostic")}>
          Diagnostic Analysis
        </button>
      </div>

      {!periodLabel ? (
        <div className="empty-state">Loading…</div>
      ) : (
        <>
          {tab === "overview" && <OverviewTab periodLabel={periodLabel} />}
          {tab === "domainwise" && <DomainwiseTab periodLabel={periodLabel} />}
          {tab === "diagnostic" && <DiagnosticTab periodLabel={periodLabel} />}
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="overview-content empty-state">Loading…</div>}>
      <DashboardContent />
    </Suspense>
  );
}
