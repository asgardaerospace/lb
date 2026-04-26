"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { clearDraft, loadDraft, saveDraft } from "./draftStorage";

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

export function CustomerOnboardingWizard({
  initialStep = 0,
}: {
  initialStep?: number;
}) {
  const router = useRouter();
  const [data, setData] = useState<CustomerData>(initialCustomer);
  const [stepIdx, setStepIdx] = useState(initialStep);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [restored, setRestored] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const initialStepRef = useRef(initialStep);

  // Hydrate from localStorage on mount. setState here is intentional —
  // we are syncing client-side state from an external system (localStorage)
  // which only exists after hydration.
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData(draft.data);
      if (initialStepRef.current === 0 && draft.stepIdx > 0) {
        setStepIdx(draft.stepIdx);
      }
      setSavedAt(new Date(draft.savedAt));
      setRestored(true);
    }
    setHydrated(true);
  }, []);

  // Persist on change (debounced via timeout)
  useEffect(() => {
    if (!hydrated) return;
    const t = window.setTimeout(() => {
      const at = saveDraft(data, stepIdx);
      setSavedAt(at);
    }, 400);
    return () => window.clearTimeout(t);
  }, [data, stepIdx, hydrated]);

  function pickStep(i: number) {
    setStepIdx(i);
    setNavOpen(false);
  }

  function setSlice<K extends keyof CustomerData>(key: K) {
    return (patch: Partial<CustomerData[K]>) =>
      setData((d) => ({ ...d, [key]: { ...d[key], ...patch } }));
  }

  const overallPct = useMemo(
    () =>
      Math.round(
        (Object.values(SECTION_STATUS).reduce((a, b) => a + b, 0) -
          SECTION_STATUS.review) /
          (Object.keys(SECTION_STATUS).length - 1),
      ),
    [],
  );

  const derivedTier = deriveTier(data);
  const step = STEPS[stepIdx];

  function handleReset() {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Reset this draft? Everything you've entered in this browser will be cleared.",
      )
    ) {
      return;
    }
    clearDraft();
    setData(initialCustomer());
    setStepIdx(0);
    setSavedAt(null);
  }

  function handleSubmit() {
    setSubmitting(true);
    // Persist the final state before navigating so the confirmation page can read it.
    saveDraft(data, stepIdx);
    router.push("/onboarding/confirmation");
  }

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
      className="min-h-screen text-slate-200 lg:grid"
      style={{
        gridTemplateColumns: "260px 1fr",
        background:
          "radial-gradient(ellipse at top, rgba(34,211,238,0.04), transparent 50%), #03060c",
      }}
    >
      {/* Mobile topbar */}
      <div className="sticky top-0 z-30 flex h-[52px] items-center gap-3 border-b border-slate-800 bg-[#050a14]/95 px-4 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setNavOpen((v) => !v)}
          aria-label="Toggle steps"
          className="grid h-8 w-8 place-content-center rounded-md border border-slate-800 bg-slate-900 text-slate-300"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            {navOpen ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M3 6h18M3 12h18M3 18h18" />
            )}
          </svg>
        </button>
        <Logo />
        <div className="ml-auto font-mono text-[11px] tracking-wider text-slate-500">
          {stepIdx + 1}/{STEPS.length}
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar
        open={navOpen}
        onClose={() => setNavOpen(false)}
        stepIdx={stepIdx}
        onPick={pickStep}
        overallPct={overallPct}
        dba={data.company.dba}
        onReset={handleReset}
      />

      <div className="flex flex-col overflow-y-auto">
        {/* Desktop topbar */}
        <div className="sticky top-0 z-10 hidden h-[52px] items-center gap-4 border-b border-slate-800 bg-[#050a14]/85 px-5 backdrop-blur lg:flex">
          <div className="flex items-center gap-2 font-mono text-[12px] text-slate-500">
            <span className="text-slate-300">Onboarding</span>
            <span className="text-slate-700">/</span>
            <span className="text-slate-100">{data.company.dba}</span>
          </div>
          <div className="flex-1" />
          <SaveIndicator savedAt={savedAt} />
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Reset draft
          </Button>
        </div>

        {/* Preview banner */}
        <div className="border-b border-amber-500/20 bg-amber-500/[0.04] px-5 py-2.5 text-center">
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-amber-300">
            Preview intake
          </span>
          <span className="ml-2 text-[12px] text-amber-200/85">
            Responses are not saved to a server yet — drafts persist only in this browser.
          </span>
          {restored && (
            <span className="ml-2 hidden font-mono text-[11px] text-amber-300/70 sm:inline">
              · resumed from local draft
            </span>
          )}
        </div>

        <div className="mx-auto w-full max-w-[1080px] px-4 pb-16 pt-6 sm:px-8 lg:px-10 lg:pt-8">
          {stepNode}

          <div className="mt-9 flex flex-col gap-4 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="ghost"
              disabled={stepIdx === 0}
              onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
            >
              ← {stepIdx > 0 ? `Back to ${STEPS[stepIdx - 1].title}` : "Back"}
            </Button>
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
              <span className="text-center font-mono text-[11px] uppercase tracking-wider text-slate-500 sm:text-left">
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
                <Button
                  variant="primary"
                  disabled={submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? "Submitting…" : "Confirm & provision workspace →"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {navOpen && (
        <button
          type="button"
          aria-label="Close steps"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
        />
      )}
    </div>
  );
}

function Sidebar({
  open,
  onClose,
  stepIdx,
  onPick,
  overallPct,
  dba,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  stepIdx: number;
  onPick: (i: number) => void;
  overallPct: number;
  dba: string;
  onReset: () => void;
}) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-[280px] flex-col gap-1 overflow-y-auto border-r border-slate-800 bg-[#050a14] p-3.5 transition-transform duration-200 ease-out lg:static lg:z-auto lg:flex lg:w-auto lg:translate-x-0 ${
        open ? "flex translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="flex items-center justify-between px-2 pt-1 lg:block">
        <div className="hidden lg:block">
          <Logo />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-8 w-8 place-content-center rounded-md border border-slate-800 text-slate-400 lg:hidden"
          aria-label="Close steps"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>
      </div>

      <div className="px-2 pb-3.5">
        <div className="mt-3.5 rounded-md border border-slate-800 bg-slate-900/60 p-3">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-slate-500">
            Customer onboarding
          </div>
          <div className="mt-1 text-[13px] font-medium text-slate-100">
            {dba}
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
            onClick={() => onPick(i)}
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

      <div className="mt-4 border-t border-slate-800 px-3 pt-4 lg:hidden">
        <button
          type="button"
          onClick={onReset}
          className="w-full rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2 text-left text-[12.5px] text-slate-300 transition hover:border-slate-700 hover:text-slate-100"
        >
          Reset draft
        </button>
      </div>
    </aside>
  );
}

function SaveIndicator({ savedAt }: { savedAt: Date | null }) {
  if (!savedAt) {
    return (
      <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
        <span
          className="h-1.5 w-1.5 rounded-full bg-slate-600"
          aria-hidden
        />
        <span>Draft not yet saved</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
      <span
        className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.15)]"
        aria-hidden
      />
      <span>
        Saved locally{" "}
        {savedAt.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  );
}
