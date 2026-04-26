"use client";

import { Button } from "@/components/ui";
import {
  Callout,
  Checkbox,
  ChoiceCard,
  Field,
  Pill,
  SectionCard,
  Seg,
  Select,
  StepHeader,
  TagInput,
  TextInput,
} from "./primitives";
import type {
  CmmcLevel,
  ComplexityId,
  CustomerData,
  DataResidency,
  ExportSensitivity,
  FirstUseAction,
  FlexLevel,
  FundingStage,
  Geography,
  LeadTolerance,
  LotId,
  OrgType,
  ProgramStage,
} from "./types";
import {
  COMPLEXITY,
  LOTS,
  PROCESSES,
  STAGES,
  SUPPLIER_TYPES,
} from "./types";

type SetSlice<K extends keyof CustomerData> = (patch: Partial<CustomerData[K]>) => void;

// ═════════════ 01 · Company Profile ═════════════
export function CompanyStep({
  data,
  set,
}: {
  data: CustomerData["company"];
  set: SetSlice<"company">;
}) {
  return (
    <div>
      <StepHeader
        eyebrow="Section 01 / 09 · Company Profile"
        title="Tell us who you are."
        desc="Your legal entity, primary contacts, and posture. Launchbelt uses this to provision your workspace and route NDA / DPAS paperwork to the right inbox."
        action={<Pill tone="accent">Step 1 of 9</Pill>}
      />

      <SectionCard title="Legal entity" eyebrow="A.1">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Legal name" required span={2}>
            <TextInput
              value={data.legal_name}
              onChange={(e) => set({ legal_name: e.target.value })}
            />
          </Field>
          <Field label="DBA" optional>
            <TextInput
              value={data.dba}
              onChange={(e) => set({ dba: e.target.value })}
            />
          </Field>
          <Field label="Website" required>
            <TextInput
              mono
              value={data.website}
              onChange={(e) => set({ website: e.target.value })}
            />
          </Field>
          <Field label="Year founded" required>
            <TextInput
              mono
              tnum
              value={data.year_founded}
              onChange={(e) => set({ year_founded: e.target.value })}
            />
          </Field>
          <Field label="Team size" required>
            <TextInput
              mono
              tnum
              value={data.team_size}
              onChange={(e) => set({ team_size: e.target.value })}
            />
          </Field>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="HQ city" required>
            <TextInput
              value={data.hq_city}
              onChange={(e) => set({ hq_city: e.target.value })}
            />
          </Field>
          <Field label="State / region" required>
            <TextInput
              value={data.hq_state}
              onChange={(e) => set({ hq_state: e.target.value })}
            />
          </Field>
          <Field label="Country" required>
            <Select
              value={data.hq_country}
              onChange={(e) => set({ hq_country: e.target.value })}
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="UK">United Kingdom</option>
              <option value="AU">Australia</option>
            </Select>
          </Field>
        </div>
      </SectionCard>

      <div className="h-4" />

      <SectionCard title="Organization type & funding" eyebrow="A.2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Organization type" required>
            <Select
              value={data.org_type}
              onChange={(e) => set({ org_type: e.target.value as OrgType })}
            >
              <option value="startup">Startup / VC-backed</option>
              <option value="prime">Prime contractor</option>
              <option value="oem">OEM / Tier 1</option>
              <option value="enterprise">Enterprise / public</option>
              <option value="gov">Government / national lab</option>
            </Select>
          </Field>
          <Field label="Funding stage" required>
            <Select
              value={data.funding_stage}
              onChange={(e) =>
                set({ funding_stage: e.target.value as FundingStage })
              }
            >
              <option value="bootstrap">Bootstrapped</option>
              <option value="seed">Seed</option>
              <option value="series_a">Series A</option>
              <option value="series_b">Series B</option>
              <option value="series_c">Series C+</option>
              <option value="public">Public</option>
              <option value="enterprise">Enterprise (N/A)</option>
            </Select>
          </Field>
          <Field label="Total funding raised" optional help="USD millions">
            <TextInput
              mono
              tnum
              value={data.total_funding_usd}
              onChange={(e) => set({ total_funding_usd: e.target.value })}
            />
          </Field>
          <Field label="DUNS" optional>
            <TextInput
              mono
              value={data.duns}
              onChange={(e) => set({ duns: e.target.value })}
            />
          </Field>
          <Field
            label="CAGE code"
            optional
            help="If you've registered with SAM.gov"
          >
            <TextInput
              mono
              value={data.cage}
              onChange={(e) => set({ cage: e.target.value })}
            />
          </Field>
          <Field label="NAICS codes" optional>
            <TagInput
              value={data.naics}
              onChange={(v) => set({ naics: v })}
              suggestions={["336411", "336413", "336414", "334511", "332710"]}
            />
          </Field>
        </div>
      </SectionCard>

      <div className="h-4" />

      <SectionCard
        title="Contacts"
        eyebrow="A.3"
        action={
          <Button variant="ghost" size="sm">
            + Add contact
          </Button>
        }
      >
        <div className="overflow-hidden rounded-md border border-slate-800">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-slate-950/40 text-[10.5px] uppercase tracking-[0.08em] text-slate-400">
                <th className="px-3.5 py-2.5 text-left font-semibold">Role</th>
                <th className="px-3.5 py-2.5 text-left font-semibold">Name</th>
                <th className="px-3.5 py-2.5 text-left font-semibold">Title</th>
                <th className="px-3.5 py-2.5 text-left font-semibold">Email</th>
                <th className="px-3.5 py-2.5 text-left font-semibold">Phone</th>
              </tr>
            </thead>
            <tbody>
              {data.contacts.map((c) => (
                <tr key={c.id} className="border-t border-slate-800/70">
                  <td className="px-3.5 py-2.5">
                    <Pill tone={c.role === "primary" ? "accent" : "neutral"} dot={false}>
                      {c.role}
                    </Pill>
                  </td>
                  <td className="px-3.5 py-2.5 font-medium text-slate-100">
                    {c.name}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-400">{c.title}</td>
                  <td className="px-3.5 py-2.5 font-mono text-[12px] text-slate-400">
                    {c.email}
                  </td>
                  <td className="px-3.5 py-2.5 font-mono text-[12px] text-slate-500">
                    {c.phone}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3.5">
          <Callout tone="info">
            Roles drive access &amp; notifications. Engineering contact gets
            RFQ technical questions; procurement contact gets quotes &amp; POs.
          </Callout>
        </div>
      </SectionCard>
    </div>
  );
}

// ═════════════ 02 · Program Types ═════════════
export function ProgramsStep({
  data,
  set,
}: {
  data: CustomerData["programs"];
  set: SetSlice<"programs">;
}) {
  const togType = (id: string, patch: Partial<CustomerData["programs"]["types"][number]>) =>
    set({ types: data.types.map((t) => (t.id === id ? { ...t, ...patch } : t)) });

  return (
    <div>
      <StepHeader
        eyebrow="Section 02 / 09 · Program Types"
        title="What do you build?"
        desc="Toggle each program category you actively work on. Stage and annual volume estimates seed RFQ templates and capacity reservations across the supplier network."
        action={<Pill tone="accent">{data.types.filter((t) => t.on).length} active</Pill>}
      />

      <div className="grid gap-2.5">
        {data.types.map((t) => (
          <div
            key={t.id}
            className={`grid items-center gap-4 rounded-lg border bg-slate-900/50 p-4 ${
              t.on ? "border-cyan-500/35" : "border-slate-800"
            }`}
            style={{ gridTemplateColumns: "24px 220px 200px 150px 1fr" }}
          >
            <Checkbox
              checked={t.on}
              onChange={(e) => togType(t.id, { on: e.target.checked })}
            />
            <div>
              <div className="text-[14px] font-medium text-slate-100">
                {t.label}
              </div>
              <div className="mt-0.5 font-mono text-[11px] tracking-wider text-slate-500">
                cat_{t.id}
              </div>
            </div>
            <Select
              disabled={!t.on}
              value={t.stage}
              onChange={(e) =>
                togType(t.id, { stage: e.target.value as ProgramStage })
              }
            >
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
            <TextInput
              mono
              tnum
              disabled={!t.on}
              placeholder="Annual vol"
              value={t.annual_volume}
              onChange={(e) => togType(t.id, { annual_volume: e.target.value })}
            />
            <TextInput
              disabled={!t.on}
              placeholder="Notes — variants, payload class, MTOW…"
              value={t.notes}
              onChange={(e) => togType(t.id, { notes: e.target.value })}
            />
          </div>
        ))}
      </div>

      <div className="h-4" />

      <SectionCard title="Program portfolio summary" eyebrow="B.2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field
            label="Active programs"
            required
            help="How many discrete programs you'll run through Launchbelt"
          >
            <TextInput
              mono
              tnum
              value={data.total_programs}
              onChange={(e) => set({ total_programs: e.target.value })}
            />
          </Field>
          <Field label="Classified programs?" required>
            <Seg<boolean>
              value={data.classified_programs}
              onChange={(v) => set({ classified_programs: v })}
              options={[
                { value: true, label: "Yes" },
                { value: false, label: "No" },
              ]}
            />
          </Field>
          <Field label="If yes, count" optional>
            <TextInput
              mono
              tnum
              disabled={!data.classified_programs}
              value={data.classified_count}
              onChange={(e) => set({ classified_count: e.target.value })}
            />
          </Field>
        </div>
        <div className="mt-3.5">
          <Callout tone="warn">
            Classified work routes only to suppliers with verified facility
            clearance. Selecting &ldquo;yes&rdquo; enables a separate intake
            step before RFQ submission.
          </Callout>
        </div>
      </SectionCard>
    </div>
  );
}

// ═════════════ 03 · Manufacturing Needs ═════════════
export function ManufacturingStep({
  data,
  set,
}: {
  data: CustomerData["manufacturing"];
  set: SetSlice<"manufacturing">;
}) {
  const togProc = (p: string) =>
    set({
      processes: data.processes.includes(p)
        ? data.processes.filter((x) => x !== p)
        : [...data.processes, p],
    });

  return (
    <div>
      <StepHeader
        eyebrow="Section 03 / 09 · Manufacturing Needs"
        title="What do you need made, and how?"
        desc="Capability fingerprint for matching. Suppliers in the network are filtered by process intersection before any RFQ goes out."
      />

      <SectionCard title="Primary processes required" eyebrow="C.1">
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
          {PROCESSES.map((p) => {
            const on = data.processes.includes(p);
            return (
              <label
                key={p}
                className={`flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2.5 text-[13px] transition ${
                  on
                    ? "border-cyan-500/35 bg-cyan-500/[0.06]"
                    : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                }`}
              >
                <Checkbox checked={on} onChange={() => togProc(p)} />
                <span>{p}</span>
              </label>
            );
          })}
        </div>
      </SectionCard>

      <div className="h-4" />

      <SectionCard title="Typical part complexity" eyebrow="C.2">
        <div className="mb-4 grid grid-cols-1 gap-2.5 md:grid-cols-4">
          {COMPLEXITY.map((c) => (
            <ChoiceCard
              key={c.id}
              active={data.part_complexity === c.id}
              onClick={() => set({ part_complexity: c.id })}
              title={c.label}
              desc={c.desc}
            />
          ))}
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            Distribution across complexity tiers{" "}
            <span className="ml-1 font-medium normal-case tracking-normal text-slate-600">
              % of annual parts
            </span>
          </label>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            {COMPLEXITY.map((c) => (
              <div
                key={c.id}
                className="rounded-md border border-slate-800 bg-slate-900/50 px-3 py-2.5"
              >
                <div className="font-mono text-[10.5px] uppercase tracking-wider text-slate-500">
                  {c.label}
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <input
                    className="w-full bg-transparent font-mono text-[14px] tabular-nums text-slate-100 focus:outline-none"
                    value={data.complexity_mix[c.id as ComplexityId]}
                    onChange={(e) =>
                      set({
                        complexity_mix: {
                          ...data.complexity_mix,
                          [c.id]: Number(e.target.value) || 0,
                        },
                      })
                    }
                  />
                  <span className="font-mono text-[11px] text-slate-500">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <div className="h-4" />

      <SectionCard title="Typical order size" eyebrow="C.3">
        <div className="mb-3.5 grid grid-cols-1 gap-2.5 md:grid-cols-3">
          {LOTS.map((l) => (
            <ChoiceCard
              key={l.id}
              active={data.typical_lot === l.id}
              onClick={() => set({ typical_lot: l.id as LotId })}
              title={l.label}
              desc={
                <span className="font-mono text-[12px] text-cyan-300">
                  {l.range} units
                </span>
              }
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Annual part count" optional>
            <TextInput
              mono
              value={data.annual_part_count}
              onChange={(e) => set({ annual_part_count: e.target.value })}
            />
          </Field>
          <Field label="Annual mfg spend" optional help="USD millions">
            <TextInput
              mono
              tnum
              value={data.annual_spend_usd}
              onChange={(e) => set({ annual_spend_usd: e.target.value })}
            />
          </Field>
          <Field label="Avg unit cost" optional help="USD">
            <TextInput
              mono
              tnum
              value={data.avg_unit_cost_usd}
              onChange={(e) => set({ avg_unit_cost_usd: e.target.value })}
            />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}

const COMPLIANCE_FLAGS: {
  k: keyof CustomerData["compliance"];
  label: string;
  desc: string;
}[] = [
  { k: "itar", label: "ITAR required", desc: "Technical data and end-items controlled under USML. Restricts to ITAR-registered, US-person-only suppliers." },
  { k: "cui", label: "CUI handling required", desc: "Controlled Unclassified Information per 32 CFR 2002. Requires NIST 800-171 conformant suppliers." },
  { k: "as9100", label: "AS9100D required", desc: "Aerospace QMS. Required for any flight-hardware supplier." },
  { k: "nadcap", label: "NADCAP required", desc: "For special processes — heat treat, NDT, chem processing, coating, welding." },
  { k: "defense_program", label: "Active defense program involvement", desc: "DoD prime or sub work. Enables DPAS rating, FAR/DFARS clauses, and sole-source justifications." },
];

function ComplianceFlag({
  on,
  label,
  desc,
  onChange,
}: {
  on: boolean;
  label: string;
  desc: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={`grid cursor-pointer items-start gap-3 rounded-md border bg-slate-900/50 px-4 py-3 transition ${
        on ? "border-cyan-500/35" : "border-slate-800"
      }`}
      style={{ gridTemplateColumns: "22px 1fr auto" }}
    >
      <Checkbox
        checked={on}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5"
      />
      <div>
        <div className="text-[13.5px] font-medium text-slate-100">{label}</div>
        <div className="mt-1 text-[12px] leading-relaxed text-slate-500">
          {desc}
        </div>
      </div>
      {on && <Pill tone="accent">Required</Pill>}
    </label>
  );
}

// ═════════════ 04 · Compliance Requirements ═════════════
export function ComplianceStep({
  data,
  set,
}: {
  data: CustomerData["compliance"];
  set: SetSlice<"compliance">;
}) {
  return (
    <div>
      <StepHeader
        eyebrow="Section 04 / 09 · Compliance Requirements"
        title="What flow-down do your programs require?"
        desc="Compliance gates the supplier set. Anything checked here is hard-filtered at routing time — non-conforming suppliers cannot bid your work."
      />

      <SectionCard title="Regulatory & program flow-down" eyebrow="D.1">
        <div className="grid gap-2.5">
          {COMPLIANCE_FLAGS.map((f) => (
            <ComplianceFlag
              key={f.k}
              on={data[f.k] === true}
              label={f.label}
              desc={f.desc}
              onChange={(v) =>
                set({ [f.k]: v } as Partial<CustomerData["compliance"]>)
              }
            />
          ))}
        </div>
      </SectionCard>

      {data.defense_program && (
        <>
          <div className="h-4" />
          <SectionCard title="Defense program detail" eyebrow="D.2">
            <Field
              label="Named programs"
              required
              help="Press Enter after each program name. Used to apply correct FAR/DFARS clauses."
            >
              <TagInput
                value={data.defense_program_names}
                onChange={(v) => set({ defense_program_names: v })}
                placeholder="e.g. F-35 LRIP, JCO LASSO"
              />
            </Field>
            <div className="mt-3.5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Required CMMC level" required>
                <Select
                  value={data.cmmc_required_level}
                  onChange={(e) =>
                    set({ cmmc_required_level: e.target.value as CmmcLevel })
                  }
                >
                  <option value="none">Not required</option>
                  <option value="level_1">Level 1 — basic</option>
                  <option value="level_2">Level 2 — advanced</option>
                  <option value="level_3">Level 3 — expert</option>
                </Select>
              </Field>
              <Field label="EAR / USML designation" optional>
                <TextInput
                  mono
                  value={data.ear_designation}
                  onChange={(e) => set({ ear_designation: e.target.value })}
                />
              </Field>
              <Field label="Attestation required from suppliers?" required>
                <Seg<boolean>
                  value={data.attestation_required}
                  onChange={(v) => set({ attestation_required: v })}
                  options={[
                    { value: true, label: "Yes" },
                    { value: false, label: "No" },
                  ]}
                />
              </Field>
            </div>
          </SectionCard>
        </>
      )}

      <div className="h-4" />

      <SectionCard title="Export control sensitivity" eyebrow="D.3">
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {(
            [
              { id: "low", label: "Low", desc: "EAR99 only" },
              { id: "moderate", label: "Moderate", desc: "Dual-use 9A" },
              { id: "high", label: "High", desc: "USML, license-controlled" },
              { id: "classified", label: "Classified", desc: "Requires FCL" },
            ] as { id: ExportSensitivity; label: string; desc: string }[]
          ).map((o) => (
            <ChoiceCard
              key={o.id}
              active={data.export_control_sensitivity === o.id}
              onClick={() => set({ export_control_sensitivity: o.id })}
              title={o.label}
              desc={o.desc}
            />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ═════════════ 05 · Program Characteristics ═════════════
export function CharsStep({
  data,
  set,
}: {
  data: CustomerData["program_chars"];
  set: SetSlice<"program_chars">;
}) {
  const flexOpts = (["low", "medium", "high"] as FlexLevel[]).map((o) => ({
    value: o,
    label: o[0].toUpperCase() + o.slice(1),
  }));

  return (
    <div>
      <StepHeader
        eyebrow="Section 05 / 09 · Program Characteristics"
        title="How do your programs run?"
        desc="Lead time, schedule rigidity, and risk posture. These weights determine ranking when multiple qualified suppliers can fulfill an RFQ."
      />

      <SectionCard title="Lead time expectations" eyebrow="E.1">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field
            label="Typical expected lead time"
            required
            help="From PO to delivery, weeks"
          >
            <TextInput
              mono
              tnum
              value={data.typical_lead_time_weeks}
              onChange={(e) => set({ typical_lead_time_weeks: e.target.value })}
            />
          </Field>
          <Field label="Lead time tolerance" required>
            <Select
              value={data.lead_time_tolerance}
              onChange={(e) =>
                set({ lead_time_tolerance: e.target.value as LeadTolerance })
              }
            >
              <option value="strict">Strict — date-driven</option>
              <option value="moderate">Moderate — ±1 week</option>
              <option value="flexible">Flexible — ±3 weeks</option>
            </Select>
          </Field>
          <Field
            label="Buffer to add to supplier promise"
            optional
            help="Weeks of contingency you internalize"
          >
            <TextInput
              mono
              tnum
              value={data.preferred_buffer_weeks}
              onChange={(e) => set({ preferred_buffer_weeks: e.target.value })}
            />
          </Field>
        </div>
      </SectionCard>

      <div className="h-4" />

      <SectionCard title="Schedule posture" eyebrow="E.2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Schedule flexibility" required>
            <Seg<FlexLevel>
              value={data.schedule_flexibility}
              onChange={(v) => set({ schedule_flexibility: v })}
              options={flexOpts}
            />
          </Field>
          <Field label="Critical path sensitivity" required>
            <Seg<FlexLevel>
              value={data.critical_path_sensitivity}
              onChange={(v) => set({ critical_path_sensitivity: v })}
              options={flexOpts}
            />
          </Field>
        </div>
      </SectionCard>

      <div className="h-4" />

      <SectionCard title="Cost ↔ Speed tradeoff" eyebrow="E.3">
        <div className="px-1 py-1.5">
          <div className="mb-2 flex justify-between font-mono text-[11px] uppercase tracking-[0.06em] text-slate-500">
            <span>← Optimize for cost</span>
            <span>Optimize for speed →</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={data.cost_vs_speed}
            onChange={(e) => set({ cost_vs_speed: Number(e.target.value) })}
            className="w-full accent-cyan-400"
          />
          <div className="mt-2.5 flex items-center justify-between">
            <span className="font-mono text-[13px] text-slate-400">
              cost weight:{" "}
              <span className="text-slate-100">{100 - data.cost_vs_speed}%</span>
            </span>
            <Pill
              tone={
                data.cost_vs_speed > 60
                  ? "accent"
                  : data.cost_vs_speed < 40
                  ? "info"
                  : "neutral"
              }
            >
              {data.cost_vs_speed >= 70
                ? "Speed-forward"
                : data.cost_vs_speed <= 30
                ? "Cost-forward"
                : "Balanced"}
            </Pill>
            <span className="font-mono text-[13px] text-slate-400">
              speed weight:{" "}
              <span className="text-slate-100">{data.cost_vs_speed}%</span>
            </span>
          </div>
        </div>
      </SectionCard>

      <div className="h-4" />

      <SectionCard title="Risk tolerance" eyebrow="E.4">
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
          {(
            [
              { id: "low", label: "Low", desc: "Certified suppliers only, conservative routing" },
              { id: "medium", label: "Medium", desc: "Mix of established + emerging suppliers" },
              { id: "high", label: "High", desc: "Open to first-time suppliers w/ strong fundamentals" },
            ] as { id: FlexLevel; label: string; desc: string }[]
          ).map((o) => (
            <ChoiceCard
              key={o.id}
              active={data.risk_tolerance === o.id}
              onClick={() => set({ risk_tolerance: o.id })}
              title={o.label}
              desc={o.desc}
            />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ═════════════ 06 · Supply Chain ═════════════
export function SupplyChainStep({
  data,
  set,
}: {
  data: CustomerData["supply_chain"];
  set: SetSlice<"supply_chain">;
}) {
  const togType = (t: string) =>
    set({
      preferred_supplier_types: data.preferred_supplier_types.includes(t)
        ? data.preferred_supplier_types.filter((x) => x !== t)
        : [...data.preferred_supplier_types, t],
    });

  return (
    <div>
      <StepHeader
        eyebrow="Section 06 / 09 · Supply Chain Preferences"
        title="Where and how should we source?"
        desc="Supplier preferences encoded as routing weights. Hard requirements (e.g. domestic-only) are enforced as filters; soft preferences shift ranking."
      />

      <SectionCard
        title="Preferred supplier traits"
        eyebrow="F.1"
        action={
          <Pill tone="neutral">
            {data.preferred_supplier_types.length} selected
          </Pill>
        }
      >
        <div className="flex flex-wrap gap-2">
          {SUPPLIER_TYPES.map((t) => {
            const on = data.preferred_supplier_types.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => togType(t)}
                className={`rounded-md border px-3.5 py-2 text-[13px] transition ${
                  on
                    ? "border-cyan-500/40 bg-cyan-500/[0.08] text-cyan-300"
                    : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700"
                }`}
              >
                {on ? "✓ " : ""}
                {t}
              </button>
            );
          })}
        </div>
      </SectionCard>

      <div className="h-4" />

      <SectionCard title="Geography & sourcing posture" eyebrow="F.2">
        <Field label="Geographic scope" required>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
            {(
              [
                { id: "domestic_only", label: "US domestic only", desc: "DFARS 252.225-7012 compliant" },
                { id: "five_eyes", label: "Five Eyes (US/UK/CA/AU/NZ)", desc: "Allied-only sourcing" },
                { id: "global", label: "Global", desc: "Open to international suppliers" },
              ] as { id: Geography; label: string; desc: string }[]
            ).map((o) => (
              <ChoiceCard
                key={o.id}
                active={data.geography === o.id}
                onClick={() => set({ geography: o.id })}
                title={o.label}
                desc={o.desc}
              />
            ))}
          </div>
        </Field>
        <div className="mt-3.5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label="US regions preferred"
            optional
            help="Soft preference — boosts ranking"
          >
            <TagInput
              value={data.regions}
              onChange={(v) => set({ regions: v })}
              suggestions={[
                "West",
                "Mountain",
                "Southwest",
                "Texas",
                "Midwest",
                "Southeast",
                "Northeast",
                "Pacific NW",
              ]}
            />
          </Field>
          <Field
            label="Suppliers per part"
            required
            help="Distributed sourcing reduces single-point-of-failure risk"
          >
            <Select
              value={data.preferred_supplier_count_per_part}
              onChange={(e) =>
                set({ preferred_supplier_count_per_part: e.target.value })
              }
            >
              <option value="1">1 — single source (fastest, highest risk)</option>
              <option value="2">2 — dual source (recommended)</option>
              <option value="3">3 — triple source (full redundancy)</option>
            </Select>
          </Field>
        </div>
      </SectionCard>

      <div className="h-4" />

      <SectionCard title="Sourcing & contracting requirements" eyebrow="F.3">
        <div className="grid gap-2.5">
          {(
            [
              ["itar_routing_required", "ITAR-only routing", "Suppliers must be ITAR-registered with active DDTC M-code."],
              ["requires_dpas", "DPAS-rated work", "Defense Priorities and Allocations System rating required for the supplier."],
              ["buy_american_act", "Buy American Act", "FAR 52.225-1 — 60%+ US-mined, manufactured, or produced material."],
              ["berry_amendment", "Berry Amendment", "DFARS 252.225-7012 — domestic textile, food, hand/measuring tools."],
            ] as [keyof CustomerData["supply_chain"], string, string][]
          ).map(([k, label, desc]) => {
            const on = data[k] === true;
            return (
              <label
                key={k}
                className={`grid cursor-pointer items-start gap-3 rounded-md border bg-slate-900/50 px-4 py-3 ${
                  on ? "border-cyan-500/35" : "border-slate-800"
                }`}
                style={{ gridTemplateColumns: "22px 1fr" }}
              >
                <Checkbox
                  checked={on}
                  onChange={(e) =>
                    set({ [k]: e.target.checked } as Partial<CustomerData["supply_chain"]>)
                  }
                  className="mt-0.5"
                />
                <div>
                  <div className="text-[13px] font-medium text-slate-100">
                    {label}
                  </div>
                  <div className="mt-0.5 text-[11.5px] leading-relaxed text-slate-500">
                    {desc}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}

// ═════════════ 07 · Data & Integration ═════════════
export function DataStep({
  data,
  set,
}: {
  data: CustomerData["data"];
  set: SetSlice<"data">;
}) {
  return (
    <div>
      <StepHeader
        eyebrow="Section 07 / 09 · Data & Integration"
        title="How does your engineering data move?"
        desc="Launchbelt mirrors your CAD / PLM revision practices and shapes RFQ packets to the formats your suppliers can ingest. Connect upstream once; rev-control flows downstream automatically."
      />

      <SectionCard title="CAD environment" eyebrow="G.1">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="CAD systems in use" required>
            <TagInput
              value={data.cad_systems}
              onChange={(v) => set({ cad_systems: v })}
              suggestions={["SolidWorks", "CATIA V5", "CATIA 3DX", "NX", "Creo", "Inventor", "Fusion 360", "OnShape"]}
            />
          </Field>
          <Field label="Native + neutral file formats" required>
            <TagInput
              value={data.cad_formats}
              onChange={(v) => set({ cad_formats: v })}
              suggestions={["STEP AP242", "STEP AP203", "IGES", "Parasolid", "JT", "3D PDF", "SLDPRT", "CATPart", "PRT", "DXF", "DWG"]}
            />
          </Field>
          <Field label="Drawing standard" required>
            <Select
              value={data.drawing_standard}
              onChange={(e) => set({ drawing_standard: e.target.value })}
            >
              <option>ASME Y14.5-2018</option>
              <option>ASME Y14.5-2009</option>
              <option>ISO 1101</option>
              <option>MIL-STD-100</option>
            </Select>
          </Field>
          <Field label="Model-Based Definition (MBD)?" required>
            <Seg<boolean>
              value={data.model_based_definition}
              onChange={(v) => set({ model_based_definition: v })}
              options={[
                { value: true, label: "Yes — MBD primary" },
                { value: false, label: "No — drawing primary" },
              ]}
            />
          </Field>
        </div>
      </SectionCard>

      <div className="h-4" />

      <SectionCard title="PLM / ERP / MES" eyebrow="G.2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="PLM system" required>
            <Select
              value={data.plm_system}
              onChange={(e) => set({ plm_system: e.target.value })}
            >
              <option>Siemens Teamcenter</option>
              <option>PTC Windchill</option>
              <option>Dassault 3DEXPERIENCE</option>
              <option>Aras Innovator</option>
              <option>Arena PLM</option>
              <option>None</option>
            </Select>
          </Field>
          <Field label="ERP system" required>
            <Select
              value={data.erp_system}
              onChange={(e) => set({ erp_system: e.target.value })}
            >
              <option>NetSuite</option>
              <option>SAP</option>
              <option>Oracle Fusion</option>
              <option>Epicor Kinetic</option>
              <option>Plex</option>
              <option>QuickBooks</option>
              <option>None</option>
            </Select>
          </Field>
          <Field label="MES system" optional>
            <TextInput
              value={data.mes_system}
              onChange={(e) => set({ mes_system: e.target.value })}
            />
          </Field>
          <Field label="Revision control practice" required>
            <Select
              value={data.revision_control}
              onChange={(e) => set({ revision_control: e.target.value })}
            >
              <option>PLM-managed (Teamcenter)</option>
              <option>PLM-managed (Windchill)</option>
              <option>PLM-managed (3DEXPERIENCE)</option>
              <option>Vault / file-based</option>
              <option>Manual / spreadsheet</option>
            </Select>
          </Field>
          <Field label="Branching model" required>
            <Select
              value={data.pdm_branching}
              onChange={(e) => set({ pdm_branching: e.target.value })}
            >
              <option value="release-based">Release-based (rev letters)</option>
              <option value="git-style">Git-style branches</option>
              <option value="linear">Linear (no branching)</option>
            </Select>
          </Field>
          <Field label="Integration?">
            <Button variant="secondary" size="sm">
              Connect Teamcenter
            </Button>
          </Field>
        </div>
      </SectionCard>

      <div className="h-4" />

      <SectionCard title="File transfer" eyebrow="G.3">
        <Field
          label="Authorized file transfer methods"
          required
          help="Listed in priority order"
        >
          <TagInput
            value={data.file_transfer}
            onChange={(v) => set({ file_transfer: v })}
            suggestions={[
              "Launchbelt secure room",
              "SFTP",
              "Aspera",
              "DoD SAFE",
              "Email (encrypted)",
            ]}
          />
        </Field>
        <div className="mt-3.5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Max attachment size" optional help="MB">
            <TextInput
              mono
              tnum
              value={data.max_attachment_mb}
              onChange={(e) => set({ max_attachment_mb: e.target.value })}
            />
          </Field>
          <Field label="Quarantine new uploads?" required>
            <Seg<boolean>
              value={true}
              onChange={() => {}}
              options={[
                { value: true, label: "Yes — scan + hold 24h" },
                { value: false, label: "No" },
              ]}
            />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}

// ═════════════ 08 · Initial Use Case ═════════════
export function FirstUseStep({
  data,
  set,
}: {
  data: CustomerData["first_use"];
  set: SetSlice<"first_use">;
}) {
  const cards: { id: FirstUseAction; title: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: "first_part",
      title: "Upload your first part",
      desc: "Drop a STEP file. We'll generate a manufacturability brief, suggest 4–6 qualified suppliers, and let you fire a single-part RFQ.",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
        </svg>
      ),
    },
    {
      id: "first_program",
      title: "Create your first program",
      desc: "Spin up a program workspace. Add BOM, group parts, define the supplier tier, and route many RFQs together.",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      ),
    },
    {
      id: "pilot_rfq",
      title: "Run a pilot RFQ",
      desc: "Closed pilot to evaluate Launchbelt against your incumbent process. We'll route to your shortlist and benchmark side-by-side.",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <StepHeader
        eyebrow="Section 08 / 09 · Initial Use Case"
        title="How would you like to start?"
        desc="Pick the first thing you'd like to do in Launchbelt. We'll provision the workspace tuned for that action — and you can do everything else later."
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {cards.map((c) => {
          const active = data.action === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => set({ action: c.id })}
              className={`rounded-lg border p-5 text-left transition ${
                active
                  ? "border-cyan-500/40 bg-cyan-500/[0.06]"
                  : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
              }`}
            >
              <div className="mb-2 flex items-center gap-2.5">
                <div
                  className={`grid h-8 w-8 place-content-center rounded-md border border-slate-800 ${
                    active ? "bg-cyan-500/[0.15] text-cyan-300" : "bg-slate-900 text-slate-400"
                  }`}
                >
                  {c.icon}
                </div>
                <div className="text-[14px] font-medium text-slate-100">
                  {c.title}
                </div>
              </div>
              <div className="text-[12.5px] leading-relaxed text-slate-500">
                {c.desc}
              </div>
            </button>
          );
        })}
      </div>

      <div className="h-5" />

      {data.action === "first_part" && (
        <SectionCard title="First part details" eyebrow="H.1">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Part name" required>
              <TextInput
                value={data.part_name}
                onChange={(e) => set({ part_name: e.target.value })}
              />
            </Field>
            <Field label="Material" required>
              <TextInput
                mono
                value={data.part_material}
                onChange={(e) => set({ part_material: e.target.value })}
              />
            </Field>
            <Field label="Quantity" required>
              <TextInput
                mono
                tnum
                value={data.part_qty}
                onChange={(e) => set({ part_qty: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-3.5 cursor-pointer rounded-md border border-dashed border-slate-700 bg-slate-950/40 px-5 py-6 text-center transition hover:border-cyan-700 hover:bg-cyan-500/[0.03]">
            <svg
              className="mx-auto mb-2 text-cyan-400"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            <div className="text-[13px] font-medium text-slate-100">
              Drop a STEP / Parasolid file
            </div>
            <div className="mt-0.5 font-mono text-[11.5px] text-slate-500">
              .step .stp .x_t .x_b · max 500 MB · auto-quarantined for scan
            </div>
          </div>
        </SectionCard>
      )}

      {data.action === "first_program" && (
        <SectionCard title="First program scope" eyebrow="H.1">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Program / part name" required>
              <TextInput
                value={data.part_name}
                onChange={(e) => set({ part_name: e.target.value })}
              />
            </Field>
            <Field label="Lead-item material" required>
              <TextInput
                mono
                value={data.part_material}
                onChange={(e) => set({ part_material: e.target.value })}
              />
            </Field>
            <Field label="Annual unit qty" required>
              <TextInput
                mono
                tnum
                value={data.part_qty}
                onChange={(e) => set({ part_qty: e.target.value })}
              />
            </Field>
            <Field label="Target lead time" required help="Weeks">
              <TextInput
                mono
                tnum
                value={data.target_lead_weeks}
                onChange={(e) => set({ target_lead_weeks: e.target.value })}
              />
            </Field>
            <Field label="Target supplier count" required>
              <Select
                value={data.target_suppliers}
                onChange={(e) =>
                  set({ target_suppliers: Number(e.target.value) })
                }
              >
                {[2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} suppliers
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Pilot value" optional help="USD">
              <TextInput
                mono
                tnum
                value={data.pilot_value_usd}
                onChange={(e) => set({ pilot_value_usd: e.target.value })}
              />
            </Field>
          </div>
        </SectionCard>
      )}

      {data.action === "pilot_rfq" && (
        <SectionCard title="Pilot RFQ scope" eyebrow="H.1">
          <Callout tone="info">
            A pilot routes through a curated shortlist of Launchbelt suppliers
            in parallel with your incumbent quote. After award, we&apos;ll
            publish a side-by-side scorecard.
          </Callout>
          <div className="mt-3.5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Pilot RFQ name" required>
              <TextInput
                value={data.part_name}
                onChange={(e) => set({ part_name: e.target.value })}
              />
            </Field>
            <Field label="Estimated total value" required help="USD">
              <TextInput
                mono
                tnum
                value={data.pilot_value_usd}
                onChange={(e) => set({ pilot_value_usd: e.target.value })}
              />
            </Field>
            <Field label="Target lead time" required help="Weeks">
              <TextInput
                mono
                tnum
                value={data.target_lead_weeks}
                onChange={(e) => set({ target_lead_weeks: e.target.value })}
              />
            </Field>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ═════════════ 09 · Review & Confirm ═════════════
export function ReviewStep({
  data,
  set,
  derivedTier,
  goToStep,
}: {
  data: CustomerData;
  set: SetSlice<"workspace">;
  derivedTier: string;
  goToStep: (idx: number) => void;
}) {
  const w = data.workspace;
  const summaries: { id: string; title: string; lines: string[]; stepIdx: number }[] = [
    {
      id: "company",
      title: "Company",
      stepIdx: 0,
      lines: [
        `${data.company.legal_name} · ${data.company.hq_city}, ${data.company.hq_state}`,
        `${data.company.team_size} people · ${data.company.org_type} · ${data.company.funding_stage}`,
      ],
    },
    {
      id: "programs",
      title: "Programs",
      stepIdx: 1,
      lines: [
        data.programs.types
          .filter((t) => t.on)
          .map((t) => t.label)
          .join(" · "),
        `${data.programs.total_programs} active programs · ${
          data.programs.classified_programs
            ? "classified work present"
            : "no classified work"
        }`,
      ],
    },
    {
      id: "manufacturing",
      title: "Manufacturing",
      stepIdx: 2,
      lines: [
        `${data.manufacturing.processes.length} processes · ${data.manufacturing.part_complexity.replace("_", " ")}`,
        `${data.manufacturing.typical_lot.replace("_", " ")} runs · ${data.manufacturing.annual_part_count}`,
      ],
    },
    {
      id: "compliance",
      title: "Compliance",
      stepIdx: 3,
      lines: [
        [
          data.compliance.itar && "ITAR",
          data.compliance.cui && "CUI",
          data.compliance.as9100 && "AS9100",
          data.compliance.nadcap && "NADCAP",
        ]
          .filter(Boolean)
          .join(" · "),
        `Export sensitivity: ${data.compliance.export_control_sensitivity} · CMMC: ${data.compliance.cmmc_required_level.replace("_", " ")}`,
      ],
    },
    {
      id: "program_chars",
      title: "Program posture",
      stepIdx: 4,
      lines: [
        `Lead ~${data.program_chars.typical_lead_time_weeks}wk · ${data.program_chars.schedule_flexibility} flex · ${data.program_chars.risk_tolerance}-risk`,
        `${
          data.program_chars.cost_vs_speed >= 70
            ? "speed-forward"
            : data.program_chars.cost_vs_speed <= 30
            ? "cost-forward"
            : "balanced"
        } (${data.program_chars.cost_vs_speed}/100)`,
      ],
    },
    {
      id: "supply_chain",
      title: "Supply chain",
      stepIdx: 5,
      lines: [
        `${data.supply_chain.geography.replace("_", " ")} · ${data.supply_chain.preferred_supplier_count_per_part}× per part · ${data.supply_chain.preferred_supplier_types.length} preferred traits`,
        [
          data.supply_chain.itar_routing_required && "ITAR routing",
          data.supply_chain.requires_dpas && "DPAS",
          data.supply_chain.buy_american_act && "BAA",
        ]
          .filter(Boolean)
          .join(" · ") || "—",
      ],
    },
    {
      id: "data",
      title: "Data & integration",
      stepIdx: 6,
      lines: [
        `${data.data.cad_systems.join(", ")} → ${data.data.plm_system}`,
        `${data.data.cad_formats.length} formats · ${data.data.model_based_definition ? "MBD primary" : "drawing primary"}`,
      ],
    },
    {
      id: "first_use",
      title: "Initial use case",
      stepIdx: 7,
      lines: [
        `${
          data.first_use.action === "first_part"
            ? "Upload first part"
            : data.first_use.action === "first_program"
            ? "Create first program"
            : "Run pilot RFQ"
        } · ${data.first_use.part_name}`,
        `${data.first_use.part_qty} units · ${data.first_use.target_lead_weeks} week target`,
      ],
    },
  ];

  return (
    <div>
      <StepHeader
        eyebrow="Section 09 / 09 · Review & Confirm"
        title="Review your configuration."
        desc="When you confirm, Launchbelt provisions your workspace with the routing rules, RFQ templates, and supplier filters derived from your answers above."
        action={<Pill tone="success">{derivedTier} customer</Pill>}
      />

      <SectionCard title="Configuration summary">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {summaries.map((s) => (
            <div
              key={s.id}
              className="rounded-md border border-slate-800 bg-slate-900/50 px-4 py-3.5"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-slate-500">
                  {s.title}
                </span>
                <button
                  type="button"
                  onClick={() => goToStep(s.stepIdx)}
                  className="font-mono text-[11px] uppercase tracking-[0.06em] text-cyan-400 transition hover:text-cyan-300"
                >
                  Edit
                </button>
              </div>
              {s.lines.map((l, i) => (
                <div
                  key={i}
                  className={`mb-0.5 text-[12.5px] leading-relaxed ${
                    i === 0 ? "text-slate-100" : "text-slate-400"
                  }`}
                >
                  {l}
                </div>
              ))}
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="h-4" />

      <SectionCard title="Workspace provisioning" eyebrow="I.2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Workspace name" required>
            <TextInput
              value={w.workspace_name}
              onChange={(e) => set({ workspace_name: e.target.value })}
            />
          </Field>
          <Field label="Subdomain" required>
            <div className="flex items-center rounded-md border border-slate-700 bg-[#060c18] px-3">
              <input
                className="flex-1 bg-transparent py-2 font-mono text-[12.5px] text-slate-100 focus:outline-none"
                value={w.subdomain}
                onChange={(e) => set({ subdomain: e.target.value })}
              />
              <span className="font-mono text-[12px] text-slate-500">
                .launchbelt.com
              </span>
            </div>
          </Field>
          <Field label="Initial seats" required>
            <TextInput
              mono
              tnum
              value={w.seats}
              onChange={(e) => set({ seats: e.target.value })}
            />
          </Field>
          <Field label="Data residency" required>
            <Select
              value={w.data_residency}
              onChange={(e) =>
                set({ data_residency: e.target.value as DataResidency })
              }
            >
              <option value="us_east">
                US-East (Virginia, GovCloud-eligible)
              </option>
              <option value="us_west">US-West (Oregon)</option>
              <option value="us_govcloud">AWS GovCloud (US)</option>
            </Select>
          </Field>
          <Field label="SSO provider" required>
            <Select
              value={w.sso_provider}
              onChange={(e) => set({ sso_provider: e.target.value })}
            >
              <option>Okta</option>
              <option>Azure AD / Entra</option>
              <option>Google Workspace</option>
              <option>Ping Identity</option>
              <option>None (email + password)</option>
            </Select>
          </Field>
          <Field label="Audit log retention" required help="Years">
            <TextInput
              mono
              tnum
              value={w.audit_log_retention_yrs}
              onChange={(e) => set({ audit_log_retention_yrs: e.target.value })}
            />
          </Field>
        </div>
      </SectionCard>

      <div className="h-4" />

      <Callout tone="accent">
        <strong>What happens on confirm:</strong> (1) Workspace is provisioned
        in {w.data_residency.replace("_", "-").toUpperCase()} (≈ 90s).
        (2) Your {w.sso_provider} SSO is registered for {w.seats} seats.
        (3) RFQ templates pre-filled with your compliance flow-down.
        (4) Supplier shortlist generated — ranked by your routing weights.
        (5) Calendar invite sent for kickoff with your assigned Launchbelt
        forward-deployed engineer.
      </Callout>
    </div>
  );
}
