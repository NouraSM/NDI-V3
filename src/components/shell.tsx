"use client";

import { signOut } from "next-auth/react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { Role } from "@/types/api";

interface ShellDomain {
  id: number;
  name: string;
  shortCode: string;
  color: string;
}
interface ShellPeriod {
  id: string;
  label: string;
  isActive: boolean;
}
interface ShellUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

function QuarterSelect({ periods }: { periods: ShellPeriod[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("period") ?? periods.find((p) => p.isActive)?.label ?? periods[0]?.label;

  function handleChange(label: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", label);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select className="quarter-select" value={current} onChange={(e) => handleChange(e.target.value)}>
      {periods.map((p) => (
        <option key={p.id} value={p.label}>
          {p.label.replace(/(\d{4})Q(\d)/, "$1 Q$2")}
        </option>
      ))}
    </select>
  );
}

export function Shell({
  user,
  domains,
  periods,
  children,
}: {
  user: ShellUser | null;
  domains: ShellDomain[];
  periods: ShellPeriod[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const isOverall = pathname === "/";
  const isDashboard = pathname === "/dashboard";
  const isAudit = pathname === "/audit-center";
  const domainMatch = pathname.match(/^\/domains\/(\d+)/);
  const activeDomainId = domainMatch ? Number(domainMatch[1]) : null;

  return (
    <div id="dashboard">
      <header>
        <div className="header-left">
          <button className="header-logo-icon" onClick={() => router.push("/")} title="Home">
            S
          </button>
          <div className="header-title">
            Sutherland <span>Enterprise Data Management Office</span>
          </div>
        </div>
        <div className="header-right">
          <Suspense fallback={<div className="quarter-select">Loading…</div>}>
            <QuarterSelect periods={periods} />
          </Suspense>
          {user && (
            <div className="user-chip">
              <strong>{user.name}</strong>
              <span>{user.role.replace("_", " ")}</span>
            </div>
          )}
          <button className="logout-btn" onClick={() => signOut({ callbackUrl: "/login" })}>
            Logout
          </button>
        </div>
      </header>

      <aside>
        <div className="side-header">Navigation</div>
        <button className={`domain-item${isOverall ? " active" : ""}`} onClick={() => router.push("/")}>
          <div className="domain-num" style={{ background: "var(--pink)", color: "white" }}>
            ⌂
          </div>
          <span style={{ fontWeight: 700 }}>Overall</span>
        </button>
        <button className={`domain-item${isDashboard ? " active" : ""}`} onClick={() => router.push("/dashboard")}>
          <div className="domain-num" style={{ background: "var(--purple)", color: "white" }}>
            ✦
          </div>
          <span style={{ fontWeight: 700 }}>NDI Dashboard</span>
        </button>
        <button className={`domain-item${isAudit ? " active" : ""}`} onClick={() => router.push("/audit-center")}>
          <div className="domain-num" style={{ background: "var(--teal)", color: "white" }}>
            ⚑
          </div>
          <span style={{ fontWeight: 700 }}>Audit Center</span>
        </button>
        <div className="side-header" style={{ marginTop: 10 }}>
          NDI Domains
        </div>
        {domains.map((d, i) => (
          <button
            key={d.id}
            className={`domain-item${activeDomainId === d.id ? " active" : ""}`}
            onClick={() => router.push(`/domains/${d.id}`)}
          >
            <div className="domain-num">{i + 1}</div>
            <span>{d.name.replace("NDI ", "")}</span>
          </button>
        ))}
      </aside>

      <main>{children}</main>
    </div>
  );
}
