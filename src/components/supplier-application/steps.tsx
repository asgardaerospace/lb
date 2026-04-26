"use client";

import type { ReactNode } from "react";
import {
  Badge,
  Button,
  Callout,
  Field,
  Ic,
  LbCard,
  ScoreRing,
  TagInput,
  Checkbox,
} from "./primitives";
import type { ApplicationData } from "./data";
import { STEPS } from "./data";

type Setter = (patch: Partial<ApplicationData>) => void;

interface StepProps {
  data: ApplicationData;
  set: Setter;
}

function StepHeader({
  num,
  title,
  desc,
  action,
}: {
  num: string;
  title: string;
  desc: string;
  action?: ReactNode;
}) {
  return (
    <div className="lb-step-header">
      <div>
        <div className="lb-step-eyebrow">SECTION {num} / 12</div>
        <h2 className="lb-step-title">{title}</h2>
        <p className="lb-step-desc">{desc}</p>
      </div>
      {action}
    </div>
  );
}

const Spacer = ({ h = 18 }: { h?: number }) => <div style={{ height: h }} />;

// ───────── 01 Company ─────────
export function StepCompany({ data, set }: StepProps) {
  const c = data.company;
  const u = <K extends keyof ApplicationData["company"]>(
    k: K,
    v: ApplicationData["company"][K],
  ) => set({ company: { ...c, [k]: v } });
  return (
    <div className="lb-fade-in">
      <StepHeader
        num="01"
        title="Company Profile"
        desc="Legal entity, federal identifiers, ownership characteristics, and primary commercial contact. This is the record that propagates to RFQs, contracts, and 1099 / DFARS reporting."
      />

      <LbCard title="Legal entity" eyebrow="A.1">
        <div className="lb-grid-2">
          <Field label="Legal name" required>
            <input className="lb-input" value={c.legal_name} onChange={(e) => u("legal_name", e.target.value)} />
          </Field>
          <Field label="DBA / trade name" optional>
            <input className="lb-input" value={c.dba} onChange={(e) => u("dba", e.target.value)} />
          </Field>
          <Field label="Entity type" required>
            <select className="lb-select" value={c.entity_type} onChange={(e) => u("entity_type", e.target.value)}>
              <option value="llc">LLC</option>
              <option value="c_corp">C-Corporation</option>
              <option value="s_corp">S-Corporation</option>
              <option value="partnership">Partnership</option>
              <option value="sole_prop">Sole Proprietorship</option>
            </select>
          </Field>
          <Field label="Year founded" required>
            <input className="lb-input lb-mono" value={c.year_founded} onChange={(e) => u("year_founded", e.target.value)} />
          </Field>
        </div>
      </LbCard>

      <Spacer />

      <LbCard
        title="Federal & commercial identifiers"
        eyebrow="A.2"
        action={<Badge tone="accent">Validated against SAM.gov</Badge>}
      >
        <div className="lb-grid-4">
          <Field label="EIN" required help="Federal Employer ID">
            <input className="lb-input lb-mono" value={c.ein} onChange={(e) => u("ein", e.target.value)} placeholder="00-0000000" />
          </Field>
          <Field label="DUNS / UEI" required>
            <input className="lb-input lb-mono" value={c.duns} onChange={(e) => u("duns", e.target.value)} />
          </Field>
          <Field label="CAGE code" required help="5-char NATO Commercial & Government">
            <input className="lb-input lb-mono" value={c.cage} onChange={(e) => u("cage", e.target.value)} />
          </Field>
          <Field label="Website" optional>
            <input className="lb-input" value={c.website} onChange={(e) => u("website", e.target.value)} />
          </Field>
        </div>
        <Spacer h={14} />
        <Field label="NAICS codes" required help="Up to 5 codes covering primary lines of work">
          <TagInput
            value={c.naics}
            onChange={(v) => u("naics", v)}
            placeholder="332710"
            suggestions={["332710", "336413", "332119", "332999", "336411"]}
          />
        </Field>
      </LbCard>

      <Spacer />

      <LbCard title="Headquarters address" eyebrow="A.3">
        <div className="lb-grid-2">
          <Field label="Street" required span={2}>
            <input className="lb-input" value={c.hq_address} onChange={(e) => u("hq_address", e.target.value)} />
          </Field>
        </div>
        <Spacer h={14} />
        <div className="lb-grid-4">
          <Field label="City" required>
            <input className="lb-input" value={c.hq_city} onChange={(e) => u("hq_city", e.target.value)} />
          </Field>
          <Field label="State" required>
            <input className="lb-input" value={c.hq_state} onChange={(e) => u("hq_state", e.target.value)} />
          </Field>
          <Field label="ZIP" required>
            <input className="lb-input lb-mono" value={c.hq_zip} onChange={(e) => u("hq_zip", e.target.value)} />
          </Field>
          <Field label="Country" required>
            <select className="lb-select" value={c.hq_country} onChange={(e) => u("hq_country", e.target.value)}>
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="UK">United Kingdom</option>
              <option value="AU">Australia</option>
            </select>
          </Field>
        </div>
      </LbCard>

      <Spacer />

      <LbCard
        title="Ownership & socioeconomic"
        eyebrow="A.4"
        action={<span className="lb-help" style={{ margin: 0 }}>Self-attested. SBA verification required for set-aside work.</span>}
      >
        <div className="lb-grid-3">
          <Field label="Ownership" required>
            <select className="lb-select" value={c.ownership_type} onChange={(e) => u("ownership_type", e.target.value)}>
              <option value="private">Privately held</option>
              <option value="public">Publicly traded</option>
              <option value="pe_backed">Private-equity backed</option>
              <option value="esop">ESOP / employee-owned</option>
              <option value="subsidiary">Subsidiary</option>
            </select>
          </Field>
          <Field label="US ownership" required help="% owned by US persons">
            <input className="lb-input lb-mono" defaultValue="100" placeholder="0–100" />
          </Field>
          <Field label="Foreign Ownership Control or Influence (FOCI)" required>
            <select className="lb-select" defaultValue="none">
              <option value="none">None</option>
              <option value="mitigated">Mitigated (SCA / SSA)</option>
              <option value="under_review">Under review</option>
            </select>
          </Field>
        </div>
        <Spacer h={14} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {(
            [
              ["small_business", "SBA Small Business"],
              ["veteran_owned", "Veteran-Owned (VOSB)"],
              ["woman_owned", "Woman-Owned (WOSB)"],
              ["hubzone", "HUBZone certified"],
            ] as const
          ).map(([k, label]) => (
            <Checkbox key={k} label={label} checked={c[k]} onChange={(v) => u(k, v)} />
          ))}
        </div>
      </LbCard>

      <Spacer />

      <LbCard title="Primary commercial contact" eyebrow="A.5">
        <div className="lb-grid-2">
          <Field label="Full name" required>
            <input className="lb-input" value={c.contact_name} onChange={(e) => u("contact_name", e.target.value)} />
          </Field>
          <Field label="Title" required>
            <input className="lb-input" value={c.contact_title} onChange={(e) => u("contact_title", e.target.value)} />
          </Field>
          <Field label="Email" required>
            <input className="lb-input lb-mono" value={c.contact_email} onChange={(e) => u("contact_email", e.target.value)} />
          </Field>
          <Field label="Phone" required>
            <input className="lb-input lb-mono" value={c.contact_phone} onChange={(e) => u("contact_phone", e.target.value)} />
          </Field>
        </div>
      </LbCard>
    </div>
  );
}

// ───────── 02 Facility ─────────
export function StepFacility({ data, set }: StepProps) {
  const f = data.facility;
  const u = <K extends keyof ApplicationData["facility"]>(
    k: K,
    v: ApplicationData["facility"][K],
  ) => set({ facility: { ...f, [k]: v } });
  return (
    <div className="lb-fade-in">
      <StepHeader
        num="02"
        title="Facility Profile"
        desc="Physical infrastructure, security posture, and environmental controls. Required to confirm capability for ITAR/CUI work and to evaluate single-point-of-failure risk."
      />

      <LbCard
        title="Manufacturing facilities"
        eyebrow="B.1"
        action={
          <Button variant="secondary" size="sm" icon={<Ic.plus />}>
            Add facility
          </Button>
        }
        padded={false}
      >
        <table className="lb-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Address</th>
              <th style={{ textAlign: "right" }}>Sqft</th>
              <th>Owned</th>
              <th>Secure</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {f.facilities.map((fac) => (
              <tr key={fac.id}>
                <td style={{ fontWeight: 500 }}>{fac.name}</td>
                <td>
                  <Badge tone="neutral">{fac.type}</Badge>
                </td>
                <td className="lb-mono" style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                  {fac.address}
                </td>
                <td className="lb-mono lb-tnum" style={{ textAlign: "right" }}>
                  {fac.sqft.toLocaleString()}
                </td>
                <td>{fac.owned ? <Badge tone="success">Owned</Badge> : <Badge tone="neutral">Leased</Badge>}</td>
                <td>{fac.secure ? <Badge tone="accent">ITAR Cage</Badge> : <Badge tone="neutral">—</Badge>}</td>
                <td style={{ width: 60 }}>
                  <button className="lb-btn lb-btn-ghost lb-btn-sm" type="button" aria-label="Edit">
                    <Ic.edit />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </LbCard>

      <Spacer />

      <LbCard title="Security posture" eyebrow="B.2">
        <div className="lb-grid-2">
          <Field label="Cybersecurity baseline" required>
            <select
              className="lb-select"
              value={f.cybersecurity_posture}
              onChange={(e) => u("cybersecurity_posture", e.target.value)}
            >
              <option value="none">None / commercial</option>
              <option value="nist_800_171">NIST SP 800-171 (CUI)</option>
              <option value="cmmc_l2">CMMC Level 2</option>
              <option value="cmmc_l3">CMMC Level 3</option>
            </select>
          </Field>
          <Field label="Foreign visitor policy" required>
            <select
              className="lb-select"
              value={f.foreign_visitors}
              onChange={(e) => u("foreign_visitors", e.target.value)}
            >
              <option value="prohibited">Prohibited</option>
              <option value="documented">Documented & escorted</option>
              <option value="open">Open access</option>
            </select>
          </Field>
        </div>
        <Spacer h={14} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {(
            [
              ["controlled_access", "Badge / controlled access"],
              ["itar_segregated", "ITAR-segregated work area"],
              ["climate_controlled", "Climate-controlled inspection"],
            ] as const
          ).map(([k, label]) => (
            <Checkbox key={k} label={label} checked={f[k]} onChange={(v) => u(k, v)} />
          ))}
        </div>
      </LbCard>

      <Spacer />

      <LbCard title="Operational envelope" eyebrow="B.3">
        <div className="lb-grid-3">
          <Field label="Power redundancy" required>
            <select
              className="lb-select"
              value={f.power_redundancy}
              onChange={(e) => u("power_redundancy", e.target.value)}
            >
              <option value="grid_only">Grid only</option>
              <option value="ups_only">UPS only</option>
              <option value="ups_generator">UPS + generator</option>
              <option value="redundant_feeds">Redundant utility feeds + gen</option>
            </select>
          </Field>
          <Field label="Crane capacity (lbs)" optional>
            <input className="lb-input lb-mono" value={f.crane_capacity_lbs} onChange={(e) => u("crane_capacity_lbs", e.target.value)} />
          </Field>
          <Field label="Max part envelope" required help="L × W × H, longest single piece">
            <input className="lb-input lb-mono" value={f.max_part_envelope} onChange={(e) => u("max_part_envelope", e.target.value)} />
          </Field>
        </div>
        <Spacer h={14} />
        <Callout tone="accent">
          <strong>Map preview.</strong> Geocoded facilities feed routing distance calculations and customer proximity scoring during RFQ dispatch.
        </Callout>
        <div
          style={{
            marginTop: 14,
            height: 200,
            borderRadius: 6,
            background:
              "radial-gradient(circle at 30% 60%, rgba(34,211,238,0.12), transparent 50%), radial-gradient(circle at 65% 50%, rgba(34,211,238,0.18), transparent 45%), #050a14",
            border: "1px solid var(--surface-3)",
            backgroundImage:
              "linear-gradient(rgba(34,211,238,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.06) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>
            <circle cx="32%" cy="62%" r="8" fill="rgba(34,211,238,0.4)" filter="url(#glow)" />
            <circle cx="32%" cy="62%" r="4" fill="#22d3ee" />
            <circle cx="38%" cy="55%" r="5" fill="rgba(34,211,238,0.35)" filter="url(#glow)" />
            <circle cx="38%" cy="55%" r="3" fill="#22d3ee" />
            <line x1="32%" y1="62%" x2="38%" y2="55%" stroke="#22d3ee" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          </svg>
          <div
            style={{
              position: "absolute",
              left: 14,
              bottom: 14,
              fontFamily: "var(--font-geist-mono), var(--mono-stack)",
              fontSize: 11,
              color: "var(--text-muted)",
            }}
          >
            2 facilities · 60,500 sqft total · CONUS
          </div>
        </div>
      </LbCard>
    </div>
  );
}

// ───────── 03 Compliance ─────────
export function StepCompliance({ data, set }: StepProps) {
  const c = data.compliance;
  const u = <K extends keyof ApplicationData["compliance"]>(
    k: K,
    v: ApplicationData["compliance"][K],
  ) => set({ compliance: { ...c, [k]: v } });
  return (
    <div className="lb-fade-in">
      <StepHeader
        num="03"
        title="Certifications & Compliance"
        desc="Quality, regulatory, and export-control certifications. Documentation here gates eligibility for specific RFQs — work flagged ITAR or CMMC L2 will not route to suppliers without the matching credential on file."
      />

      <LbCard title="Quality system certifications" eyebrow="C.1">
        <div style={{ display: "grid", gap: 10 }}>
          {(
            [
              { k: "as9100d", label: "AS9100D — Aerospace QMS", required: true },
              { k: "iso9001", label: "ISO 9001:2015 — General QMS", required: false },
              { k: "faa_pma", label: "FAA PMA approved", required: false },
              { k: "far_part_145", label: "FAR Part 145 Repair Station", required: false },
            ] as const
          ).map((row) => (
            <div
              key={row.k}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 10,
                alignItems: "center",
                padding: "10px 12px",
                background: "var(--surface-2)",
                border: "1px solid var(--surface-3)",
                borderRadius: 6,
              }}
            >
              <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  className="lb-checkbox"
                  checked={c[row.k]}
                  onChange={(e) => u(row.k, e.target.checked)}
                />
                <span style={{ fontSize: 13 }}>{row.label}</span>
                {row.required && c[row.k] && <Badge tone="success">On file</Badge>}
              </label>
              {c[row.k] && (
                <span className="lb-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  Certificate required ↓
                </span>
              )}
            </div>
          ))}
        </div>
      </LbCard>

      <Spacer />

      <LbCard title="Export control & cybersecurity" eyebrow="C.2">
        <div className="lb-grid-2">
          <Field label="ITAR registration (DDTC)" required>
            <div className="lb-seg">
              <button type="button" onClick={() => u("itar_registered", true)} className={c.itar_registered ? "on" : ""}>
                Registered
              </button>
              <button type="button" onClick={() => u("itar_registered", false)} className={!c.itar_registered ? "on" : ""}>
                Not registered
              </button>
            </div>
          </Field>
          <Field label="EAR-classified items" required>
            <div className="lb-seg">
              <button type="button" onClick={() => u("ear_classified", true)} className={c.ear_classified ? "on" : ""}>
                Yes
              </button>
              <button type="button" onClick={() => u("ear_classified", false)} className={!c.ear_classified ? "on" : ""}>
                No
              </button>
            </div>
          </Field>
          <Field label="CMMC status" required>
            <select className="lb-select" value={c.cmmc_status} onChange={(e) => u("cmmc_status", e.target.value)}>
              <option value="none">Not certified</option>
              <option value="self_assessed">Self-assessed L1</option>
              <option value="level_1">Level 1 — Foundational</option>
              <option value="level_2">Level 2 — Advanced</option>
              <option value="level_3">Level 3 — Expert</option>
            </select>
          </Field>
          <Field label="NIST 800-171 SPRS score" required help="Self-assessment posted to SPRS">
            <input
              className="lb-input lb-mono"
              value={c.nist_800_171_score}
              onChange={(e) => u("nist_800_171_score", e.target.value)}
              placeholder="−203 to 110"
            />
          </Field>
        </div>
        <Spacer h={14} />
        <Callout tone="warn">
          <strong>SPRS verification.</strong> Score is verified against the DoD Supplier Performance Risk System on submission. A score below 88 will route to enhanced cyber review before approval.
        </Callout>
      </LbCard>

      <Spacer />

      <LbCard title="NADCAP & special process accreditations" eyebrow="C.3">
        <Field label="Accredited special processes" optional help="Performer Registry of Independent (PRI) processes performed in-house">
          <TagInput
            value={c.nadcap_processes}
            onChange={(v) => u("nadcap_processes", v)}
            suggestions={[
              "Heat Treating",
              "Chemical Processing",
              "Non-Destructive Testing",
              "Welding",
              "Coatings",
              "Composites",
              "Surface Enhancement",
              "Materials Testing",
            ]}
          />
        </Field>
      </LbCard>

      <Spacer />

      <LbCard title="Counterfeit & FOD programs" eyebrow="C.4">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {(
            [
              ["counterfeit_program", "SAE AS5553 / AS6174 counterfeit parts program"],
              ["foreign_object_program", "NAS 412 Foreign Object Damage (FOD) program"],
              ["conflict_minerals", "Conflict minerals (Dodd-Frank §1502) compliant"],
            ] as const
          ).map(([k, label]) => (
            <Checkbox key={k} label={label} checked={c[k]} onChange={(v) => u(k, v)} />
          ))}
        </div>
      </LbCard>

      <Spacer />

      <LbCard
        title="Certificate documents"
        eyebrow="C.5"
        action={
          <Button variant="primary" size="sm" icon={<Ic.upload />}>
            Upload certificate
          </Button>
        }
      >
        <div>
          {c.certs.map((cert) => {
            const sixMonthsFromRefDate = new Date("2026-10-26");
            const expiringSoon = new Date(cert.expires) < sixMonthsFromRefDate;
            return (
              <div key={cert.id} className="lb-file">
                <div className="lb-file-ic">PDF</div>
                <div>
                  <div className="lb-file-name">{cert.name}</div>
                  <div className="lb-file-meta">
                    {cert.issuer} · {cert.number} · expires {cert.expires}
                  </div>
                </div>
                <Badge tone={expiringSoon ? "warn" : "success"}>{expiringSoon ? "Expires <6mo" : "Active"}</Badge>
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="lb-btn lb-btn-ghost lb-btn-sm" type="button" aria-label="Download">
                    <Ic.download />
                  </button>
                  <button className="lb-btn lb-btn-ghost lb-btn-sm" type="button" aria-label="Delete">
                    <Ic.trash />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </LbCard>
    </div>
  );
}

// ───────── 04 Capabilities ─────────
export function StepCapabilities({ data, set }: StepProps) {
  const c = data.capabilities;
  const u = <K extends keyof ApplicationData["capabilities"]>(
    k: K,
    v: ApplicationData["capabilities"][K],
  ) => set({ capabilities: { ...c, [k]: v } });
  return (
    <div className="lb-fade-in">
      <StepHeader
        num="04"
        title="Capabilities"
        desc="Manufacturing processes, part envelope, tolerance ceiling, and CAD/CAM environment. This profile is the matchmaking key for RFQ routing — every field becomes a filter on inbound part queries."
      />

      <LbCard title="Primary processes" eyebrow="D.1">
        <Field label="Process tags" required help="Select all processes performed in-house. Outsourced processes belong in Special Processes (D.4).">
          <TagInput
            value={c.processes}
            onChange={(v) => u("processes", v)}
            suggestions={[
              "3-Axis CNC Milling",
              "4-Axis CNC Milling",
              "5-Axis CNC Milling",
              "CNC Turning",
              "Mill-Turn",
              "Swiss Turning",
              "Wire EDM",
              "Sinker EDM",
              "Surface Grinding",
              "ID/OD Grinding",
              "Honing",
              "Lapping",
              "Sheet Metal",
              "Waterjet",
              "Laser Cutting",
            ]}
          />
        </Field>
      </LbCard>

      <Spacer />

      <LbCard title="Part envelope & precision" eyebrow="D.2">
        <div className="lb-grid-3">
          <Field label="Max X (in)" required>
            <input className="lb-input lb-mono" value={c.part_envelope_x} onChange={(e) => u("part_envelope_x", e.target.value)} />
          </Field>
          <Field label="Max Y (in)" required>
            <input className="lb-input lb-mono" value={c.part_envelope_y} onChange={(e) => u("part_envelope_y", e.target.value)} />
          </Field>
          <Field label="Max Z (in)" required>
            <input className="lb-input lb-mono" value={c.part_envelope_z} onChange={(e) => u("part_envelope_z", e.target.value)} />
          </Field>
        </div>
        <Spacer h={14} />
        <div className="lb-grid-2">
          <Field label="Tightest achievable tolerance (in)" required help="True positional, repeatable across a lot of 100">
            <input className="lb-input lb-mono" value={c.tightest_tolerance} onChange={(e) => u("tightest_tolerance", e.target.value)} />
          </Field>
          <Field label="Best surface finish (Ra, µin)" required>
            <input className="lb-input lb-mono" value={c.surface_finish_ra} onChange={(e) => u("surface_finish_ra", e.target.value)} />
          </Field>
        </div>
      </LbCard>

      <Spacer />

      <LbCard title="Engineering environment" eyebrow="D.3">
        <div className="lb-grid-2">
          <Field label="CAD systems" required>
            <TagInput
              value={c.cad_systems}
              onChange={(v) => u("cad_systems", v)}
              suggestions={["SolidWorks", "CATIA V5", "CATIA V6", "NX", "Creo", "Inventor", "Fusion 360"]}
            />
          </Field>
          <Field label="Accepted file formats" required>
            <TagInput
              value={c.file_formats}
              onChange={(v) => u("file_formats", v)}
              suggestions={["STEP", "IGES", "Parasolid", "DWG", "DXF", "3D PDF", "JT", "X_T"]}
            />
          </Field>
          <Field label="Drawing standards" required span={2}>
            <TagInput
              value={c.drawing_standards}
              onChange={(v) => u("drawing_standards", v)}
              suggestions={["ASME Y14.5-2018", "ASME Y14.5-2009", "MIL-STD-100", "ISO 1101", "ISO 8015"]}
            />
          </Field>
        </div>
      </LbCard>

      <Spacer />

      <LbCard title="Secondary capabilities" eyebrow="D.4">
        <Field label="Secondary processes (in-house or close-tier partner)" optional>
          <TagInput value={c.secondary} onChange={(v) => u("secondary", v)} />
        </Field>
        <Spacer h={14} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {(
            [
              ["assembly", "Assembly & integration"],
              ["kitting", "Kitting & packaging"],
              ["first_article", "First-article inspection (AS9102)"],
            ] as const
          ).map(([k, label]) => (
            <Checkbox key={k} label={label} checked={c[k]} onChange={(v) => u(k, v)} />
          ))}
        </div>
        <Spacer h={14} />
        <div className="lb-grid-2">
          <Field label="Typical lot size — minimum" required>
            <input className="lb-input lb-mono" value={c.typical_lot_min} onChange={(e) => u("typical_lot_min", e.target.value)} />
          </Field>
          <Field label="Typical lot size — maximum" required>
            <input className="lb-input lb-mono" value={c.typical_lot_max} onChange={(e) => u("typical_lot_max", e.target.value)} />
          </Field>
        </div>
      </LbCard>
    </div>
  );
}

// ───────── 05 Machines ─────────
export function StepMachines({ data }: StepProps) {
  const m = data.machines;
  const totalCount = m.list.reduce((a, b) => a + b.count, 0);
  const fiveAxisCount = m.list.filter((x) => x.type.includes("5-Axis")).reduce((a, b) => a + b.count, 0);
  const cmmCount = m.list.filter((x) => x.type === "CMM").reduce((a, b) => a + b.count, 0);
  const avgAge = (
    2026 -
    m.list.reduce((a, b) => a + b.year * b.count, 0) / totalCount
  ).toFixed(1);
  return (
    <div className="lb-fade-in">
      <StepHeader
        num="05"
        title="Machine Inventory"
        desc="Detailed inventory of every CNC machine, EDM, grinder, and inspection asset. This drives capacity calculations and is the primary signal for whether a part fits your shop."
        action={
          <Button variant="primary" size="sm" icon={<Ic.plus />}>
            Add machine
          </Button>
        }
      />
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        {[
          ["Total machines", String(totalCount)],
          ["5-axis stations", String(fiveAxisCount)],
          ["Avg machine age", `${avgAge} yr`],
          ["Inspection assets", `${cmmCount} CMM`],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              flex: 1,
              padding: "10px 14px",
              background: "var(--surface-1)",
              border: "1px solid var(--surface-3)",
              borderRadius: 6,
            }}
          >
            <div className="lb-kv-label">{label}</div>
            <div className="lb-kv-value">{value}</div>
          </div>
        ))}
      </div>
      <LbCard padded={false}>
        <table className="lb-table">
          <thead>
            <tr>
              <th style={{ width: 48 }}>#</th>
              <th>Type</th>
              <th>Make / model</th>
              <th>Envelope (X×Y×Z)</th>
              <th style={{ textAlign: "right" }}>Spindle RPM</th>
              <th>Controller</th>
              <th style={{ textAlign: "right" }}>Qty</th>
              <th>Year</th>
              <th>Condition</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {m.list.map((row, i) => (
              <tr key={row.id}>
                <td className="lb-mono" style={{ color: "var(--text-muted)" }}>
                  {String(i + 1).padStart(2, "0")}
                </td>
                <td>
                  <Badge tone={row.type.includes("5-Axis") ? "accent" : row.type === "CMM" ? "info" : "neutral"}>
                    {row.type}
                  </Badge>
                </td>
                <td>
                  <div style={{ fontWeight: 500 }}>{row.make}</div>
                  <div className="lb-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {row.model}
                  </div>
                </td>
                <td className="lb-mono" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {row.envelope}
                </td>
                <td className="lb-mono lb-tnum" style={{ textAlign: "right" }}>
                  {row.spindle_rpm ? row.spindle_rpm.toLocaleString() : "—"}
                </td>
                <td className="lb-mono" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {row.controller}
                </td>
                <td className="lb-mono lb-tnum" style={{ textAlign: "right", fontWeight: 600 }}>
                  {row.count}
                </td>
                <td className="lb-mono">{row.year}</td>
                <td>
                  <Badge tone={row.condition === "excellent" ? "success" : "info"}>{row.condition}</Badge>
                </td>
                <td>
                  <button className="lb-btn lb-btn-ghost lb-btn-sm" type="button" aria-label="Edit">
                    <Ic.edit />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </LbCard>
      <Spacer />
      <Callout tone="info">
        <strong>Bulk import.</strong> Have your inventory in a spreadsheet?{" "}
        <a style={{ color: "var(--accent)" }}>Download CSV template</a> — columns: type, make, model, envelope_x_in, envelope_y_in, envelope_z_in, spindle_rpm, controller, qty, year, condition.
      </Callout>
    </div>
  );
}

// ───────── 06 Workforce ─────────
export function StepWorkforce({ data, set }: StepProps) {
  const w = data.workforce;
  const u = <K extends keyof ApplicationData["workforce"]>(
    k: K,
    v: ApplicationData["workforce"][K],
  ) => set({ workforce: { ...w, [k]: v } });
  const headcountKeys = ["machinists", "programmers", "qa_inspectors", "engineers", "management", "admin"] as const;
  return (
    <div className="lb-fade-in">
      <StepHeader
        num="06"
        title="Workforce & Labor Capacity"
        desc="Headcount by function, shift structure, and personnel security. Used to compute realistic throughput and to validate that the shop can staff cleared work."
      />

      <LbCard title="Headcount by function" eyebrow="F.1">
        <div className="lb-grid-3">
          <Field label="Total employees" required>
            <input className="lb-input lb-mono" value={w.total_employees} onChange={(e) => u("total_employees", e.target.value)} />
          </Field>
          <Field label="Average tenure (years)" optional>
            <input className="lb-input lb-mono" value={w.avg_tenure_years} onChange={(e) => u("avg_tenure_years", e.target.value)} />
          </Field>
          <Field label="US persons (%)" required help="22 CFR §120.62">
            <input
              className="lb-input lb-mono"
              value={w.us_persons_pct}
              onChange={(e) => u("us_persons_pct", Number(e.target.value))}
            />
          </Field>
        </div>
        <Spacer />
        <div className="lb-grid-3">
          {headcountKeys.map((k) => (
            <Field key={k} label={k.replace(/_/g, " ")} required>
              <input className="lb-input lb-mono" value={w[k]} onChange={(e) => u(k, e.target.value)} />
            </Field>
          ))}
        </div>
      </LbCard>

      <Spacer />

      <LbCard title="Shift structure" eyebrow="F.2">
        <div className="lb-grid-3">
          <Field label="Shifts per day" required>
            <div className="lb-seg">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => u("shifts_per_day", n)}
                  className={w.shifts_per_day === n ? "on" : ""}
                >
                  {n} shift{n > 1 ? "s" : ""}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Hours per shift" required>
            <input
              className="lb-input lb-mono"
              value={w.hours_per_shift}
              onChange={(e) => u("hours_per_shift", Number(e.target.value))}
            />
          </Field>
          <Field label="Days per week" required>
            <input
              className="lb-input lb-mono"
              value={w.days_per_week}
              onChange={(e) => u("days_per_week", Number(e.target.value))}
            />
          </Field>
        </div>
        <Spacer h={14} />
        <div
          style={{
            padding: "12px 14px",
            background: "var(--surface-2)",
            border: "1px solid var(--surface-3)",
            borderRadius: 6,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div className="lb-kv-label">Computed weekly labor capacity</div>
            <div className="lb-kv-value" style={{ color: "var(--accent)", fontSize: 18 }}>
              {(Number(w.machinists) * w.shifts_per_day * w.hours_per_shift * w.days_per_week).toLocaleString()}{" "}
              machinist-hours / week
            </div>
          </div>
          <Badge tone="accent">Auto-calculated</Badge>
        </div>
      </LbCard>

      <Spacer />

      <LbCard title="Personnel security & development" eyebrow="F.3">
        <div className="lb-grid-2">
          <Field label="Cleared personnel (count)" optional help="Active DoD security clearances">
            <input className="lb-input lb-mono" value={w.cleared_personnel} onChange={(e) => u("cleared_personnel", e.target.value)} />
          </Field>
          <Field label="Clearance levels held" optional>
            <TagInput
              value={w.clearance_levels}
              onChange={(v) => u("clearance_levels", v)}
              suggestions={["Confidential", "Secret", "Top Secret", "TS/SCI"]}
            />
          </Field>
        </div>
        <Spacer h={14} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Checkbox label="Union represented workforce" checked={w.union} onChange={(v) => u("union", v)} />
          <Checkbox
            label="Registered apprenticeship / training program"
            checked={w.apprentice_program}
            onChange={(v) => u("apprentice_program", v)}
          />
        </div>
      </LbCard>
    </div>
  );
}

// ───────── 07 Rates ─────────
export function StepRates({ data, set }: StepProps) {
  const r = data.rates;
  const u = <K extends keyof ApplicationData["rates"]>(k: K, v: ApplicationData["rates"][K]) =>
    set({ rates: { ...r, [k]: v } });
  return (
    <div className="lb-fade-in">
      <StepHeader
        num="07"
        title="Rates & Commercial Model"
        desc="Hourly rates, NRE thresholds, markups, and payment terms. These values are used as a private benchmark in pricing intelligence — not shared with buyers — and to flag outlier quotes during routing."
        action={<Badge tone="accent">Private to Asgard</Badge>}
      />
      <Callout tone="info">
        <strong>How rates are used.</strong> Hourly rates and markups are never exposed to buyers and never appear on RFQ packets. They are used internally to (1) compute target pricing for pricing intelligence, (2) flag quotes &gt; 2σ from your stated rate as anomalous, and (3) enable cost-plus contract structures.
      </Callout>
      <Spacer />
      <LbCard title="Shop rates ($/hr)" eyebrow="G.1">
        <div className="lb-grid-3">
          {(
            [
              ["shop_rate_3axis", "3-axis milling"],
              ["shop_rate_5axis", "5-axis milling"],
              ["shop_rate_turn", "Turning / mill-turn"],
              ["shop_rate_edm", "EDM (wire & sinker)"],
              ["programming_rate", "CAM programming"],
              ["inspection_rate", "CMM / inspection"],
              ["assembly_rate", "Assembly / kitting"],
            ] as const
          ).map(([k, label]) => (
            <Field key={k} label={label} required>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-geist-mono), var(--mono-stack)",
                    fontSize: 12,
                  }}
                >
                  $
                </span>
                <input
                  className="lb-input lb-mono"
                  style={{ paddingLeft: 24 }}
                  value={r[k]}
                  onChange={(e) => u(k, e.target.value)}
                />
                <span
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-geist-mono), var(--mono-stack)",
                    fontSize: 11,
                  }}
                >
                  /hr
                </span>
              </div>
            </Field>
          ))}
        </div>
      </LbCard>

      <Spacer />

      <LbCard title="NRE & markups" eyebrow="G.2">
        <div className="lb-grid-3">
          <Field label="Minimum NRE charge ($)" required help="Setup / programming floor">
            <input className="lb-input lb-mono" value={r.nre_min} onChange={(e) => u("nre_min", e.target.value)} />
          </Field>
          <Field label="Tooling markup (%)" required>
            <input className="lb-input lb-mono" value={r.tooling_markup_pct} onChange={(e) => u("tooling_markup_pct", e.target.value)} />
          </Field>
          <Field label="Material markup (%)" required>
            <input className="lb-input lb-mono" value={r.material_markup_pct} onChange={(e) => u("material_markup_pct", e.target.value)} />
          </Field>
        </div>
      </LbCard>

      <Spacer />

      <LbCard title="Commercial terms" eyebrow="G.3">
        <div className="lb-grid-3">
          <Field label="Pricing model" required>
            <select className="lb-select" value={r.pricing_model} onChange={(e) => u("pricing_model", e.target.value)}>
              <option value="fixed_quote">Firm fixed quote per part</option>
              <option value="time_materials">Time & materials</option>
              <option value="cost_plus">Cost plus</option>
              <option value="blanket_po">Blanket PO / drawdown</option>
            </select>
          </Field>
          <Field label="Payment terms" required>
            <select className="lb-select" value={r.payment_terms} onChange={(e) => u("payment_terms", e.target.value)}>
              <option value="net_15">Net 15</option>
              <option value="net_30">Net 30</option>
              <option value="net_45">Net 45</option>
              <option value="net_60">Net 60</option>
              <option value="2_10_net_30">2/10 Net 30</option>
              <option value="cod">COD / prepay</option>
            </select>
          </Field>
          <Field label="Currency" required>
            <select className="lb-select" value={r.currency} onChange={(e) => u("currency", e.target.value)}>
              <option value="USD">USD</option>
              <option value="CAD">CAD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </Field>
        </div>
        <Spacer h={14} />
        <div className="lb-grid-3">
          <Field label="Volume break threshold (units)" optional>
            <input className="lb-input lb-mono" value={r.volume_discount_threshold} onChange={(e) => u("volume_discount_threshold", e.target.value)} />
          </Field>
          <Field label="Volume discount (%)" optional>
            <input className="lb-input lb-mono" value={r.volume_discount_pct} onChange={(e) => u("volume_discount_pct", e.target.value)} />
          </Field>
          <Field label="Expedite premium (%)" required>
            <input className="lb-input lb-mono" value={r.expedite_premium_pct} onChange={(e) => u("expedite_premium_pct", e.target.value)} />
          </Field>
        </div>
      </LbCard>
    </div>
  );
}

// ───────── 08 Materials ─────────
export function StepMaterials({ data, set }: StepProps) {
  const m = data.materials;
  const u = <K extends keyof ApplicationData["materials"]>(
    k: K,
    v: ApplicationData["materials"][K],
  ) => set({ materials: { ...m, [k]: v } });
  return (
    <div className="lb-fade-in">
      <StepHeader
        num="08"
        title="Materials & Specialties"
        desc="Approved alloys, plastics, and surface treatments your facility regularly machines or qualifies. Material proficiency is a hard filter during RFQ routing — parts will not route to suppliers without a match."
      />
      <LbCard title="Metals & alloys" eyebrow="H.1">
        <Field label="Routinely machined alloys" required help="Include only alloys you have inventory, fixturing, and machining knowledge for.">
          <TagInput
            value={m.alloys}
            onChange={(v) => u("alloys", v)}
            suggestions={[
              "Aluminum 5052",
              "Aluminum 6061-T6",
              "Aluminum 7075-T651",
              "Stainless 304",
              "Stainless 316L",
              "Stainless 17-4 PH",
              "Titanium 6Al-4V",
              "Inconel 625",
              "Inconel 718",
              "Hastelloy X",
              "Monel 400",
              "Beryllium Copper",
              "Tungsten Carbide",
            ]}
          />
        </Field>
      </LbCard>

      <Spacer />

      <LbCard title="Plastics & composites" eyebrow="H.2">
        <Field label="Engineering plastics" optional>
          <TagInput
            value={m.plastics}
            onChange={(v) => u("plastics", v)}
            suggestions={[
              "PEEK",
              "PEI/Ultem",
              "Acetal",
              "Torlon",
              "G-10/FR4",
              "Polycarbonate",
              "Nylon 6/6",
              "UHMW",
              "PTFE",
            ]}
          />
        </Field>
        <Spacer h={14} />
        <Checkbox
          label="Composite layup / machining (CFRP, GFRP)"
          checked={m.composites}
          onChange={(v) => u("composites", v)}
        />
      </LbCard>

      <Spacer />

      <LbCard title="Surface treatments & finishing" eyebrow="H.3">
        <Field label="Approved finishes" required help="In-house or pre-qualified plating/coating partner. Include AMS/MIL spec when applicable.">
          <TagInput value={m.treatments} onChange={(v) => u("treatments", v)} />
        </Field>
      </LbCard>

      <Spacer />

      <LbCard title="Welding & joining" eyebrow="H.4">
        <Field label="Welding processes" optional>
          <TagInput
            value={m.welding}
            onChange={(v) => u("welding", v)}
            suggestions={["TIG", "MIG", "Spot", "Resistance", "Electron Beam", "Laser", "Friction Stir"]}
          />
        </Field>
        <Spacer h={14} />
        <Checkbox
          label="Brazing (vacuum / torch / induction)"
          checked={m.brazing}
          onChange={(v) => u("brazing", v)}
        />
      </LbCard>

      <Spacer />

      <LbCard title="Material control" eyebrow="H.5">
        <div className="lb-grid-2">
          <Field label="Raw material traceability" required>
            <select
              className="lb-select"
              value={m.raw_material_traceability}
              onChange={(e) => u("raw_material_traceability", e.target.value)}
            >
              <option value="lot_only">Lot/heat # only</option>
              <option value="full_dfars">DFARS 252.225-7008/7009 + full chain of custody</option>
              <option value="domestic_only">Domestic melt + manufacture (Berry / specialty metals)</option>
            </select>
          </Field>
          <Field label="Restricted substances on premises" optional>
            <TagInput value={m.restricted_substances} onChange={(v) => u("restricted_substances", v)} />
          </Field>
        </div>
        <Spacer h={14} />
        <Checkbox
          label="Independent counterfeit material screening (XRF / PMI on all incoming raw stock)"
          checked={m.counterfeit_screening}
          onChange={(v) => u("counterfeit_screening", v)}
        />
      </LbCard>
    </div>
  );
}

// ───────── 09 Quality ─────────
export function StepQuality({ data, set }: StepProps) {
  const q = data.quality;
  const u = <K extends keyof ApplicationData["quality"]>(
    k: K,
    v: ApplicationData["quality"][K],
  ) => set({ quality: { ...q, [k]: v } });
  return (
    <div className="lb-fade-in">
      <StepHeader
        num="09"
        title="Quality System"
        desc="Inspection capability, traceability, and demonstrated yield. These metrics feed the readiness score and gate inclusion in flight-critical work packages."
      />

      <LbCard title="Inspection equipment" eyebrow="I.1">
        <Field label="Inspection methods" required>
          <TagInput
            value={q.inspection_method}
            onChange={(v) => u("inspection_method", v)}
            suggestions={[
              "CMM",
              "Faro Arm",
              "Vision System",
              "Surface Profilometer",
              "Optical Comparator",
              "Laser Tracker",
              "White Light Scanner",
              "Ultrasonic",
              "X-Ray / CT",
              "Hardness Tester",
            ]}
          />
        </Field>
      </LbCard>

      <Spacer />

      <LbCard title="Quality processes" eyebrow="I.2">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {(
            [
              ["ppap_capable", "PPAP submission capable"],
              ["first_article_aS9102", "AS9102 First Article Inspection"],
              ["gauge_rr_program", "Gauge R&R / MSA program"],
              ["calibration_iso17025", "ISO/IEC 17025 calibration lab"],
              ["digital_traveler", "Digital traveler / paperless work order"],
            ] as const
          ).map(([k, label]) => (
            <Checkbox key={k} label={label} checked={q[k]} onChange={(v) => u(k, v)} />
          ))}
        </div>
        <Spacer h={14} />
        <Field label="Standard inspection sample plan" required>
          <select
            className="lb-select"
            value={q.sample_inspection}
            onChange={(e) => u("sample_inspection", e.target.value)}
          >
            <option value="100_percent">100% inspection (all features)</option>
            <option value="100_percent_critical">100% critical / sampled non-critical (ANSI Z1.4)</option>
            <option value="aql_125">AQL 1.25 sampling</option>
            <option value="custom">Per customer flowdown</option>
          </select>
        </Field>
      </LbCard>

      <Spacer />

      <LbCard title="Systems of record" eyebrow="I.3">
        <div className="lb-grid-2">
          <Field label="ERP system" required>
            <input
              className="lb-input"
              value={q.erp_system}
              onChange={(e) => u("erp_system", e.target.value)}
              placeholder="Epicor, Plex, JobBOSS²..."
            />
          </Field>
          <Field label="MES system" optional>
            <input className="lb-input" value={q.mes_system} onChange={(e) => u("mes_system", e.target.value)} />
          </Field>
        </div>
      </LbCard>

      <Spacer />

      <LbCard
        title="Demonstrated quality metrics — trailing 12 months"
        eyebrow="I.4"
        action={<Badge tone="warn">Subject to audit</Badge>}
      >
        <div className="lb-grid-4">
          <Field label="Internal rejection rate (PPM)" required>
            <input className="lb-input lb-mono" value={q.rejection_rate_ppm} onChange={(e) => u("rejection_rate_ppm", e.target.value)} />
          </Field>
          <Field label="Defects per unit (target)" required>
            <input className="lb-input lb-mono" value={q.dpu_target} onChange={(e) => u("dpu_target", e.target.value)} />
          </Field>
          <Field label="Customer escape rate (%)" required>
            <input className="lb-input lb-mono" value={q.escape_rate_12mo} onChange={(e) => u("escape_rate_12mo", e.target.value)} />
          </Field>
          <Field label="Net inspection capacity (parts/wk)" required>
            <input
              className="lb-input lb-mono"
              value={q.net_inspection_capacity_per_week}
              onChange={(e) => u("net_inspection_capacity_per_week", e.target.value)}
            />
          </Field>
        </div>
      </LbCard>
    </div>
  );
}

// ───────── 10 Capacity ─────────
export function StepCapacity({ data, set }: StepProps) {
  const c = data.capacity;
  const u = <K extends keyof ApplicationData["capacity"]>(
    k: K,
    v: ApplicationData["capacity"][K],
  ) => set({ capacity: { ...c, [k]: v } });
  return (
    <div className="lb-fade-in">
      <StepHeader
        num="10"
        title="Capacity & Availability"
        desc="Current utilization, lead time, and growth headroom. Used during RFQ dispatch to prioritize suppliers with availability and to forecast network capacity."
      />
      <LbCard title="Current utilization" eyebrow="J.1">
        <Field label="Shop utilization (%)" required help="Past 4 weeks across primary work centers">
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <input
              type="range"
              min="0"
              max="100"
              value={c.current_utilization_pct}
              onChange={(e) => u("current_utilization_pct", Number(e.target.value))}
              style={{ flex: 1, accentColor: "var(--accent)" }}
            />
            <div
              className="lb-mono lb-tnum"
              style={{
                fontSize: 18,
                minWidth: 60,
                textAlign: "right",
                color: c.current_utilization_pct > 90 ? "var(--status-warn)" : "var(--accent)",
              }}
            >
              {c.current_utilization_pct}%
            </div>
          </div>
          <div
            style={{
              marginTop: 10,
              height: 8,
              background: "var(--surface-2)",
              border: "1px solid var(--surface-3)",
              borderRadius: 4,
              overflow: "hidden",
              display: "flex",
            }}
          >
            <div
              style={{
                width: `${c.current_utilization_pct}%`,
                background: c.current_utilization_pct > 90 ? "var(--status-warn)" : "var(--accent)",
                transition: "all .2s",
              }}
            />
            <div style={{ flex: 1 }} />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "var(--font-geist-mono), var(--mono-stack)",
              fontSize: 10.5,
              color: "var(--text-muted)",
              marginTop: 6,
            }}
          >
            <span>0% idle</span>
            <span>50%</span>
            <span>80% target</span>
            <span>100% saturated</span>
          </div>
        </Field>
        <Spacer h={14} />
        <div className="lb-grid-3">
          <Field label="Open capacity (hrs/wk)" required>
            <input className="lb-input lb-mono" value={c.open_capacity_hrs_per_week} onChange={(e) => u("open_capacity_hrs_per_week", e.target.value)} />
          </Field>
          <Field label="Backlog ($M)" required>
            <input className="lb-input lb-mono" value={c.backlog_dollars} onChange={(e) => u("backlog_dollars", e.target.value)} />
          </Field>
          <Field label="Backlog (weeks)" required>
            <input className="lb-input lb-mono" value={c.backlog_weeks} onChange={(e) => u("backlog_weeks", e.target.value)} />
          </Field>
        </div>
      </LbCard>

      <Spacer />

      <LbCard title="Lead time" eyebrow="J.2">
        <div className="lb-grid-2">
          <Field label="Typical lead time — simple parts" required help="≤3 axes, standard alloys, ≤25 features">
            <input className="lb-input lb-mono" value={c.typical_lead_time_simple} onChange={(e) => u("typical_lead_time_simple", e.target.value)} />
          </Field>
          <Field label="Typical lead time — complex parts" required help="5-axis, exotic alloys, >50 features">
            <input className="lb-input lb-mono" value={c.typical_lead_time_complex} onChange={(e) => u("typical_lead_time_complex", e.target.value)} />
          </Field>
        </div>
        <Spacer h={14} />
        <div className="lb-grid-2">
          <Field label="Expedite capable" required>
            <div className="lb-seg">
              <button type="button" onClick={() => u("expedite_capable", true)} className={c.expedite_capable ? "on" : ""}>
                Yes
              </button>
              <button type="button" onClick={() => u("expedite_capable", false)} className={!c.expedite_capable ? "on" : ""}>
                No
              </button>
            </div>
          </Field>
          <Field label="Min expedite lead" optional>
            <input className="lb-input lb-mono" value={c.expedite_min_lead} onChange={(e) => u("expedite_min_lead", e.target.value)} />
          </Field>
        </div>
      </LbCard>

      <Spacer />

      <LbCard title="Growth & expansion" eyebrow="J.3">
        <Field label="Growth headroom (%)" required help="Additional volume absorbable in 90 days without capex">
          <input className="lb-input lb-mono" value={c.growth_capacity_pct} onChange={(e) => u("growth_capacity_pct", e.target.value)} />
        </Field>
      </LbCard>
    </div>
  );
}

// ───────── 11 Performance ─────────
export function StepPerformance({ data, set }: StepProps) {
  const p = data.performance;
  const u = <K extends keyof ApplicationData["performance"]>(
    k: K,
    v: ApplicationData["performance"][K],
  ) => set({ performance: { ...p, [k]: v } });
  return (
    <div className="lb-fade-in">
      <StepHeader
        num="11"
        title="Past Performance"
        desc="Verifiable program history, customer references, and dispute record. Programs marked as references will be contacted during qualification."
      />

      <LbCard title="Aggregate performance — trailing 12 months" eyebrow="K.1">
        <div className="lb-grid-3">
          <Field label="On-time delivery (%)" required>
            <input className="lb-input lb-mono" value={p.otd_12mo} onChange={(e) => u("otd_12mo", e.target.value)} />
          </Field>
          <Field label="Quality yield (%)" required>
            <input className="lb-input lb-mono" value={p.quality_yield_12mo} onChange={(e) => u("quality_yield_12mo", e.target.value)} />
          </Field>
          <Field label="Customer escapes (count)" required>
            <input className="lb-input lb-mono" value={p.escapes_12mo} onChange={(e) => u("escapes_12mo", e.target.value)} />
          </Field>
        </div>
      </LbCard>

      <Spacer />

      <LbCard
        title="Programs & customer history"
        eyebrow="K.2"
        action={
          <Button variant="secondary" size="sm" icon={<Ic.plus />}>
            Add program
          </Button>
        }
        padded={false}
      >
        <table className="lb-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Program</th>
              <th>Period</th>
              <th style={{ textAlign: "right" }}>Spend</th>
              <th>Reference</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {p.programs.map((prog) => (
              <tr key={prog.id}>
                <td style={{ fontWeight: 500 }}>{prog.customer}</td>
                <td className="lb-mono" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {prog.program}
                </td>
                <td className="lb-mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {prog.years}
                </td>
                <td className="lb-mono lb-tnum" style={{ textAlign: "right", fontWeight: 600 }}>
                  {prog.spend}
                </td>
                <td>
                  {prog.reference ? (
                    <Badge tone="success">Approved as reference</Badge>
                  ) : (
                    <Badge tone="neutral">Private</Badge>
                  )}
                </td>
                <td>
                  <button className="lb-btn lb-btn-ghost lb-btn-sm" type="button" aria-label="Edit">
                    <Ic.edit />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </LbCard>

      <Spacer />

      <LbCard
        title="Customer references"
        eyebrow="K.3"
        action={
          <Button variant="secondary" size="sm" icon={<Ic.plus />}>
            Add reference
          </Button>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {p.references.map((ref, idx) => (
            <div
              key={`${ref.email}-${idx}`}
              style={{
                padding: "14px 16px",
                background: "var(--surface-2)",
                border: "1px solid var(--surface-3)",
                borderRadius: 6,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{ref.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {ref.title} · {ref.company}
                  </div>
                </div>
                <Badge tone="info">Contact authorized</Badge>
              </div>
              <div className="lb-mono" style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.7 }}>
                {ref.email}
                <br />
                {ref.phone}
              </div>
            </div>
          ))}
        </div>
      </LbCard>

      <Spacer />

      <LbCard title="Dispute & termination history — past 5 years" eyebrow="K.4">
        <div className="lb-grid-2">
          <Field label="Disputes / claims filed against company" required>
            <input className="lb-input lb-mono" value={p.disputes_5yr} onChange={(e) => u("disputes_5yr", e.target.value)} />
          </Field>
          <Field label="Contracts terminated for cause" required>
            <input className="lb-input lb-mono" value={p.terminations_5yr} onChange={(e) => u("terminations_5yr", e.target.value)} />
          </Field>
        </div>
        <Spacer h={14} />
        <Callout tone="warn">
          <strong>Attestation required.</strong> Any disclosed disputes or terminations require a written explanation in Step 12. Failure to disclose is grounds for immediate disqualification.
        </Callout>
      </LbCard>
    </div>
  );
}

// ───────── 12 Review & Submit ─────────
export function StepReview({
  data,
  set,
  computedScore,
  sectionStatus,
}: StepProps & { computedScore: number; sectionStatus: Record<string, { complete: number }> }) {
  const a = data.attest;
  const u = <K extends keyof ApplicationData["attest"]>(
    k: K,
    v: ApplicationData["attest"][K],
  ) => set({ attest: { ...a, [k]: v } });
  const allChecked =
    a.truthful && a.authorized && a.no_debarment && a.cybersecurity && !!a.sig_name && !!a.sig_title;

  return (
    <div className="lb-fade-in">
      <StepHeader
        num="12"
        title="Review & Submit"
        desc="Final review, attestation, and dispatch into Asgard's qualification queue. After submission your application enters review — typical turnaround is 5–10 business days."
      />

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
        <LbCard title="Section completeness" eyebrow="L.1" padded={false}>
          <div>
            {STEPS.slice(0, 11).map((s) => {
              const st = sectionStatus[s.id] ?? { complete: 100 };
              return (
                <div
                  key={s.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "32px 1fr 100px auto",
                    gap: 12,
                    alignItems: "center",
                    padding: "11px 14px",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  <span className="lb-mono" style={{ color: "var(--text-muted)", fontSize: 11 }}>
                    {s.num}
                  </span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{s.title}</div>
                    <div className="lb-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {s.meta}
                    </div>
                  </div>
                  <div className="lb-progress">
                    <span style={{ width: `${st.complete}%` }} />
                  </div>
                  <Badge tone={st.complete === 100 ? "success" : st.complete > 70 ? "warn" : "danger"}>
                    {st.complete === 100 ? "Complete" : `${st.complete}%`}
                  </Badge>
                </div>
              );
            })}
          </div>
        </LbCard>

        <div>
          <LbCard title="Computed readiness" eyebrow="L.2">
            <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
              <ScoreRing value={computedScore} label="Readiness" size={104} />
              <div style={{ flex: 1 }}>
                <div className="lb-mono" style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
                  BREAKDOWN
                </div>
                <div style={{ display: "grid", gap: 5, fontSize: 12 }}>
                  {[
                    ["Compliance", 92],
                    ["Capability fit", 88],
                    ["Capacity", 71],
                    ["Quality", 94],
                    ["Past performance", 85],
                  ].map(([label, val]) => (
                    <div key={label as string} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                      <span className="lb-mono">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </LbCard>
          <Spacer h={14} />
          <LbCard title="Open flags" eyebrow="L.3">
            <div style={{ display: "grid", gap: 8, fontSize: 12.5 }}>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "8px 10px",
                  background: "rgba(251,191,36,0.05)",
                  border: "1px solid rgba(251,191,36,0.2)",
                  borderRadius: 5,
                }}
              >
                <span style={{ color: "var(--status-warn)" }}>
                  <Ic.warn />
                </span>
                <span>NADCAP HT cert expires within 6 months — schedule renewal.</span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "8px 10px",
                  background: "rgba(56,189,248,0.05)",
                  border: "1px solid rgba(56,189,248,0.2)",
                  borderRadius: 5,
                }}
              >
                <span style={{ color: "var(--status-info)" }}>
                  <Ic.info />
                </span>
                <span>Shop utilization at 78% — flag for review if backlog grows.</span>
              </div>
            </div>
          </LbCard>
        </div>
      </div>

      <Spacer />

      <LbCard title="Attestation" eyebrow="L.4">
        <div style={{ display: "grid", gap: 10 }}>
          {(
            [
              ["truthful", "I attest that all information provided is true, accurate, and complete to the best of my knowledge."],
              ["authorized", "I am authorized by the company to submit this application and bind the entity to the representations made herein."],
              ["no_debarment", "The company is not currently debarred, suspended, or proposed for debarment by any U.S. federal agency, and is not on the SAM.gov exclusion list."],
              ["cybersecurity", "I understand that an unsubstantiated NIST 800-171 SPRS score, or undisclosed cybersecurity incidents in the past 24 months, are grounds for disqualification and reporting to DCMA."],
            ] as const
          ).map(([k, label]) => (
            <label
              key={k}
              style={{
                display: "grid",
                gridTemplateColumns: "24px 1fr",
                gap: 10,
                alignItems: "flex-start",
                padding: "12px 14px",
                background: "var(--surface-2)",
                border: "1px solid var(--surface-3)",
                borderRadius: 6,
                fontSize: 13,
                cursor: "pointer",
                lineHeight: 1.5,
              }}
            >
              <input
                type="checkbox"
                className="lb-checkbox"
                checked={a[k]}
                onChange={(e) => u(k, e.target.checked)}
                style={{ marginTop: 1 }}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>

        <Spacer />

        <div className="lb-grid-3">
          <Field label="Signatory name" required>
            <input className="lb-input" value={a.sig_name} onChange={(e) => u("sig_name", e.target.value)} placeholder="Full legal name" />
          </Field>
          <Field label="Title" required>
            <input className="lb-input" value={a.sig_title} onChange={(e) => u("sig_title", e.target.value)} placeholder="Officer / authorized rep" />
          </Field>
          <Field label="Date" required>
            <input
              type="date"
              className="lb-input lb-mono"
              value={a.sig_date || "2026-04-26"}
              onChange={(e) => u("sig_date", e.target.value)}
            />
          </Field>
        </div>

        <div
          style={{
            marginTop: 18,
            padding: "14px 16px",
            border: "1px dashed var(--surface-3)",
            borderRadius: 6,
            background: "rgba(34,211,238,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>Submission package</div>
              <div className="lb-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                12 sections · 4 certificates · 2 references · SHA-256: 7f2a…b918
              </div>
            </div>
            <Button variant="primary" size="lg" disabled={!allChecked} iconRight={<Ic.arrow />}>
              {allChecked ? "Submit application" : "Complete attestation"}
            </Button>
          </div>
        </div>
      </LbCard>
    </div>
  );
}
