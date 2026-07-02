"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { api, ClientApiError } from "@/lib/api-client";
import { Modal } from "@/components/modal";
import type { Domain, AppUser } from "@/types/api";

export function NewAuditModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: domainsData } = useQuery({ queryKey: ["domains"], queryFn: () => api.get<{ domains: Domain[] }>("/api/domains") });
  const { data: usersData } = useQuery({ queryKey: ["users"], queryFn: () => api.get<{ users: AppUser[] }>("/api/users") });

  const auditors = (usersData?.users ?? []).filter((u) => u.role === "AUDITOR" || u.role === "ADMIN");

  const [domainId, setDomainId] = useState("");
  const [leadAuditorId, setLeadAuditorId] = useState("");
  const [type, setType] = useState("FULL_ASSESSMENT");
  const [scheduledDate, setScheduledDate] = useState("2025-04-01");
  const [dueDate, setDueDate] = useState("2025-05-01");
  const [scopeNotes, setScopeNotes] = useState("");
  const [priorityLevels, setPriorityLevels] = useState("All Levels (0-5)");
  const [error, setError] = useState("");

  const create = useMutation({
    mutationFn: () =>
      api.post("/api/audits", { domainId: Number(domainId), leadAuditorId, type, scheduledDate, dueDate, scopeNotes, priorityLevels }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audits"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
      onClose();
    },
    onError: (err) => setError(err instanceof ClientApiError ? err.message : "Failed to schedule audit"),
  });

  return (
    <Modal title="Schedule New Audit" onClose={onClose}>
      <div className="modal-form-group">
        <label>Domain</label>
        <select value={domainId} onChange={(e) => setDomainId(e.target.value)}>
          <option value="">Select a domain…</option>
          {domainsData?.domains.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name.replace("NDI ", "")}
            </option>
          ))}
        </select>
      </div>
      <div className="modal-form-row">
        <div className="modal-form-group">
          <label>Lead Auditor</label>
          <select value={leadAuditorId} onChange={(e) => setLeadAuditorId(e.target.value)}>
            <option value="">Select an auditor…</option>
            {auditors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="modal-form-group">
          <label>Audit Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="FULL_ASSESSMENT">Full Assessment</option>
            <option value="FOLLOW_UP_REVIEW">Follow-up Review</option>
            <option value="SPOT_CHECK">Spot Check</option>
            <option value="COMPLIANCE_VERIFICATION">Compliance Verification</option>
          </select>
        </div>
      </div>
      <div className="modal-form-row">
        <div className="modal-form-group">
          <label>Start Date</label>
          <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
        </div>
        <div className="modal-form-group">
          <label>Due Date</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
      <div className="modal-form-group">
        <label>Scope & Objectives</label>
        <textarea
          placeholder="Describe the audit scope, key objectives, and focus areas…"
          value={scopeNotes}
          onChange={(e) => setScopeNotes(e.target.value)}
        />
      </div>
      <div className="modal-form-group">
        <label>Priority Maturity Levels</label>
        <select value={priorityLevels} onChange={(e) => setPriorityLevels(e.target.value)}>
          <option>All Levels (0-5)</option>
          <option>Level 0-2 (Foundational)</option>
          <option>Level 3-5 (Advanced)</option>
        </select>
      </div>
      {error && <div className="modal-error">{error}</div>}
      <button
        className="modal-submit-btn"
        disabled={!domainId || !leadAuditorId || create.isPending}
        onClick={() => create.mutate()}
      >
        {create.isPending ? "Scheduling…" : "Schedule Audit"}
      </button>
    </Modal>
  );
}
