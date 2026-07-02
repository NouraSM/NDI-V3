"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { can } from "@/lib/rbac";
import type { EvidenceItem, EvidenceStatus } from "@/types/api";

const STATUS_CLASS: Record<EvidenceStatus, string> = { COMPLETE: "ev-complete", PARTIAL: "ev-partial", INCOMPLETE: "ev-incomplete" };

export function ExcelPanel({ domainId, domainName, periodLabel }: { domainId: number; domainName: string; periodLabel: string }) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const editable = can(session?.user?.role, "EDIT_EVIDENCE");

  const { data, isLoading } = useQuery({
    queryKey: ["evidence", domainId, periodLabel, search],
    queryFn: () =>
      api.get<{ items: EvidenceItem[]; total: number }>(
        `/api/evidence?domainId=${domainId}&period=${periodLabel}&q=${encodeURIComponent(search)}&pageSize=200`
      ),
  });

  const updateStatus = useMutation({
    mutationFn: (vars: { id: string; status: EvidenceStatus }) => api.patch(`/api/evidence/${vars.id}`, { status: vars.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evidence", domainId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-maturity"] });
    },
  });

  return (
    <div className="excel-card">
      <div className="excel-toolbar">
        <div className="excel-toolbar-left">
          <div className="excel-icon">X</div>
          <h4>{domainName} — Evidence Data</h4>
        </div>
        <input
          type="text"
          className="excel-search"
          placeholder="Search evidences…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="excel-table-wrapper">
        <table className="excel-table">
          <thead>
            <tr>
              <th>Evidence ID</th>
              <th>Description</th>
              <th>Maturity Level</th>
              <th>Status</th>
              <th>Score</th>
              <th>Last Updated</th>
              <th>Assessor</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 20 }}>
                  Loading…
                </td>
              </tr>
            )}
            {data?.items.map((ev) => (
              <tr key={ev.id}>
                <td style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: 11, fontWeight: 700 }}>{ev.code}</td>
                <td>{ev.description}</td>
                <td>
                  <span className={`level-badge lvl-${ev.maturityLevel}`}>{ev.maturityLevel}</span>
                </td>
                <td>
                  {editable ? (
                    <select
                      className={`evidence-status ${STATUS_CLASS[ev.status]}`}
                      style={{ border: "none", cursor: "pointer" }}
                      value={ev.status}
                      onChange={(e) => updateStatus.mutate({ id: ev.id, status: e.target.value as EvidenceStatus })}
                    >
                      <option value="COMPLETE">Complete</option>
                      <option value="PARTIAL">Partial</option>
                      <option value="INCOMPLETE">Incomplete</option>
                    </select>
                  ) : (
                    <span className={`evidence-status ${STATUS_CLASS[ev.status]}`}>{ev.status}</span>
                  )}
                </td>
                <td style={{ fontWeight: 700 }}>{ev.score}</td>
                <td style={{ color: "var(--text-light)", fontSize: 12 }}>{new Date(ev.updatedAt).toISOString().slice(0, 10)}</td>
                <td>{ev.assessor?.name ?? "—"}</td>
              </tr>
            ))}
            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 20, color: "var(--text-light)" }}>
                  No evidence matches your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
