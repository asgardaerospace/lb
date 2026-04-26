"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { Logo } from "@/components/shell/Logo";
import {
  CharsStep,
  CompanyStep,
  ComplianceStep,
  DataStep,
  FirstUseStep,
  ManufacturingStep,
  ProgramsStep,
  ReviewStep,
  SupplyChainStep,
} from "./steps";
import {
  STEPS,
  deriveTier,
  initialCustomer,
  type CustomerData,
  type StepId,
} from "./types";

const SECTION_STATUS: Record<StepId, number> = {
  company: 100,
  programs: 100,
  manufacturing: 100,
  compliance: 95,
  program_chars: 100,
  supply_chain: 100,
  data: 100,
  first_use: 100,
  review: 0,
};

export function CustomerOnboardingWizard({ initialStep = 0 }: { initialStep?: number }) {
  const [data, setData] = useState<CustomerData>(initialCustomer);
  const [stepIdx, setStepIdx] = useState(initialStep);
  const [savedAt] = useState(() => new Date());

  function setSlice<K extends keyof CustomerData>(key: K) {
    return (patch: Partial<CustomerData[K]>) =>
      setData((d) => ({ ...d, [key]: { ...d[key], ...patch } }));
  }

  const overallPct = Math.round(
    (Object.values(SECTION_STATUS).reduce((a, b) => a + b, 0) -
      SECTION_STATUS.review) /
      (Object.keys(SECTION_STATUS).length - 1),
  );

  const derivedTier = deriveTier(data);
  const step = STEPS[stepIdx];

  const stepNode = (() => {
    switch (step.id) {
      case "company":
        return <CompanyStep data={data.company} set={setSlice("company")} />;
      case "programs":
        return <ProgramsStep data={data.programs} set={setSlice("programs")} />;
      case "manufacturing":
        return (
          <ManufacturingStep
            data={data.manufacturing}
            set={setSlice("manufacturing")}
          />
        );
      case "compliance":
        return (
          <ComplianceStep data={data.compliance} set={setSlice("compliance")} />
        );
      case "program_chars":
        return (
          <CharsStep data={data.program_chars} set={setSlice("program_chars")} />
        );
      case "supply_chain":
        return (
          <SupplyChainStep
            data={data.supply_chain}
            set={setSlice("supply_chain")}
          />
        );
      case "data":
        return <DataStep data={data.data} set={setSlice("data")} />;
      case "first_use":
        return <FirstUseStep data={data.first_use} set={setSlice("first_use")} />;
      case "review":
        return (
          <ReviewStep
            data={data}
            set={setSlice("workspace")}
            derivedTier={derivedTier}
            goToStep={setStepIdx}
          />
        );
    }
  })();

  return (
    <div
      className="grid min-h-screen text-slate-200"
      style={{
        gridTemplateColumns: "260px 1fr",
        background:
          "radial-gradient(ellipse at top, rgba(34,211,238,0.04), transparent 50%), #03060c",
      }}
    >
      <aside className="flex flex-col gap-1 overflow-y-auto border-r border-slate-800 bg-[#050a14] p-3.5">
        <div className="px-2 pb-3.5 pt-1">
          <Logo />
          <div className="mt-3.5 rounded-md border border-slate-800 bg-slate-900/60 p-3">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-slate-500">
              Customer onboarding
            </div>
            <div className="mt-1 text-[13px] font-medium text-slate-100">
              {data.company.dba}
            </div>
            <div className="mt-1.5 font-mono text-[10.5px] text-slate-500">
              ONB-H4D9R
            </div>
            <div className="mt-2.5 h-1 overflow-hidden rounded-sm bg-slate-800">
              <div
                className="h-full bg-cyan-400 transition-[width] duration-300"
                style={{ width: `${overallPct}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[10.5px]">
              <span className="text-slate-500">{overallPct}% configured</span>
              <span className="text-emerald-400">● Saved</span>
            </div>
          </div>
        </div>

        <div className="px-3 pb-1.5 pt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-600">
          Configuration
        </div>

        {STEPS.map((st, i) => {
          const status = SECTION_STATUS[st.id];
          const active = i === stepIdx;
          const complete = status === 100 && !active;
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => setStepIdx(i)}
              className={`grid items-start gap-3 rounded-md border px-3 py-2.5 text-left transition ${
                active
                  ? "border-cyan-500/30 bg-cyan-500/[0.08]"
                  : "border-transparent hover:bg-cyan-500/[0.03]"
              }`}
              style={{ gridTemplateColumns: "28px 1fr" }}
            >
              <div
                className={`grid h-7 w-7 place-content-center rounded-md border font-mono text-[11.5px] font-semibold ${
                  active
                    ? "border-cyan-400 bg-cyan-400 text-slate-950"
                    : complete
                    ? "border-emerald-500/30 bg-emerald-500/[0.12] text-emerald-300"
                    : "border-slate-800 bg-slate-900 text-slate-400"
                }`}
              >
                {complete ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                ) : (
                  st.num
                )}
              </div>
              <div>
                <div
                  className={`text-[13px] font-medium leading-tight ${
                    active ? "text-slate-100" : "text-slate-400"
                  }`}
                >
                  {st.title}
                </div>
                <div className="mt-0.5 font-mono text-[10.5px] tracking-wider text-slate-600">
                  {st.meta}
                </div>
              </div>
            </button>
          );
        })}
      </aside>

      <div className="flex flex-col overflow-y-auto">
        <div className="sticky top-0 z-10 flex h-[52px] items-center gap-4 border-b border-slate-800 bg-[#050a14]/85 px-5 backdrop-blur">
          <div className="flex items-center gap-2 font-mono text-[12px] text-slate-500">
            <span className="text-slate-300">Onboarding</span>
            <span className="text-slate-700">/</span>
            <span className="text-slate-100">{data.company.dba}</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
            <span
              className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.15)]"
              aria-hidden
            />
            <span>
              Auto-saved{" "}
              {savedAt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <Button variant="ghost" size="sm">
            Save &amp; exit
          </Button>
        </div>

        <div className="mx-auto w-full max-w-[1080px] px-10 pb-16 pt-8">
          {stepNode}

          <div className="mt-9 flex items-center justify-between border-t border-slate-800 pt-5">
            <Button
              variant="ghost"
              disabled={stepIdx === 0}
              onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
            >
              ← {stepIdx > 0 ? `Back to ${STEPS[stepIdx - 1].title}` : "Back"}
            </Button>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                Step {stepIdx + 1} of {STEPS.length}
              </span>
              {stepIdx < STEPS.length - 1 ? (
                <Button
                  variant="primary"
                  onClick={() =>
                    setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))
                  }
                >
                  Continue · {STEPS[stepIdx + 1].title} →
                </Button>
              ) : (
                <Button variant="primary">
                  Confirm &amp; provision workspace →
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
