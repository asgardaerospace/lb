"use client";

import { useState } from "react";

// ───────── Field ─────────
export function Field({
  label,
  required,
  optional,
  help,
  error,
  children,
  span,
  className = "",
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  help?: string;
  error?: string;
  children: React.ReactNode;
  span?: number;
  className?: string;
}) {
  const colSpan = span
    ? { gridColumn: `span ${span} / span ${span}` }
    : undefined;
  return (
    <div style={colSpan} className={className}>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
        {required && <span className="ml-0.5 text-rose-400">*</span>}
        {optional && (
          <span className="ml-1.5 font-medium normal-case tracking-normal text-slate-600">
            optional
          </span>
        )}
      </label>
      {children}
      {help && !error && (
        <p className="mt-1.5 text-[11.5px] leading-snug text-slate-500">
          {help}
        </p>
      )}
      {error && (
        <p className="mt-1.5 font-mono text-[11.5px] text-rose-400">{error}</p>
      )}
    </div>
  );
}

// ───────── Inputs (visual primitives) ─────────
const baseInput =
  "w-full rounded-md border border-slate-700 bg-[#060c18] px-3 py-2 text-[13px] text-slate-100 placeholder:text-slate-600 transition focus:border-cyan-700 focus:bg-[#07101e] focus:shadow-[0_0_0_3px_rgba(8,145,178,0.22)] focus:outline-none disabled:opacity-50";

export function TextInput({
  className = "",
  mono,
  tnum,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  mono?: boolean;
  tnum?: boolean;
}) {
  return (
    <input
      className={`${baseInput} ${mono ? "font-mono text-[12.5px]" : ""} ${
        tnum ? "tabular-nums" : ""
      } ${className}`}
      {...rest}
    />
  );
}

export function Select({
  className = "",
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={`${baseInput} appearance-none pr-8 ${className}`}
        {...rest}
      >
        {children}
      </select>
      <svg
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 text-slate-400"
        viewBox="0 0 10 6"
      >
        <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function Textarea({
  className = "",
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`${baseInput} min-h-[88px] resize-y leading-relaxed ${className}`}
      {...rest}
    />
  );
}

// ───────── SegmentedControl ─────────
export function Seg<T extends string | boolean>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-md border border-slate-800 bg-slate-900/60 p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-[5px] px-3 py-1.5 text-xs font-medium transition ${
              active
                ? "bg-slate-800 text-slate-100"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ───────── TagInput ─────────
export function TagInput({
  value,
  onChange,
  placeholder = "Add and press Enter",
  suggestions = [],
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}) {
  const [text, setText] = useState("");
  const add = (raw: string) => {
    const v = raw.trim();
    if (!v || value.includes(v)) return;
    onChange([...value, v]);
    setText("");
  };
  return (
    <div>
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map((t, i) => (
            <span
              key={`${t}-${i}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900 px-2 py-1 font-mono text-[12px] text-slate-100"
            >
              {t}
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="rounded text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300"
                aria-label={`Remove ${t}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
      <TextInput
        mono
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(text);
          }
        }}
      />
      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions
            .filter((s) => !value.includes(s))
            .slice(0, 8)
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="rounded border border-dashed border-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-500 transition hover:border-slate-600 hover:text-slate-300"
              >
                + {s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

// ───────── Card with eyebrow + action ─────────
export function SectionCard({
  title,
  eyebrow,
  action,
  children,
}: {
  title?: string;
  eyebrow?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50">
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-5 py-3.5">
          <div>
            {eyebrow && (
              <div className="mb-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-slate-500">
                {eyebrow}
              </div>
            )}
            {title && (
              <div className="text-[14px] font-medium text-slate-100">
                {title}
              </div>
            )}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

// ───────── Callout ─────────
export function Callout({
  tone = "info",
  children,
}: {
  tone?: "info" | "warn" | "accent" | "danger";
  children: React.ReactNode;
}) {
  const styles = {
    info: "border-sky-500/20 bg-sky-500/5 text-sky-200",
    warn: "border-amber-500/25 bg-amber-500/5 text-amber-200",
    accent: "border-cyan-500/25 bg-cyan-500/5 text-cyan-200",
    danger: "border-rose-500/25 bg-rose-500/5 text-rose-200",
  }[tone];
  return (
    <div className={`flex gap-3 rounded-md border px-3.5 py-3 text-[12.5px] leading-relaxed ${styles}`}>
      <svg
        className="mt-0.5 h-3.5 w-3.5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {tone === "warn" || tone === "danger" ? (
          <>
            <path d="M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <path d="M12 9v4M12 17h.01" />
          </>
        ) : (
          <>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </>
        )}
      </svg>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ───────── ChoiceCard ─────────
export function ChoiceCard({
  active,
  onClick,
  title,
  desc,
  badge,
  className = "",
}: {
  active: boolean;
  onClick: () => void;
  title: React.ReactNode;
  desc?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border p-3.5 text-left transition ${
        active
          ? "border-cyan-500/35 bg-cyan-500/[0.06]"
          : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[13px] font-medium text-slate-100">{title}</div>
        {badge}
      </div>
      {desc && (
        <div className="mt-1 font-mono text-[11px] leading-snug text-slate-500">
          {desc}
        </div>
      )}
    </button>
  );
}

// ───────── Checkbox / Radio (styled) ─────────
export function Checkbox({
  className = "",
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={`h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-[3px] border border-slate-600 bg-[#060c18] transition checked:border-cyan-400 checked:bg-cyan-400 checked:bg-[url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><path d='M3 8l3.5 3.5L13 5' stroke='%2302111a' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>")] checked:bg-center checked:bg-no-repeat ${className}`}
      {...rest}
    />
  );
}

// ───────── Tone badge ─────────
const toneCls: Record<string, string> = {
  neutral: "bg-slate-500/10 text-slate-300 ring-slate-500/20",
  info: "bg-sky-500/10 text-sky-300 ring-sky-500/25",
  success: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/25",
  warn: "bg-amber-500/10 text-amber-300 ring-amber-500/25",
  danger: "bg-rose-500/10 text-rose-300 ring-rose-500/25",
  accent: "bg-cyan-500/10 text-cyan-300 ring-cyan-500/25",
};

export function Pill({
  tone = "neutral",
  children,
  dot = true,
}: {
  tone?: keyof typeof toneCls;
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-wider ring-1 ring-inset ${toneCls[tone]}`}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-current opacity-80"
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}

// ───────── StepHeader ─────────
export function StepHeader({
  eyebrow,
  title,
  desc,
  action,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-7 flex items-start justify-between gap-4 border-b border-slate-800 pb-5">
      <div>
        <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-cyan-400">
          {eyebrow}
        </div>
        <h1 className="m-0 mb-1 text-[22px] font-medium tracking-tight text-slate-100">
          {title}
        </h1>
        <p className="m-0 max-w-[720px] text-[13.5px] leading-relaxed text-slate-400">
          {desc}
        </p>
      </div>
      {action}
    </header>
  );
}
