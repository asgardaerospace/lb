"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Ic } from "./primitives";
import { initialApp, STEPS, type ApplicationData, type StepId } from "./data";
import {
  StepCompany,
  StepFacility,
  StepCompliance,
  StepCapabilities,
  StepMachines,
  StepWorkforce,
  StepRates,
  StepMaterials,
  StepQuality,
  StepCapacity,
  StepPerformance,
  StepReview,
} from "./steps";

const SECTION_STATUS: Record<StepId, { complete: number }> = {
  company: { complete: 100 },
  facility: { complete: 100 },
  compliance: { complete: 95 },
  capabilities: { complete: 100 },
  machines: { complete: 100 },
  workforce: { complete: 100 },
  rates: { complete: 100 },
  materials: { complete: 100 },
  quality: { complete: 88 },
  capacity: { complete: 100 },
  performance: { complete: 92 },
  review: { complete: 0 },
};

export default function SupplierApplicationWizard() {
  const [data, setData] = useState<ApplicationData>(() => initialApp());
  const [stepIdx, setStepIdx] = useState(0);
  const [savedAt, setSavedAt] = useState(() => new Date());

  const update = (patch: Partial<ApplicationData>) => {
    setData((d) => ({ ...d, ...patch }));
    setSavedAt(new Date());
  };

  const overallPct = useMemo(() => {
    const ids = STEPS.slice(0, 11).map((s) => s.id);
    const total = ids.reduce((acc, id) => acc + SECTION_STATUS[id].complete, 0);
    return Math.round(total / ids.length);
  }, []);

  const computedScore = 84;
  const step = STEPS[stepIdx];

  const renderStep = () => {
    switch (step.id) {
      case "company":
        return <StepCompany data={data} set={update} />;
      case "facility":
        return <StepFacility data={data} set={update} />;
      case "compliance":
        return <StepCompliance data={data} set={update} />;
      case "capabilities":
        return <StepCapabilities data={data} set={update} />;
      case "machines":
        return <StepMachines data={data} set={update} />;
      case "workforce":
        return <StepWorkforce data={data} set={update} />;
      case "rates":
        return <StepRates data={data} set={update} />;
      case "materials":
        return <StepMaterials data={data} set={update} />;
      case "quality":
        return <StepQuality data={data} set={update} />;
      case "capacity":
        return <StepCapacity data={data} set={update} />;
      case "performance":
        return <StepPerformance data={data} set={update} />;
      case "review":
        return (
          <StepReview
            data={data}
            set={update}
            computedScore={computedScore}
            sectionStatus={SECTION_STATUS}
          />
        );
    }
  };

  return (
    <div className="lb-shell">
      <aside className="lb-sidebar scrollbar-thin">
        <div style={{ padding: "4px 8px 14px" }}>
          <div className="lb-logo">
            <span className="lb-logo-mark">L</span>
            <span>LAUNCHBELT</span>
          </div>
          <div
            style={{
              marginTop: 14,
              padding: "10px 12px",
              background: "var(--surface-1)",
              border: "1px solid var(--surface-3)",
              borderRadius: 6,
            }}
          >
            <div
              className="lb-mono"
              style={{
                fontSize: 10.5,
                color: "var(--text-muted)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              SUPPLIER APPLICATION
            </div>
            <div style={{ fontSize: 13, marginTop: 4, fontWeight: 500 }}>{data.company.dba || data.company.legal_name}</div>
            <div className="lb-mono" style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 6 }}>
              APP-{data.company.cage}
            </div>
            <div
              style={{
                height: 4,
                background: "var(--surface-3)",
                borderRadius: 2,
                marginTop: 10,
                overflow: "hidden",
              }}
            >
              <div style={{ height: "100%", width: `${overallPct}%`, background: "var(--accent)", transition: "width .3s" }} />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 6,
                fontFamily: "var(--font-geist-mono), var(--mono-stack)",
                fontSize: 10.5,
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>{overallPct}% complete</span>
              <span style={{ color: "var(--status-success)" }}>● Saved</span>
            </div>
          </div>
        </div>

        <div className="lb-side-section">APPLICATION SECTIONS</div>
        {STEPS.map((s, i) => {
          const st = SECTION_STATUS[s.id];
          const isComplete = st.complete === 100 && i !== stepIdx && s.id !== "review";
          return (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              className={`lb-rail-step ${i === stepIdx ? "active" : ""} ${isComplete ? "complete" : ""}`}
              onClick={() => setStepIdx(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setStepIdx(i);
              }}
            >
              <div className="lb-rail-num">
                {isComplete ? (
                  <span style={{ display: "grid", placeContent: "center" }}>
                    <Ic.check />
                  </span>
                ) : (
                  s.num
                )}
              </div>
              <div>
                <div className="lb-rail-title">{s.title}</div>
                <div className="lb-rail-meta">{s.meta}</div>
              </div>
            </div>
          );
        })}

        <div style={{ flex: 1 }} />

        <div style={{ padding: "12px 8px 4px", borderTop: "1px solid var(--surface-3)", marginTop: 12 }}>
          <div
            className="lb-mono"
            style={{ fontSize: 10.5, color: "var(--text-muted)", marginBottom: 6 }}
          >
            SUPPORT
          </div>
          <div className="lb-side-link">
            <Ic.doc /> Application guide (PDF)
          </div>
          <div className="lb-side-link">
            <Ic.bell /> Contact onboarding team
          </div>
        </div>
      </aside>

      <div className="lb-content">
        <div className="lb-topbar">
          <div className="lb-crumbs">
            <a>Suppliers</a>
            <span className="sep">/</span>
            <a>Applications</a>
            <span className="sep">/</span>
            <span style={{ color: "var(--text-primary)" }}>{data.company.dba || data.company.legal_name}</span>
          </div>
          <div style={{ flex: 1 }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "var(--font-geist-mono), var(--mono-stack)",
              fontSize: 11,
              color: "var(--text-muted)",
            }}
          >
            <span className="lb-save-dot" />
            <span>
              Auto-saved {savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <Button variant="ghost" size="sm" icon={<Ic.save />}>
            Save & exit
          </Button>
          <Button variant="secondary" size="sm" icon={<Ic.download />}>
            Export draft
          </Button>
          <Badge tone="accent">Draft</Badge>
        </div>

        <div style={{ maxWidth: 1080, padding: "32px 40px 64px", margin: "0 auto", width: "100%" }}>
          {renderStep()}

          <div
            style={{
              marginTop: 36,
              paddingTop: 20,
              borderTop: "1px solid var(--surface-3)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Button
              variant="ghost"
              icon={<Ic.back />}
              disabled={stepIdx === 0}
              onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
            >
              {stepIdx > 0 ? `Back to ${STEPS[stepIdx - 1].title}` : "Back"}
            </Button>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span
                className="lb-mono"
                style={{ fontSize: 11, color: "var(--text-muted)" }}
              >
                STEP {stepIdx + 1} OF {STEPS.length}
              </span>
              {stepIdx < STEPS.length - 1 ? (
                <Button
                  variant="primary"
                  iconRight={<Ic.arrow />}
                  onClick={() => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))}
                >
                  Continue · {STEPS[stepIdx + 1].title}
                </Button>
              ) : (
                <Button variant="primary" iconRight={<Ic.arrow />}>
                  Submit for review
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
