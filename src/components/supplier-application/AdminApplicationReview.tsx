"use client";

import { useState } from "react";
import { Badge, Button, Callout, Field, Ic, LbCard, ScoreRing } from "./primitives";
import { initialApp } from "./data";

type Tab =
  | "overview"
  | "compliance"
  | "capabilities"
  | "machines"
  | "quality"
  | "performance"
  | "docs"
  | "activity";

const TABS: Array<[Tab, string]> = [
  ["overview", "Overview"],
  ["compliance", "Compliance"],
  ["capabilities", "Capability matrix"],
  ["machines", "Machines"],
  ["quality", "Quality"],
  ["performance", "Past performance"],
  ["docs", "Documents (4)"],
  ["activity", "Activity"],
];

export default function AdminApplicationReview({ id }: { id: string }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [showNote, setShowNote] = useState(false);

  return (
    <div className="lb-content">
      <div className="lb-topbar">
        <div className="lb-crumbs">
          <a>Admin</a>
          <span className="sep">/</span>
          <a>Supplier Applications</a>
          <span className="sep">/</span>
          <span style={{ color: "var(--text-primary)" }}>{id}</span>
        </div>
        <div style={{ flex: 1 }} />
        <div className="lb-seg">
          <button type="button" aria-label="Previous">
            <Ic.back />
          </button>
          <button type="button" aria-label="Next">
            <Ic.arrow />
          </button>
        </div>
        <Badge tone="accent">Under Review</Badge>
        <Button variant="ghost" size="sm" icon={<Ic.more />} />
      </div>

      <div style={{ padding: "22px 32px 0" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 24,
            alignItems: "start",
            paddingBottom: 18,
            borderBottom: "1px solid var(--surface-3)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span
                className="lb-mono"
                style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em" }}
              >
                {id} · CAGE 8K2J4
              </span>
              <Badge tone="info">Submitted Apr 22</Badge>
              <Badge tone="warn">SLA · 3d remaining</Badge>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.01em", margin: "0 0 6px" }}>
              Meridian Precision Machining, LLC
            </h1>
            <div
              style={{
                display: "flex",
                gap: 18,
                fontSize: 13,
                color: "var(--text-secondary)",
                fontFamily: "var(--font-geist-mono), var(--mono-stack)",
              }}
            >
              <span>Colorado Springs, CO</span>
              <span>84 employees</span>
              <span>2 facilities · 60.5K sqft</span>
              <span>Founded 2008</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="secondary" icon={<Ic.doc />}>
              View raw application
            </Button>
            <Button variant="ghost" icon={<Ic.download />}>
              Export PDF
            </Button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 0, paddingTop: 14 }}>
          {TABS.map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              style={{
                padding: "10px 16px",
                fontSize: 13,
                fontWeight: 500,
                background: "transparent",
                border: 0,
                borderBottom: tab === k ? "2px solid var(--accent)" : "2px solid transparent",
                color: tab === k ? "var(--text-primary)" : "var(--text-muted)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "24px 32px 64px", display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
        <div>
          {tab === "overview" && <AdminOverview />}
          {tab === "compliance" && <AdminCompliance />}
          {tab === "capabilities" && <AdminCapabilityMatrix />}
          {tab === "machines" && <AdminMachines />}
          {tab === "quality" && <AdminQuality />}
          {tab === "performance" && <AdminPerformance />}
          {tab === "docs" && <AdminDocs />}
          {tab === "activity" && <AdminActivity />}
        </div>

        <aside>
          <LbCard title="Readiness score" eyebrow="ASGARD MODEL v3.2">
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
              <ScoreRing value={84} size={92} />
              <div style={{ flex: 1 }}>
                <Badge tone="success">QUALIFIED</Badge>
                <div
                  className="lb-mono"
                  style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.5 }}
                >
                  Above 80 threshold. Suitable for flight-critical work pending reference checks.
                </div>
              </div>
            </div>
            {(
              [
                ["Compliance", 92, "success"],
                ["Capability fit", 88, "success"],
                ["Capacity", 71, "warn"],
                ["Quality", 94, "success"],
                ["Past performance", 85, "success"],
                ["Cyber posture", 82, "success"],
              ] as const
            ).map(([label, val, tone]) => (
              <div
                key={label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 70px 36px",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 0",
                }}
              >
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</span>
                <div className="lb-progress">
                  <span
                    style={{
                      width: `${val}%`,
                      background: tone === "warn" ? "var(--status-warn)" : "var(--accent)",
                    }}
                  />
                </div>
                <span className="lb-mono lb-tnum" style={{ fontSize: 12, textAlign: "right" }}>
                  {val}
                </span>
              </div>
            ))}
          </LbCard>

          <div style={{ height: 14 }} />

          <LbCard title="Risk flags" eyebrow="3 OPEN">
            <div style={{ display: "grid", gap: 8 }}>
              <RiskCard
                tone="warn"
                title="NADCAP HT renewal"
                detail="Expires in 148 days"
              />
              <RiskCard
                tone="warn"
                title="Single-tier finishing"
                detail="Heat treat / finish via 1 partner"
              />
              <RiskCard tone="info" title="Utilization 78%" detail="Headroom limited" />
            </div>
          </LbCard>

          <div style={{ height: 14 }} />

          <LbCard title="Decision">
            {!decision ? (
              <div style={{ display: "grid", gap: 8 }}>
                <Button variant="success" onClick={() => setDecision("approve")} icon={<Ic.check />}>
                  Approve & invite to platform
                </Button>
                <Button variant="secondary" onClick={() => setShowNote(true)} icon={<Ic.edit />}>
                  Request more information
                </Button>
                <Button variant="danger" onClick={() => setDecision("reject")} icon={<Ic.x />}>
                  Reject application
                </Button>
              </div>
            ) : (
              <div
                style={{
                  padding: "10px 12px",
                  background:
                    decision === "approve" ? "rgba(52,211,153,0.05)" : "rgba(244,63,94,0.05)",
                  border: `1px solid ${decision === "approve" ? "rgba(52,211,153,0.25)" : "rgba(244,63,94,0.25)"}`,
                  borderRadius: 6,
                  fontSize: 12.5,
                }}
              >
                <div
                  style={{
                    fontWeight: 500,
                    marginBottom: 4,
                    color: decision === "approve" ? "var(--status-success)" : "var(--status-danger)",
                  }}
                >
                  {decision === "approve" ? "✓ Approved" : "✗ Rejected"}
                </div>
                <div className="lb-mono" style={{ color: "var(--text-muted)", fontSize: 11 }}>
                  Decision recorded · invite dispatched
                </div>
                <Button variant="ghost" size="sm" onClick={() => setDecision(null)}>
                  Undo
                </Button>
              </div>
            )}

            {showNote && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--surface-3)" }}>
                <Field label="Information requested" required>
                  <textarea
                    className="lb-textarea"
                    placeholder="Describe what's missing or unclear..."
                    defaultValue="Please provide an alternate heat-treating partner with NADCAP accreditation, and clarify the 2024 backlog reduction plan."
                  />
                </Field>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <Button variant="primary" size="sm">
                    Send to supplier
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowNote(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </LbCard>

          <div style={{ height: 14 }} />

          <LbCard title="Reviewer notes" eyebrow="INTERNAL ONLY">
            <div style={{ display: "grid", gap: 10 }}>
              <NoteCard
                actor="JAMIE TRAN"
                ago="2d ago"
                body="Strong AS9100D + NADCAP HT. Reference check w/ NGC pending — Priya confirmed callback Friday."
              />
              <NoteCard
                actor="CARLOS MENDEZ · CYBER"
                ago="3d ago"
                body="SPRS score 112 verified against DoD portal. CMMC L2 self-assessment matches POA&M. ✓ Cleared."
              />
              <textarea className="lb-textarea" placeholder="Add a note for the team..." />
              <Button variant="secondary" size="sm">
                Post note
              </Button>
            </div>
          </LbCard>
        </aside>
      </div>
    </div>
  );
}

function RiskCard({ tone, title, detail }: { tone: "warn" | "info"; title: string; detail: string }) {
  const palette =
    tone === "warn"
      ? { bg: "rgba(251,191,36,0.05)", border: "rgba(251,191,36,0.2)", color: "var(--status-warn)" }
      : { bg: "rgba(56,189,248,0.05)", border: "rgba(56,189,248,0.2)", color: "var(--status-info)" };
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: "10px 12px",
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: 5,
        fontSize: 12.5,
        lineHeight: 1.5,
      }}
    >
      <span style={{ color: palette.color, flexShrink: 0, marginTop: 1 }}>
        {tone === "warn" ? <Ic.warn /> : <Ic.info />}
      </span>
      <div>
        <div style={{ fontWeight: 500, marginBottom: 2 }}>{title}</div>
        <div className="lb-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {detail}
        </div>
      </div>
    </div>
  );
}

function NoteCard({ actor, ago, body }: { actor: string; ago: string; body: string }) {
  return (
    <div style={{ padding: "10px 12px", background: "var(--surface-2)", borderRadius: 5, fontSize: 12, lineHeight: 1.55 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "var(--font-geist-mono), var(--mono-stack)",
          fontSize: 10.5,
          color: "var(--text-muted)",
          marginBottom: 6,
        }}
      >
        <span>{actor}</span>
        <span>{ago}</span>
      </div>
      {body}
    </div>
  );
}

// ───── Overview ─────
function AdminOverview() {
  const certs = [
    ["AS9100D", "✓", "success", "Active · expires 2027-03"],
    ["ISO 9001:2015", "✓", "success", "Active · expires 2027-03"],
    ["ITAR (DDTC)", "✓", "success", "M-31472 · 2026-08"],
    ["CMMC L2", "✓", "success", "SPRS 112 · self-assessed"],
    ["NIST 800-171", "✓", "success", "112 / 110 max"],
    ["NADCAP HT", "!", "warn", "Expires 148 days"],
    ["Counterfeit pgm", "✓", "success", "SAE AS5553/AS6174"],
    ["FOD program", "✓", "success", "NAS 412 compliant"],
  ] as const;

  const metrics = [
    ["OTD (12mo)", "94.2%", "success", <Ic.clock key="c" />],
    ["Quality yield", "99.6%", "success", <Ic.award key="a" />],
    ["Utilization", "78%", "warn", <Ic.factory key="f" />],
    ["Backlog", "$2.4M / 11wk", "info", <Ic.dollar key="d" />],
  ] as const;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <LbCard
        title="Compliance status"
        eyebrow="GATING CRITERIA"
        action={<Badge tone="success">All required certs on file</Badge>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {certs.map(([name, sym, tone, detail]) => (
            <div
              key={name}
              style={{
                padding: "10px 12px",
                background: "var(--surface-2)",
                border: `1px solid ${tone === "warn" ? "rgba(251,191,36,0.25)" : "var(--surface-3)"}`,
                borderRadius: 6,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 500 }}>{name}</span>
                <span
                  className="lb-mono"
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    display: "grid",
                    placeContent: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    background:
                      tone === "success" ? "rgba(52,211,153,0.15)" : "rgba(251,191,36,0.15)",
                    color: tone === "success" ? "var(--status-success)" : "var(--status-warn)",
                  }}
                >
                  {sym}
                </span>
              </div>
              <div className="lb-mono" style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
                {detail}
              </div>
            </div>
          ))}
        </div>
      </LbCard>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {metrics.map(([label, val, tone, ic]) => (
          <div
            key={label}
            style={{
              padding: "14px 16px",
              background: "var(--surface-1)",
              border: "1px solid var(--surface-3)",
              borderRadius: 6,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span className="lb-kv-label">{label}</span>
              <span style={{ color: `var(--status-${tone})`, opacity: 0.85 }}>{ic}</span>
            </div>
            <div className="lb-kv-value" style={{ fontSize: 18 }}>
              {val}
            </div>
          </div>
        ))}
      </div>

      <LbCard title="Capability summary" eyebrow="MATCHING SIGNALS">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <div
              className="lb-mono"
              style={{
                fontSize: 10.5,
                color: "var(--text-muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Primary processes
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["3-Axis", "4-Axis", "5-Axis", "Turning", "Mill-Turn", "Wire EDM", "Surface Grinding"].map((p) => (
                <Badge key={p} tone="accent">
                  {p}
                </Badge>
              ))}
            </div>
            <div
              className="lb-mono"
              style={{
                fontSize: 10.5,
                color: "var(--text-muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                margin: "16px 0 10px",
              }}
            >
              Key alloys
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["Al 6061", "Al 7075", "SS 17-4", "SS 316L", "Ti 6Al-4V", "Inco 718", "Inco 625", "4140", "A286"].map((p) => (
                <Badge key={p} tone="info">
                  {p}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <div
              className="lb-mono"
              style={{
                fontSize: 10.5,
                color: "var(--text-muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Envelope & precision
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
              <KV label="Max envelope" value="60 × 36 × 24 in" />
              <KV label="Tightest tol." value="±0.0002 in" />
              <KV label="Best Ra" value="8 µin" />
              <KV label="Lot range" value="5 – 2,500" />
            </div>
          </div>
        </div>
      </LbCard>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <LbCard title="Workforce">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, fontSize: 12 }}>
            {[
              ["Total", "84"],
              ["Machinists", "38"],
              ["Programmers", "8"],
              ["QA", "6"],
              ["Engineers", "10"],
              ["Cleared", "12"],
            ].map(([l, v]) => (
              <KV key={l} label={l} value={v} />
            ))}
          </div>
          <div style={{ height: 14 }} />
          <div style={{ padding: "10px 12px", background: "var(--surface-2)", borderRadius: 5, fontSize: 12 }}>
            <div className="lb-kv-label">Computed weekly capacity</div>
            <div
              style={{
                color: "var(--accent)",
                fontFamily: "var(--font-geist-mono), var(--mono-stack)",
                fontSize: 15,
                marginTop: 4,
              }}
            >
              3,800 machinist-hrs / wk
            </div>
            <div className="lb-mono" style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 3 }}>
              2 shifts × 10 hrs × 5 days
            </div>
          </div>
        </LbCard>

        <LbCard title="Cost indicators" eyebrow="PRIVATE — INTERNAL BENCHMARK">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, fontSize: 12 }}>
            {[
              ["3-axis", "$95/hr"],
              ["5-axis", "$145/hr"],
              ["Turning", "$92/hr"],
              ["EDM", "$135/hr"],
              ["Programming", "$120/hr"],
              ["NRE min", "$850"],
            ].map(([l, v]) => (
              <KV key={l} label={l} value={v} />
            ))}
          </div>
          <div style={{ height: 10 }} />
          <div style={{ display: "flex", gap: 10, fontSize: 11.5 }}>
            <Badge tone="info">Net 30</Badge>
            <Badge tone="neutral">Fixed quote</Badge>
            <Badge tone="warn">Expedite +25%</Badge>
          </div>
        </LbCard>
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="lb-kv-label">{label}</div>
      <div className="lb-kv-value">{value}</div>
    </div>
  );
}

// ───── Capability matrix ─────
function AdminCapabilityMatrix() {
  const cols = ["Al 6061", "Al 7075", "SS 304", "SS 316L", "SS 17-4", "Ti 6Al-4V", "Inco 718", "Inco 625", "4140", "A286"];
  const rows: Array<[string, number[]]> = [
    ["3-Axis Mill", [3, 3, 3, 3, 3, 2, 2, 2, 3, 2]],
    ["5-Axis Mill", [3, 3, 3, 3, 3, 3, 3, 2, 3, 2]],
    ["Mill-Turn", [3, 3, 3, 3, 3, 2, 2, 1, 2, 1]],
    ["CNC Lathe", [3, 3, 3, 3, 3, 2, 1, 1, 2, 1]],
    ["Wire EDM", [3, 2, 3, 3, 3, 2, 2, 2, 2, 2]],
    ["Surface Grinding", [3, 3, 3, 3, 3, 1, 2, 1, 3, 1]],
  ];
  const dot = (n: number) =>
    n === 3
      ? "var(--status-success)"
      : n === 2
        ? "var(--accent)"
        : n === 1
          ? "var(--status-warn)"
          : "var(--surface-3)";
  return (
    <LbCard
      title="Capability matrix"
      eyebrow="PROCESS × MATERIAL"
      action={
        <div
          style={{
            display: "flex",
            gap: 14,
            fontSize: 11,
            fontFamily: "var(--font-geist-mono), var(--mono-stack)",
            color: "var(--text-muted)",
          }}
        >
          <span>
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--status-success)",
                marginRight: 5,
              }}
            />
            Production
          </span>
          <span>
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--accent)",
                marginRight: 5,
              }}
            />
            Qualified
          </span>
          <span>
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--status-warn)",
                marginRight: 5,
              }}
            />
            Limited
          </span>
        </div>
      }
    >
      <div style={{ overflowX: "auto" }}>
        <table className="lb-table" style={{ minWidth: 780 }}>
          <thead>
            <tr>
              <th style={{ minWidth: 160 }}>Process</th>
              {cols.map((c) => (
                <th key={c} style={{ textAlign: "center", fontSize: 10.5 }}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([proc, vals]) => (
              <tr key={proc}>
                <td style={{ fontWeight: 500, fontSize: 13 }}>{proc}</td>
                {vals.map((v, i) => (
                  <td key={i} style={{ textAlign: "center" }}>
                    {v > 0 ? (
                      <span
                        style={{
                          display: "inline-block",
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: dot(v),
                          boxShadow: `0 0 0 4px ${dot(v)}22`,
                        }}
                      />
                    ) : (
                      <span style={{ color: "var(--text-dim)" }}>—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ height: 14 }} />
      <Callout tone="accent">
        Generated from Capabilities (D), Materials (H), and machine envelope checks. Used as a hard filter during RFQ routing.
      </Callout>
    </LbCard>
  );
}

// ───── Compliance ─────
function AdminCompliance() {
  const rows = [
    ["AS9100D", "DEKRA Certification", "AS-2024-118273", "2024-03-14", "2027-03-14", "success", "Active"],
    ["ISO 9001:2015", "DEKRA Certification", "ISO-2024-118273", "2024-03-14", "2027-03-14", "success", "Active"],
    ["NADCAP — Heat Treating", "PRI", "AC7102/8 R-3492", "2023-09-22", "2026-09-22", "warn", "Expires <6mo"],
    ["ITAR Registration", "DDTC", "M-31472", "2024-08-01", "2026-08-01", "success", "Active"],
  ] as const;
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <LbCard title="Certifications on file" eyebrow="DOCUMENT VAULT" padded={false}>
        <table className="lb-table">
          <thead>
            <tr>
              <th>Certificate</th>
              <th>Issuer</th>
              <th>Number</th>
              <th>Issued</th>
              <th>Expires</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[2]}>
                <td style={{ fontWeight: 500 }}>{r[0]}</td>
                <td className="lb-mono" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {r[1]}
                </td>
                <td className="lb-mono" style={{ fontSize: 12 }}>
                  {r[2]}
                </td>
                <td className="lb-mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {r[3]}
                </td>
                <td className="lb-mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {r[4]}
                </td>
                <td>
                  <Badge tone={r[5]}>{r[6]}</Badge>
                </td>
                <td>
                  <button className="lb-btn lb-btn-ghost lb-btn-sm" type="button" aria-label="Download">
                    <Ic.download />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </LbCard>
      <LbCard title="Cybersecurity verification" eyebrow="SPRS · POA&M">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {(
            [
              ["SPRS score", "112", "success"],
              ["Max possible", "110", "neutral"],
              ["POA&M open", "8", "warn"],
              ["Last assessed", "Feb 2026", "info"],
            ] as const
          ).map(([l, v, t]) => (
            <div key={l}>
              <div className="lb-kv-label">{l}</div>
              <div
                className="lb-kv-value"
                style={{ color: t === "warn" ? "var(--status-warn)" : undefined }}
              >
                {v}
              </div>
            </div>
          ))}
        </div>
        <div style={{ height: 14 }} />
        <Callout tone="info">
          SPRS score verified by Carlos Mendez (Cyber, Asgard) on Apr 23 against DoD portal. Score &gt; 88 threshold; CMMC L2 self-assessment accepted pending C3PAO.
        </Callout>
      </LbCard>
    </div>
  );
}

function AdminMachines() {
  const machines = initialApp().machines.list;
  return (
    <LbCard title="Machine inventory" eyebrow="22 STATIONS" padded={false}>
      <table className="lb-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Make / model</th>
            <th>Envelope</th>
            <th style={{ textAlign: "right" }}>RPM</th>
            <th>Controller</th>
            <th style={{ textAlign: "right" }}>Qty</th>
            <th>Year</th>
            <th>Cond.</th>
          </tr>
        </thead>
        <tbody>
          {machines.map((m) => (
            <tr key={m.id}>
              <td>
                <Badge tone={m.type.includes("5-Axis") ? "accent" : m.type === "CMM" ? "info" : "neutral"}>
                  {m.type}
                </Badge>
              </td>
              <td>
                <div style={{ fontWeight: 500 }}>{m.make}</div>
                <div className="lb-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {m.model}
                </div>
              </td>
              <td className="lb-mono" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {m.envelope}
              </td>
              <td className="lb-mono lb-tnum" style={{ textAlign: "right" }}>
                {m.spindle_rpm ? m.spindle_rpm.toLocaleString() : "—"}
              </td>
              <td className="lb-mono" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {m.controller}
              </td>
              <td className="lb-mono lb-tnum" style={{ textAlign: "right", fontWeight: 600 }}>
                {m.count}
              </td>
              <td className="lb-mono">{m.year}</td>
              <td>
                <Badge tone={m.condition === "excellent" ? "success" : "info"}>{m.condition}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </LbCard>
  );
}

function AdminQuality() {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <LbCard title="Quality metrics" eyebrow="TRAILING 12 MONTHS">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {(
            [
              ["OTD", "94.2%", "success"],
              ["First-pass yield", "99.6%", "success"],
              ["PPM rejects", "1,240", "success"],
              ["Customer escapes", "2", "success"],
            ] as const
          ).map(([l, v, t]) => (
            <div key={l}>
              <div className="lb-kv-label">{l}</div>
              <div className="lb-kv-value" style={{ color: `var(--status-${t})` }}>
                {v}
              </div>
            </div>
          ))}
        </div>
      </LbCard>
      <LbCard title="Inspection capability">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {[
            "CMM (Zeiss CONTURA G2 ×2)",
            "Faro Arm",
            "Vision",
            "Surface Profilometer",
            "Optical Comparator",
          ].map((x) => (
            <Badge key={x} tone="info">
              {x}
            </Badge>
          ))}
        </div>
        <div style={{ height: 14 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, fontSize: 12 }}>
          <KV label="PPAP capable" value="Yes" />
          <KV label="AS9102 FAI" value="Yes" />
          <KV label="Calibration" value="ISO 17025" />
        </div>
      </LbCard>
    </div>
  );
}

function AdminPerformance() {
  const programs = initialApp().performance.programs;
  const refs = initialApp().performance.references;
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <LbCard title="Programs & customer history" padded={false}>
        <table className="lb-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Program</th>
              <th>Period</th>
              <th style={{ textAlign: "right" }}>Spend</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {programs.map((p) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 500 }}>{p.customer}</td>
                <td className="lb-mono" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {p.program}
                </td>
                <td className="lb-mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {p.years}
                </td>
                <td className="lb-mono lb-tnum" style={{ textAlign: "right", fontWeight: 600 }}>
                  {p.spend}
                </td>
                <td>
                  {p.reference ? <Badge tone="success">Approved</Badge> : <Badge tone="neutral">Private</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </LbCard>
      <LbCard title="Reference checks" eyebrow="CONFIDENTIAL">
        {refs.map((r, idx) => (
          <div
            key={`${r.email}-${idx}`}
            style={{
              padding: "12px 14px",
              background: "var(--surface-2)",
              borderRadius: 5,
              marginBottom: 8,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontWeight: 500, fontSize: 13 }}>
                {r.name}{" "}
                <span style={{ fontWeight: 400, color: "var(--text-secondary)" }}>
                  · {r.title}, {r.company}
                </span>
              </div>
              <div className="lb-mono" style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                {r.email} · {r.phone}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {idx === 0 ? <Badge tone="warn">Callback Fri</Badge> : <Badge tone="success">Verified</Badge>}
              <Button variant="ghost" size="sm">
                Log call
              </Button>
            </div>
          </div>
        ))}
      </LbCard>
    </div>
  );
}

function AdminDocs() {
  const files = [
    ["AS9100D-Cert-2024.pdf", "Certificate", "2.1 MB"],
    ["ISO9001-Cert-2024.pdf", "Certificate", "1.8 MB"],
    ["NADCAP-HT-2024.pdf", "Certificate", "2.4 MB"],
    ["ITAR-Reg-2024.pdf", "Registration", "1.9 MB"],
  ] as const;
  return (
    <LbCard title="Uploaded documents" eyebrow="4 FILES · 8.2 MB">
      {files.map(([n, t, s]) => (
        <div key={n} className="lb-file">
          <div className="lb-file-ic">PDF</div>
          <div>
            <div className="lb-file-name">{n}</div>
            <div className="lb-file-meta">
              {t} · {s} · uploaded by Dana Whitfield
            </div>
          </div>
          <Badge tone="success">verified</Badge>
          <div style={{ display: "flex", gap: 4 }}>
            <button className="lb-btn lb-btn-ghost lb-btn-sm" type="button" aria-label="Download">
              <Ic.download />
            </button>
            <button className="lb-btn lb-btn-ghost lb-btn-sm" type="button" aria-label="More">
              <Ic.more />
            </button>
          </div>
        </div>
      ))}
    </LbCard>
  );
}

function AdminActivity() {
  const events: Array<[string, string, string]> = [
    ["Apr 26 09:42", "JT", "Note added — reference call w/ NGC scheduled Friday"],
    ["Apr 25 14:08", "CM", "SPRS score verified — 112"],
    ["Apr 24 11:30", "SYSTEM", "Capability matrix re-computed"],
    ["Apr 22 17:22", "SUPPLIER", "Application submitted by Dana Whitfield"],
    ["Apr 22 16:55", "SUPPLIER", "Section 12 attestation signed"],
    ["Apr 22 09:14", "SUPPLIER", "Section 11 — Past Performance completed"],
    ["Apr 19", "SUPPLIER", "Application draft started"],
  ];
  return (
    <LbCard title="Activity log" padded={false}>
      <div style={{ padding: "4px 0" }}>
        {events.map((e, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "110px 38px 1fr",
              gap: 14,
              padding: "12px 18px",
              borderBottom: i < events.length - 1 ? "1px solid var(--border-subtle)" : "0",
              alignItems: "center",
            }}
          >
            <span className="lb-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {e[0]}
            </span>
            <span
              className="lb-mono"
              style={{
                fontSize: 10.5,
                padding: "2px 6px",
                background: "var(--surface-2)",
                border: "1px solid var(--surface-3)",
                borderRadius: 3,
                textAlign: "center",
                color: "var(--text-secondary)",
              }}
            >
              {e[1]}
            </span>
            <span style={{ fontSize: 13 }}>{e[2]}</span>
          </div>
        ))}
      </div>
    </LbCard>
  );
}
