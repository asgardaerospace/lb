import { notFound } from "next/navigation";
import { getOptionalUser } from "@/lib/auth";
import { getSupplierApplicationFull } from "@/lib/supplier-application/repository";
import { getLatestSupplierFitScore } from "@/lib/supplier-application/scoring-repository";
import { getMaterializedSupplierBundleForApplication } from "@/lib/supplier-application/conversion-repository";
import {
  listSupplierInviteHistoryForOrganization,
  listUsersForSupplierOrganization,
} from "@/lib/supplier-application/invite-repository";
import { SupplierAccessPanel } from "./SupplierAccessPanel";
import {
  recommendationLabel,
  recommendationTone,
  scoreSupplierApplication,
  type DerivedRecommendation,
  type DimensionKey,
} from "@/lib/supplier-application/scoring";
import type {
  SupplierApplicationFull,
  SupplierApplicationStatus,
} from "@/lib/supplier-application/types";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import {
  Card,
  RequiresLiveData,
  StatusBadge,
  mapStatus,
  supplierApplicationStatusMap,
} from "@/components/ui";
import ReviewActions from "./ReviewActions";

export const dynamic = "force-dynamic";

export default async function SupplierApplicationDetailPage({
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
          eyebrow="Admin · Supplier Application"
          title={id.slice(0, 8)}
          subtitle="Supplier-application review requires an authenticated asgard_admin session."
        />
        <RequiresLiveData
          reason="Per-application detail relies on live Supabase data and the asgard_admin role."
          backHref="/admin/supplier-applications"
          backLabel="Back to Supplier Applications preview"
        />
      </>
    );
  }

  let full: SupplierApplicationFull | null = null;
  try {
    full = await getSupplierApplicationFull(id);
  } catch {
    return (
      <>
        <PageHeader
          eyebrow="Admin · Supplier Application"
          title={id.slice(0, 8)}
        />
        <RequiresLiveData
          reason="Could not reach Supabase to load this application."
          backHref="/admin/supplier-applications"
          backLabel="Back to Supplier Applications"
        />
      </>
    );
  }
  if (!full) notFound();

  const a = full.application;
  const { label, tone } = mapStatus(supplierApplicationStatusMap, a.status);

  // Always compute live score so risk flags / strengths / tags stay current.
  // The stored row provides the persisted composite + dimension breakdown
  // (which may be stale if the application was edited after scoring).
  const live = scoreSupplierApplication(full);
  const [stored, bundle] = await Promise.all([
    getLatestSupplierFitScore(a.id).catch(() => null),
    getMaterializedSupplierBundleForApplication(a.id).catch(() => null),
  ]);

  const [inviteHistory, orgUsers] = bundle
    ? await Promise.all([
        listSupplierInviteHistoryForOrganization(bundle.organization.id).catch(
          () => [],
        ),
        listUsersForSupplierOrganization(bundle.organization.id).catch(
          () => [],
        ),
      ])
    : [[], []];

  const defaultInviteEmail = a.intake_email ?? "";
  const display = stored
    ? {
        composite: stored.composite_score,
        recommendation:
          (stored.recommendation ?? "defer") as DerivedRecommendation,
        dimensions: live.dimensions.map((d) => ({
          ...d,
          score:
            (stored.dimensions[d.key as DimensionKey] as number | undefined) ??
            d.score,
        })),
        riskFlags: live.riskFlags,
        strengths: live.strengths,
        tags: live.tags,
        computedAt: stored.computed_at,
        scored: true as const,
      }
    : {
        composite: live.composite,
        recommendation: live.recommendation,
        dimensions: live.dimensions,
        riskFlags: live.riskFlags,
        strengths: live.strengths,
        tags: live.tags,
        computedAt: null as string | null,
        scored: false as const,
      };

  return (
    <>
      <PageHeader
        eyebrow="Admin · Supplier Application"
        title={a.legal_name}
        subtitle={`${a.dba ? a.dba + " · " : ""}${a.hq_city ?? ""}${
          a.hq_city && a.hq_state ? ", " : ""
        }${a.hq_state ?? ""} · ID ${a.id.slice(0, 8)}`}
        back={{
          href: "/admin/supplier-applications",
          label: "All applications",
        }}
        actions={<StatusBadge tone={tone}>{label}</StatusBadge>}
      />

      {/* Headline KVs */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KvCard label="Submitted">{fmtDate(a.submitted_at)}</KvCard>
        <KvCard label="Last reviewed">{fmtDate(a.reviewed_at)}</KvCard>
        <KvCard label="Year founded">
          <span className="tabular-nums">{a.year_founded ?? "—"}</span>
        </KvCard>
        <KvCard label="Team size">
          <span className="tabular-nums">{a.team_size ?? "—"}</span>
        </KvCard>
        <KvCard label="DUNS">
          <span className="font-mono text-xs">{a.duns ?? "—"}</span>
        </KvCard>
        <KvCard label="CAGE">
          <span className="font-mono text-xs">{a.cage ?? "—"}</span>
        </KvCard>
        <KvCard label="ITAR">
          {a.itar_registered ? (
            <StatusBadge tone="warn" dot={false}>
              Registered
            </StatusBadge>
          ) : (
            "—"
          )}
        </KvCard>
        <KvCard label="CMMC">
          <span className="font-mono text-xs">
            {a.cmmc_level.replace("_", " ")}
          </span>
        </KvCard>
      </div>

      {/* Materialized supplier profile (post-conversion) */}
      {bundle && (
        <>
          <SectionHeader
            title="Materialized supplier profile"
            subtitle={`Provisioned ${new Date(bundle.profile.created_at).toLocaleString()} · approval_status = ${bundle.profile.approval_status}`}
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

              {/* Supplier profile */}
              <div className="rounded-md border border-cyan-500/25 bg-cyan-500/[0.04] p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
                  Supplier profile
                </div>
                <div className="mt-1 text-[14px] font-medium text-slate-100">
                  {bundle.profile.approval_status}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[10.5px] text-slate-500">
                  <span>AS9100</span>
                  <span className="text-slate-300">
                    {bundle.profile.as9100_certified ? "✓" : "—"}
                  </span>
                  <span>ISO9001</span>
                  <span className="text-slate-300">
                    {bundle.profile.iso9001_certified ? "✓" : "—"}
                  </span>
                  <span>ITAR</span>
                  <span className="text-slate-300">
                    {bundle.profile.itar_registered ? "✓" : "—"}
                  </span>
                  <span>CMMC</span>
                  <span className="text-slate-300">
                    {bundle.profile.cmmc_status.replace("_", " ")}
                  </span>
                  <span>Headcount</span>
                  <span className="text-slate-300 tabular-nums">
                    {bundle.profile.employee_count ?? "—"}
                  </span>
                  <span>Facility</span>
                  <span className="text-slate-300 tabular-nums">
                    {bundle.profile.facility_size_sqft
                      ? `${bundle.profile.facility_size_sqft.toLocaleString()} sqft`
                      : "—"}
                  </span>
                </div>
              </div>

              {/* Counts */}
              <div className="rounded-md border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Capabilities overview
                </div>
                <div className="mt-1 grid grid-cols-3 gap-2 text-center">
                  <CountTile
                    label="Certifications"
                    value={bundle.certifications.length}
                  />
                  <CountTile
                    label="Machines"
                    value={bundle.machines.length}
                  />
                  <CountTile
                    label="Capabilities"
                    value={bundle.capabilities.length}
                  />
                </div>
                {bundle.capabilities.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {bundle.capabilities.slice(0, 8).map((c) => (
                      <StatusBadge key={c.id} tone="info" dot={false}>
                        {c.process_type}
                      </StatusBadge>
                    ))}
                    {bundle.capabilities.length > 8 && (
                      <span className="font-mono text-[10.5px] text-slate-500">
                        +{bundle.capabilities.length - 8}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-slate-500">
              Supplier is in the routing candidate pool. Invite a supplier
              admin below to grant portal access.
            </p>

            <SupplierAccessPanel
              applicationId={a.id}
              defaultEmail={defaultInviteEmail}
              initialUsers={orgUsers}
              initialHistory={inviteHistory}
              organizationName={bundle.organization.name}
            />
          </Card>

          <div className="h-5" />
        </>
      )}

      {/* Supplier readiness score */}
      <SectionHeader
        title="Supplier readiness score"
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
            <StatusBadge
              tone={recommendationTone(display.recommendation)}
              dot={false}
            >
              {recommendationLabel(display.recommendation)}
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

        {display.tags.length > 0 && (
          <div className="mt-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Recommendation tags
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {display.tags.map((t) => (
                <StatusBadge key={t} tone="accent" dot={false}>
                  {t}
                </StatusBadge>
              ))}
            </div>
          </div>
        )}

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
              Strengths
            </div>
            <ul className="mt-1.5 space-y-1.5">
              {display.strengths.map((s, i) => (
                <li
                  key={i}
                  className="rounded-md border border-emerald-500/20 bg-emerald-500/[0.04] px-3 py-1.5 text-[12px] leading-snug text-emerald-100"
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <div className="h-5" />

      {/* Compliance + primary processes */}
      <SectionHeader
        title="Compliance & primary processes"
        subtitle="What this supplier can run, gated by what they're certified for."
      />
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <ComplianceFlag on={a.itar_registered} label="ITAR registered" />
          <StatusBadge tone="info" dot={false}>
            CMMC: {a.cmmc_level.replace("_", " ")}
          </StatusBadge>
        </div>
        <div className="mt-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Primary processes
          </div>
          {a.primary_processes.length === 0 ? (
            <p className="mt-1 text-xs text-slate-500">
              No primary processes declared.
            </p>
          ) : (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {a.primary_processes.map((p) => (
                <StatusBadge key={p} tone="info" dot={false}>
                  {p}
                </StatusBadge>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Capabilities */}
        <div>
          <SectionHeader
            title={`Capabilities (${full.capabilities.length})`}
            subtitle="Process × material matrix used for routing match."
          />
          <Card>
            {full.capabilities.length === 0 ? (
              <p className="text-xs text-slate-500">No capabilities listed.</p>
            ) : (
              <ul className="space-y-2">
                {full.capabilities.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2.5"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-slate-100">
                        {c.process_type}
                      </span>
                      {c.materials.length > 0 && (
                        <span className="font-mono text-[11px] text-cyan-300">
                          {c.materials.length} material
                          {c.materials.length === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                    {c.materials.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {c.materials.map((m) => (
                          <StatusBadge key={m} tone="neutral" dot={false}>
                            {m}
                          </StatusBadge>
                        ))}
                      </div>
                    )}
                    {c.notes && (
                      <p className="mt-1 text-xs text-slate-400">{c.notes}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Machines */}
        <div>
          <SectionHeader title={`Machines (${full.machines.length})`} />
          <Card>
            {full.machines.length === 0 ? (
              <p className="text-xs text-slate-500">No machines listed.</p>
            ) : (
              <ul className="space-y-2">
                {full.machines.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2.5"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-slate-100">
                        {m.machine_type}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        ×{m.count}
                      </span>
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-slate-500">
                      {[m.manufacturer, m.model, m.envelope]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-slate-500">
                      {m.axis_count != null ? `${m.axis_count}-axis · ` : ""}
                      {m.tolerance_capability ?? ""}
                    </div>
                    {m.materials_supported.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {m.materials_supported.map((mat) => (
                          <StatusBadge key={mat} tone="neutral" dot={false}>
                            {mat}
                          </StatusBadge>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Certifications */}
        <div>
          <SectionHeader
            title={`Certifications (${full.certifications.length})`}
          />
          <Card>
            {full.certifications.length === 0 ? (
              <p className="text-xs text-slate-500">
                No certifications declared.
              </p>
            ) : (
              <ul className="space-y-2">
                {full.certifications.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2.5"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-mono text-sm text-slate-100">
                        {c.cert_type}
                      </span>
                      {c.expiration_date && (
                        <span className="font-mono text-[11px] text-amber-300">
                          expires{" "}
                          {new Date(c.expiration_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-slate-500">
                      {[c.issuer, c.certificate_no]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Past performance */}
        <div>
          <SectionHeader
            title={`Past performance (${full.past_performance.length})`}
          />
          <Card>
            {full.past_performance.length === 0 ? (
              <p className="text-xs text-slate-500">
                No prior program references listed.
              </p>
            ) : (
              <ul className="space-y-2">
                {full.past_performance.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2.5"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-slate-100">
                        {p.customer_name}
                      </span>
                      {p.contract_value_usd != null && (
                        <span className="font-mono text-[11px] tabular-nums text-cyan-300">
                          $
                          {Number(p.contract_value_usd).toLocaleString(
                            undefined,
                            { maximumFractionDigits: 0 },
                          )}
                        </span>
                      )}
                    </div>
                    {p.program_name && (
                      <div className="mt-0.5 text-xs text-slate-300">
                        {p.program_name}
                      </div>
                    )}
                    <div className="mt-0.5 font-mono text-[11px] text-slate-500">
                      {[p.year_start, p.year_end].filter((v) => v != null).join("–") ||
                        "—"}{" "}
                      {p.contract_type ? "· " + p.contract_type : ""}
                    </div>
                    {p.references_contact && (
                      <div className="mt-0.5 font-mono text-[11px] text-slate-500">
                        ref: {p.references_contact}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
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
          status={a.status as SupplierApplicationStatus}
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

      {/* Raw payload */}
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
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm text-slate-100">{children}</div>
    </Card>
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

function CountTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900/60 px-2 py-2">
      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
        {label}
      </div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums text-slate-100">
        {value}
      </div>
    </div>
  );
}
