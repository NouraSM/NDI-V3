"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { can } from "@/lib/rbac";
import { Modal } from "@/components/modal";
import type { Finding, FindingStatus } from "@/types/api";

const SEV_CLASS: Record<string, string> = { CRITICAL: "sev-critical", HIGH: "sev-high", MEDIUM: "sev-medium", LOW: "sev-low" };
const STATUS_CLASS: Record<string, string> = { OPEN: "fs-open", IN_PROGRESS: "fs-in_progress", RESOLVED: "fs-resolved", CLOSED: "fs-closed" };

export function FindingModal({ findingId, onClose }: { findingId: string; onClose: () => void }) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const canManage = can(session?.user?.role, "MANAGE_FINDINGS");
  const canComment = can(session?.user?.role, "COMMENT");

  const { data } = useQuery({
    queryKey: ["finding", findingId],
    queryFn: () => api.get<{ finding: Finding }>(`/api/findings/${findingId}`),
  });

  const updateStatus = useMutation({
    mutationFn: (status: FindingStatus) => api.patch(`/api/findings/${findingId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finding", findingId] });
      queryClient.invalidateQueries({ queryKey: ["findings"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });

  const addComment = useMutation({
    mutationFn: () => api.post(`/api/findings/${findingId}/comments`, { body: comment }),
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["finding", findingId] });
    },
  });

  const f = data?.finding;
  if (!f) {
    return (
      <Modal title="Finding Detail" onClose={onClose}>
        <div className="empty-state">Loading…</div>
      </Modal>
    );
  }

  const daysOpen = Math.max(0, Math.round((Date.now() - new Date(f.raisedDate).getTime()) / 86400000));

  return (
    <Modal title={`Finding Detail — ${f.code}`} onClose={onClose}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
          <span className={`severity-badge ${SEV_CLASS[f.severity]}`}>{f.severity}</span>
          {canManage ? (
            <select
              className={`finding-status ${STATUS_CLASS[f.status]}`}
              style={{ border: "none", cursor: "pointer" }}
              value={f.status}
              onChange={(e) => updateStatus.mutate(e.target.value as FindingStatus)}
            >
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          ) : (
            <span className={`finding-status ${STATUS_CLASS[f.status]}`}>{f.status.replace("_", " ")}</span>
          )}
          <span style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: 11, color: "var(--text-light)", padding: "4px 8px" }}>
            {f.code}
          </span>
        </div>
        <h4 style={{ fontSize: 15, color: "var(--navy)", marginBottom: 6 }}>{f.title}</h4>
        <p style={{ fontSize: 12, color: "var(--text-light)", lineHeight: 1.6 }}>{f.description}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <InfoBox label="Domain" value={f.domain.name.replace("NDI ", "")} />
        <InfoBox label="Assignee" value={f.assignee?.name ?? "Unassigned"} />
        <InfoBox label="Raised Date" value={new Date(f.raisedDate).toISOString().slice(0, 10)} />
        <InfoBox
          label="Due Date"
          value={`${new Date(f.dueDate).toISOString().slice(0, 10)} (${daysOpen}d open)`}
          color={daysOpen > 30 ? "var(--pink)" : undefined}
        />
        <InfoBox label="Evidence Reference" value={f.evidence?.code ?? "—"} mono />
        <InfoBox label="Days Open" value={`${daysOpen} days`} color={daysOpen > 30 ? "var(--pink)" : "var(--teal)"} bold />
      </div>
      {f.remediationPlan && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--navy)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Remediation Plan
          </div>
          <div style={{ background: "var(--bg)", padding: 14, borderRadius: "var(--radius-sm)", fontSize: 12, lineHeight: 1.8, whiteSpace: "pre-line" }}>
            {f.remediationPlan}
          </div>
        </div>
      )}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--navy)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Comments ({f.comments?.length ?? 0})
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {f.comments?.map((c) => (
            <div key={c.id} style={{ background: "var(--bg)", padding: 10, borderRadius: "var(--radius-sm)", fontSize: 12 }}>
              <strong style={{ color: "var(--navy)" }}>{c.user.name}</strong>{" "}
              <span style={{ color: "var(--text-light)", fontSize: 11 }}>{new Date(c.createdAt).toLocaleString()}</span>
              <div style={{ marginTop: 4 }}>{c.body}</div>
            </div>
          ))}
        </div>
        {canComment && (
          <div className="modal-form-group">
            <textarea placeholder="Add a comment…" value={comment} onChange={(e) => setComment(e.target.value)} />
            <button
              className="modal-submit-btn"
              disabled={!comment.trim() || addComment.isPending}
              onClick={() => addComment.mutate()}
            >
              {addComment.isPending ? "Posting…" : "Post Comment"}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function InfoBox({ label, value, color, mono, bold }: { label: string; value: string; color?: string; mono?: boolean; bold?: boolean }) {
  return (
    <div style={{ background: "var(--bg)", padding: 12, borderRadius: "var(--radius-sm)" }}>
      <div style={{ fontSize: 10, color: "var(--text-light)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div
        style={{
          fontSize: 13,
          fontWeight: bold ? 700 : 600,
          color: color ?? "var(--text)",
          fontFamily: mono ? "var(--font-space-mono), monospace" : undefined,
        }}
      >
        {value}
      </div>
    </div>
  );
}
