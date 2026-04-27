import { notFound } from "next/navigation";
import { getOptionalUser } from "@/lib/auth";
import { getCustomerApplicationFull } from "@/lib/customer-application/repository";
import { getLatestFitScore } from "@/lib/customer-application/scoring-repository";
import { getMaterializedBundleForApplication } from "@/lib/customer-application/conversion-repository";
import {
  priorityLabel,
  priorityTone,
  scoreCustomerApplication,
  type DerivedPriority,
  type DimensionKey,
} from "@/lib/customer-application/scoring";
import type {
  CustomerApplicationFull,
  CustomerApplicationStatus,
} from "@/lib/customer-application/types";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import {
  Card,
  RequiresLiveData,
  StatusBadge,
  customerApplicationStatusMap,
  customerTierLabelMap,
  customerTierToneMap,
  mapStatus,
} from "@/components/ui";
import ReviewActions from "./ReviewActions";

export const dynamic = "force-dynamic";

export default async function CustomerApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getOptionalUser();
  const { id } = await params;

  if (user?.role !== "asgard_admin") {
    return (
      <>
        <PageHeader
          eyebrow="Admin · Customer Application"
          title={id.slice(0, 8)}
          subtitle="Customer-application review requires an authenticated asgard_admin session."
        />
        <RequiresLiveData
          reason="Per-application detail relies on live Supabase data and the asgard_admin role."
          backHref="/admin/customer-applications"
          backLabel="Back to Customer Applications preview"
        />
      </>
    );
  }

  let full: CustomerApplicationFull | null = null;
  try {
    full = await getCustomerApplicationFull(id);
  } catch {
    return (
      <>
        <PageHeader
          eyebrow="Admin · Customer Application"
          title={id.slice(0, 8)}
        />
        <RequiresLiveData
          reason="Could not reach Supabase to load this application."
          backHref="/admin/customer-applications"
          backLabel="Back to Customer Applications"
        />
      </>
    );
  }
  if (!full) notFound();

  const a = full.application;

  // Always compute the live derivation (cheap, deterministic) so the panel
  // can show risk flags + recommended focus even when no stored row exists.
  // The stored row is the persisted record — its composite + dimensions
  // come from a prior compute and may be stale if the application was
  // edited after scoring.
  const live = scoreCustomerApplication(full);
  const [stored, bundle] = await Promise.all([
    getLatestFitScore(a.id).catch(() => null),
    getMaterializedBundleForApplication(a.id).catch(() => null),
  ]);
  const display = stored
    ? {
        composite: stored.composite_score,
        priority: (stored.derived_priority ?? "review") as DerivedPriority,
        dimensions: live.dimensions.map((d) => ({
          ...d,
          score:
            (stored.dimensions[d.key as DimensionKey] as number | undefined) ??
            d.score,
        })),
        riskFlags: live.riskFlags,
        recommendedFocus: live.recommendedFocus,
        computedAt: stored.computed_at,
        scored: true as const,
      }
    : {
        composite: live.composite,
        priority: live.priority,
        dimensions: live.dimensions,
        riskFlags: live.riskFlags,
        recommendedFocus: live.recommendedFocus,
        computedAt: null as string | null,
        scored: false as const,
      };
  const { label, tone } = mapStatus(customerApplicationStatusMap, a.status);
  const tierTone = a.derived_tier
    ? customerTierToneMap[a.derived_tier] ?? "neutral"
    : "neutral";
  const tierLabel = a.derived_tier
    ? customerTierLabelMap[a.derived_tier] ?? a.derived_tier
    : "—";

  return (
    <>
      <PageHeader
        eyebrow="Admin · Customer Application"
        title={a.legal_name}
        subtitle={`${a.dba ? a.dba + " · " : ""}${a.hq_city ?? ""}${
          a.hq_city && a.hq_state ? ", " : ""
        }${a.hq_state ?? ""} · ID ${a.id.slice(0, 8)}`}
        back={{
          href: "/admin/customer-applications",
          label: "All applications",
        }}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge tone={tierTone} dot={false}>
              {tierLabel}
            </StatusBadge>
            <StatusBadge tone={tone}>{label}</StatusBadge>
          </div>
        }
      />

      {/* Headline KVs */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KvCard label="Submitted">{fmtDate(a.submitted_at)}</KvCard>
        <KvCard label="Last reviewed">{fmtDate(a.reviewed_at)}</KvCard>
        <KvCard label="Org type" capitalize>
          {a.org_type?.replace("_", " ") ?? "—"}
        </KvCard>
        <KvCard label="Funding stage" capitalize>
          {a.funding_stage?.replace("_", " ") ?? "—"}
        </KvCard>
        <KvCard label="Team size">
          <span className="tabular-nums">{a.team_size ?? "—"}</span>
        </KvCard>
        <KvCard label="Geography" capitalize>
          {a.geography.replace("_", " ")}
        </KvCard>
        <KvCard label="Cost ↔ Speed">
          <span className="tabular-nums">
            cost {100 - a.cost_vs_speed} / speed {a.cost_vs_speed}
          </span>
        </KvCard>
        <KvCard label="Suppliers per part">
          <span className="tabular-nums">{a.suppliers_per_part}</span>
        </KvCard>
      </div>

      {/* Materialized profile (post-conversion) */}
      {bundle && (
        <>
          <SectionHeader
            title="Materialized customer profile"
            subtitle={`Provisioned ${new Date(bundle.profile.created_at).toLocaleString()} · workspace_status = ${bundle.profile.workspace_status}`}
          />
          <Card>
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Organization */}
              <div className="rounded-md border border-emerald-500/25 bg-emerald-500/[0.04] p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                  Organization
                </div>
                <div className="mt-1 text-[14px] font-medium text-slate-100">
                  {bundle.organization.name}
                </div>
                <div className="mt-1 font-mono text-[11px] text-slate-500">
                  {bundle.organization.id.slice(0, 8)} ·{" "}
                  {bundle.organization.type}
                  {bundle.organization.itar_registered ? " · ITAR" : ""}
                </div>
                <div className="mt-2 font-mono text-[10.5px] text-slate-500">
                  Created{" "}
                  {new Date(bundle.organization.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Customer profile */}
              <div className="rounded-md border border-cyan-500/25 bg-cyan-500/[0.04] p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
                  Customer profile
                </div>
                <div className="mt-1 text-[14px] font-medium text-slate-100">
                  {bundle.profile.workspace_name}
                </div>
                <div className="mt-1 font-mono text-[11px] text-slate-300">
                  {bundle.profile.workspace_subdomain}.launchbelt.com
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[10.5px] text-slate-500">
                  <span>tier</span>
                  <span className="text-slate-300">
                    {bundle.profile.tier ?? "—"}
                  </span>
                  <span>residency</span>
                  <span className="text-slate-300">
                    {bundle.profile.data_residency.toUpperCase()}
                  </span>
                  <span>SSO</span>
                  <span className="text-slate-300">
                    {bundle.profile.sso_provider}
                  </span>
                  <span>retention</span>
                  <span className="text-slate-300">
                    {bundle.profile.audit_log_retention_yrs}y
                  </span>
                </div>
              </div>

              {/* Routing weights summary */}
              <div className="rounded-md border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Routing preferences
                </div>
                {bundle.routing_weights ? (
                  <>
                    <div className="mt-1 font-mono text-[11.5px] text-slate-300">
                      cost {bundle.routing_weights.cost_weight} · speed{" "}
                      {bundle.routing_weights.speed_weight} · risk-penalty{" "}
                      {bundle.routing_weights.risk_penalty_weight}
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-slate-500">
                      geography weight{" "}
                      {bundle.routing_weights.geography_weight}
                    </div>
                    {bundle.routing_weights.preferred_regions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {bundle.routing_weights.preferred_regions.map((r) => (
                          <StatusBadge key={r} tone="info" dot={false}>
                            {r}
                          </StatusBadge>
                        ))}
                      </div>
                    )}
                    {bundle.routing_weights.preferred_supplier_traits.length >
                      0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {bundle.routing_weights.preferred_supplier_traits.map(
                          (t) => (
                            <StatusBadge key={t} tone="neutral" dot={false}>
                              {t}
                            </StatusBadge>
                          ),
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">
                    No routing weights row found.
                  </p>
                )}
              </div>
            </div>

            {bundle.supplier_filters && (
              <div className="mt-4 rounded-md border border-slate-800 bg-slate-950/40 p-4">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Hard-gate supplier filter
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(
                    bundle.supplier_filters.filter_expression,
                  ).map(([k, v]) => {
                    if (v === false || v === null || v === undefined) {
                      return null;
                    }
                    const label = `${k}: ${typeof v === "boolean" ? "✓" : String(v)}`;
                    const tone = typeof v === "boolean" ? "warn" : "info";
                    return (
                      <StatusBadge key={k} tone={tone} dot={false}>
                        {label}
                      </StatusBadge>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-slate-500">
              Workspace provisioning is the next operational step (Phase 5).
            </p>
          </Card>

          <div className="h-5" />
        </>
      )}

      {/* Customer fit score */}
      <SectionHeader
        title="Customer fit score"
        subtitle={
          display.scored
            ? `Stored ${new Date(display.computedAt!).toLocaleString()} · refresh from the review actions panel below.`
            : "Not yet scored. Below is the live preview that will be persisted on first review."
        }
      />
      <Card>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex shrink-0 flex-col items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/40 px-5 py-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Composite
            </span>
            <span className="text-3xl font-semibold tabular-nums text-slate-100">
              {display.composite}
            </span>
            <StatusBadge tone={priorityTone(display.priority)} dot={false}>
              {priorityLabel(display.priority)}
            </StatusBadge>
            {!display.scored && (
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-300">
                Live preview
              </span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            {display.dimensions.map((d) => (
              <div key={d.key}>
                <div className="flex items-baseline justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.06em]">
                  <span className="text-slate-300">{d.label}</span>
                  <span className="text-slate-500">
                    weight {d.weight}% ·{" "}
                    <span className="tabular-nums text-slate-200">
                      {d.score}/100
                    </span>
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-sm bg-slate-800">
                  <div
                    className="h-full bg-cyan-400"
                    style={{ width: `${d.score}%` }}
                  />
                </div>
                <div className="mt-1 text-[11.5px] leading-snug text-slate-500">
                  {d.detail}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Risk flags ({display.riskFlags.length})
            </div>
            {display.riskFlags.length === 0 ? (
              <p className="mt-1 text-xs text-slate-400">
                No risks raised by the scorer.
              </p>
            ) : (
              <ul className="mt-1.5 space-y-1.5">
                {display.riskFlags.map((f, i) => (
                  <li
                    key={i}
                    className="rounded-md border border-amber-500/25 bg-amber-500/[0.04] px-3 py-1.5 text-[12px] leading-snug text-amber-200"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Recommended review focus
            </div>
            <ul className="mt-1.5 space-y-1.5">
              {display.recommendedFocus.map((f, i) => (
                <li
                  key={i}
                  className="rounded-md border border-cyan-500/20 bg-cyan-500/[0.04] px-3 py-1.5 text-[12px] leading-snug text-cyan-100"
                >
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <div className="h-5" />

      {/* Compliance flags */}
      <SectionHeader
        title="Compliance flow-down"
        subtitle="What downstream suppliers must satisfy."
      />
      <Card>
        <div className="flex flex-wrap gap-2">
          <ComplianceFlag on={a.itar} label="ITAR required" />
          <ComplianceFlag on={a.cui} label="CUI handling" />
          <ComplianceFlag on={a.as9100} label="AS9100D" />
          <ComplianceFlag on={a.nadcap} label="NADCAP" />
          <ComplianceFlag on={a.defense_program} label="Defense program" />
          <StatusBadge tone="info" dot={false}>
            CMMC: {a.cmmc_level.replace("_", " ")}
          </StatusBadge>
        </div>
        {full.defense_programs.length > 0 && (
          <div className="mt-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Named defense programs
            </div>
            <ul className="mt-1.5 space-y-1.5">
              {full.defense_programs.map((dp) => (
                <li
                  key={dp.id}
                  className="rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-200"
                >
                  <span className="font-medium">{dp.program_name}</span>
                  {dp.dpas_rating && (
                    <span className="ml-2 font-mono text-xs text-amber-300">
                      DPAS {dp.dpas_rating}
                    </span>
                  )}
                  {dp.prime_contractor && (
                    <span className="ml-2 text-xs text-slate-400">
                      via {dp.prime_contractor}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Programs */}
        <div>
          <SectionHeader title={`Programs (${full.programs.length})`} />
          <Card>
            {full.programs.length === 0 ? (
              <p className="text-xs text-slate-500">
                No active program types declared.
              </p>
            ) : (
              <ul className="space-y-2">
                {full.programs.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2.5"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-slate-100 capitalize">
                        {p.program_category}
                      </span>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-cyan-300">
                        {p.stage}
                      </span>
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-slate-500">
                      annual vol {p.annual_volume ?? "—"}
                    </div>
                    {p.notes && (
                      <p className="mt-1 text-xs text-slate-400">{p.notes}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Manufacturing */}
        <div>
          <SectionHeader
            title={`Manufacturing needs (${full.processes.length})`}
            subtitle="Required process intersection for routing."
          />
          <Card>
            {full.processes.length === 0 ? (
              <p className="text-xs text-slate-500">
                No primary processes declared.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {full.processes.map((p) => (
                  <StatusBadge key={p.id} tone="info" dot={false}>
                    {p.process_type}
                  </StatusBadge>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Contacts */}
        <div className="lg:col-span-2">
          <SectionHeader title={`Contacts (${full.contacts.length})`} />
          <Card>
            {full.contacts.length === 0 ? (
              <p className="text-xs text-slate-500">No contacts attached.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      {["Role", "Name", "Title", "Email", "Phone"].map((h) => (
                        <th
                          key={h}
                          className="py-1.5 pr-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {full.contacts.map((c) => (
                      <tr key={c.id} className="border-b border-slate-800/60">
                        <td className="py-2 pr-4">
                          <StatusBadge
                            tone={c.role === "primary" ? "accent" : "neutral"}
                            dot={false}
                          >
                            {c.role}
                          </StatusBadge>
                        </td>
                        <td className="py-2 pr-4 text-slate-100">{c.name}</td>
                        <td className="py-2 pr-4 text-slate-400">
                          {c.title ?? "—"}
                        </td>
                        <td className="py-2 pr-4 font-mono text-xs text-slate-400">
                          {c.email ?? "—"}
                        </td>
                        <td className="py-2 pr-4 font-mono text-xs text-slate-500">
                          {c.phone ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Workspace intent */}
        <div className="lg:col-span-2">
          <SectionHeader
            title="Workspace intent"
            subtitle="Materializes on conversion (Phase 4 — not yet implemented)."
          />
          <Card>
            <div className="grid gap-3 sm:grid-cols-3">
              <Kv label="Workspace name">{a.workspace_name ?? "—"}</Kv>
              <Kv label="Subdomain">
                {a.workspace_subdomain ? (
                  <span className="font-mono text-xs">
                    {a.workspace_subdomain}.launchbelt.com
                  </span>
                ) : (
                  "—"
                )}
              </Kv>
              <Kv label="Initial seats">
                <span className="tabular-nums">{a.initial_seats ?? "—"}</span>
              </Kv>
              <Kv label="Data residency">
                <span className="font-mono text-xs">
                  {a.data_residency
                    ? a.data_residency.replace("_", "-").toUpperCase()
                    : "—"}
                </span>
              </Kv>
              <Kv label="SSO provider">{a.sso_provider ?? "—"}</Kv>
              <Kv label="Initial use case" capitalize>
                {a.first_use_action?.replace("_", " ") ?? "—"}
              </Kv>
            </div>
          </Card>
        </div>
      </div>

      {/* Review actions */}
      <SectionHeader
        title="Review"
        subtitle="Status transitions append to the review trail and emit audit_logs."
      />
      <Card>
        <ReviewActions
          applicationId={a.id}
          status={a.status as CustomerApplicationStatus}
        />
        {a.decision_notes && (
          <div className="mt-4 rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-300">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Latest decision notes
            </div>
            <p className="mt-1 whitespace-pre-wrap">{a.decision_notes}</p>
          </div>
        )}
      </Card>

      {/* Review trail */}
      {full.reviews.length > 0 && (
        <>
          <SectionHeader title={`Review trail (${full.reviews.length})`} />
          <Card>
            <ul className="space-y-2.5">
              {full.reviews.map((r) => (
                <li
                  key={r.id}
                  className="rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2.5"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-cyan-300">
                      {r.action}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {fmtDateTime(r.created_at)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    by{" "}
                    <span className="font-mono text-slate-300">
                      {r.reviewer_email ?? r.reviewer_id.slice(0, 8)}
                    </span>
                  </div>
                  {r.notes && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">
                      {r.notes}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      {/* Raw payload (collapsed) */}
      <SectionHeader
        title="Raw payload (JSONB snapshot)"
        subtitle={`payload_schema_version = ${a.payload_schema_version}`}
      />
      <Card>
        <details>
          <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-200">
            Show full JSON
          </summary>
          <pre className="mt-2 max-h-[420px] overflow-auto rounded bg-slate-950/70 p-3 font-mono text-[11px] leading-relaxed text-slate-300">
            {JSON.stringify(a.payload, null, 2)}
          </pre>
        </details>
      </Card>
    </>
  );
}

function KvCard({
  label,
  children,
  capitalize,
}: {
  label: string;
  children: React.ReactNode;
  capitalize?: boolean;
}) {
  return (
    <Card>
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
        {label}
      </div>
      <div
        className={`mt-1 text-sm text-slate-100 ${capitalize ? "capitalize" : ""}`}
      >
        {children}
      </div>
    </Card>
  );
}

function Kv({
  label,
  children,
  capitalize,
}: {
  label: string;
  children: React.ReactNode;
  capitalize?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
        {label}
      </div>
      <div
        className={`mt-1 text-sm text-slate-100 ${capitalize ? "capitalize" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}

function ComplianceFlag({ on, label }: { on: boolean; label: string }) {
  return (
    <StatusBadge tone={on ? "warn" : "neutral"} dot={false}>
      {on ? "✓ " : "○ "}
      {label}
    </StatusBadge>
  );
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}
