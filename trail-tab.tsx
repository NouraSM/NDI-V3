"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { ActivityEntry } from "@/types/api";

export function TrailTab() {
  const [type, setType] = useState("all");
  const { data } = useQuery({
    queryKey: ["activity", { type }],
    queryFn: () => api.get<{ activity: ActivityEntry[] }>(`/api/activity?type=${type}&limit=30`),
  });

  return (
    <div className="chart-card full">
      <div className="chart-title">Activity Trail</div>
      <div className="chart-subtitle">Complete audit log of all actions, changes, and events</div>
      <div className="filter-row" style={{ marginTop: 12 }}>
        <span className="filter-label">Type:</span>
        <select className="filter-select" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">All Activities</option>
          <option value="EVIDENCE">Evidence Changes</option>
          <option value="FINDING">Finding Updates</option>
          <option value="AUDIT">Audit Actions</option>
          <option value="SYSTEM">System Events</option>
        </select>
      </div>
      <div className="trail-timeline">
        {data?.activity.map((t) => (
          <div className="trail-item" key={t.id}>
            <div className={`trail-dot ${t.type.toLowerCase()}`} />
            <div className="trail-body">
              <div className="trail-header">
                <div className="trail-action">
                  <span className={`trail-tag ${t.type.toLowerCase()}`}>{t.type}</span> {t.action}
                </div>
                <div className="trail-time">{new Date(t.createdAt).toLocaleString()}</div>
              </div>
              <div className="trail-detail">
                <span className="trail-user">{t.user?.name ?? "System"}</span> — {t.detail}
                {t.refId && (
                  <span style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: 10, opacity: 0.6 }}> [{t.refId}]</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
