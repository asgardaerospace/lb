"use client";

import { useState, type ReactNode, type CSSProperties, type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;
const i = (
  name: string,
  width: number,
  height: number,
  strokeWidth: number,
  fill: string,
  paths: ReactNode,
) => {
  const Icon = (props: IconProps) => (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {paths}
    </svg>
  );
  Icon.displayName = `Ic.${name}`;
  return Icon;
};

export const Ic = {
  arrow: i('arrow', 14, 14, 1.8, "none", <path d="M5 12h14M13 5l7 7-7 7" />),
  back: i('back', 14, 14, 1.8, "none", <path d="M19 12H5M11 5l-7 7 7 7" />),
  check: i('check', 14, 14, 2, "none", <path d="M5 12l5 5L20 7" />),
  x: i('x', 12, 12, 2, "none", <path d="M6 6l12 12M6 18L18 6" />),
  plus: i('plus', 14, 14, 1.8, "none", <path d="M12 5v14M5 12h14" />),
  upload: i('upload', 
    14,
    14,
    1.6,
    "none",
    <>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <path d="M17 8l-5-5-5 5M12 3v12" />
    </>,
  ),
  doc: i('doc', 
    14,
    14,
    1.5,
    "none",
    <>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
    </>,
  ),
  trash: i('trash', 
    13,
    13,
    1.6,
    "none",
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />,
  ),
  edit: i('edit', 
    13,
    13,
    1.6,
    "none",
    <>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4z" />
    </>,
  ),
  save: i('save', 
    14,
    14,
    1.6,
    "none",
    <>
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <path d="M17 21v-8H7v8M7 3v5h8" />
    </>,
  ),
  shield: i('shield', 14, 14, 1.6, "none", <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />),
  factory: i('factory', 
    14,
    14,
    1.5,
    "none",
    <>
      <path d="M2 20V8l6 4V8l6 4V8l6 4v8z" />
      <path d="M6 20v-4M10 20v-4M14 20v-4M18 20v-4" />
    </>,
  ),
  tool: i('tool', 
    14,
    14,
    1.5,
    "none",
    <path d="M14.7 6.3a4 4 0 014.6 4.6l3.4 3.4a2 2 0 01-2.8 2.8l-3.4-3.4a4 4 0 01-4.6-4.6L9 5l3-3 2.7 4.3z" />,
  ),
  users: i('users', 
    14,
    14,
    1.5,
    "none",
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />,
  ),
  dollar: i('dollar', 14, 14, 1.6, "none", <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />),
  layers: i('layers', 14, 14, 1.5, "none", <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />),
  award: i('award', 
    14,
    14,
    1.5,
    "none",
    <>
      <circle cx="12" cy="8" r="6" />
      <path d="M15.5 13.5L17 22l-5-3-5 3 1.5-8.5" />
    </>,
  ),
  clock: i('clock', 
    14,
    14,
    1.6,
    "none",
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>,
  ),
  history: i('history', 
    14,
    14,
    1.5,
    "none",
    <>
      <path d="M3 12a9 9 0 109-9 9.7 9.7 0 00-7 3l-2 2" />
      <path d="M3 4v5h5M12 7v5l4 2" />
    </>,
  ),
  list: i('list', 14, 14, 1.6, "none", <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />),
  warn: i('warn', 
    14,
    14,
    1.7,
    "none",
    <path d="M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />,
  ),
  info: i('info', 
    14,
    14,
    1.7,
    "none",
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </>,
  ),
  download: i('download', 
    13,
    13,
    1.6,
    "none",
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />,
  ),
  cube: i('cube', 
    14,
    14,
    1.5,
    "none",
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />,
  ),
  more: i('more', 
    14,
    14,
    0,
    "currentColor",
    <>
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </>,
  ),
  bell: i('bell', 
    14,
    14,
    1.6,
    "none",
    <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" />,
  ),
};

type Tone = "neutral" | "info" | "success" | "warn" | "danger" | "accent";

export function Field({
  label,
  required,
  optional,
  help,
  error,
  children,
  span,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  help?: string;
  error?: string;
  children: ReactNode;
  span?: number;
}) {
  const style: CSSProperties | undefined = span
    ? { gridColumn: `span ${span} / span ${span}` }
    : undefined;
  return (
    <div style={style}>
      <label className="lb-label">
        {label}
        {required && <span className="req">*</span>}
        {optional && <span className="opt">optional</span>}
      </label>
      {children}
      {help && !error && <span className="lb-help">{help}</span>}
      {error && <span className="lb-error">{error}</span>}
    </div>
  );
}

export function Badge({
  tone = "neutral",
  children,
  dot = true,
}: {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span className={`lb-badge lb-badge-${tone}`}>
      {dot && <span className="lb-badge-dot" />}
      {children}
    </span>
  );
}

type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "success";

export function Button({
  variant = "secondary",
  size,
  onClick,
  children,
  icon,
  iconRight,
  disabled,
  type = "button",
}: {
  variant?: BtnVariant;
  size?: "sm" | "lg";
  onClick?: () => void;
  children?: ReactNode;
  icon?: ReactNode;
  iconRight?: ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const cls = `lb-btn lb-btn-${variant}${size ? ` lb-btn-${size}` : ""}`;
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      {icon}
      {children}
      {iconRight}
    </button>
  );
}

export function LbCard({
  title,
  eyebrow,
  action,
  children,
  className = "",
  padded = true,
}: {
  title?: ReactNode;
  eyebrow?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div className={`lb-card ${className}`}>
      {(title || action) && (
        <div className="lb-card-header">
          <div>
            {eyebrow && (
              <div
                style={{
                  fontFamily: "var(--font-geist-mono), var(--mono-stack)",
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: 4,
                }}
              >
                {eyebrow}
              </div>
            )}
            {title && <div style={{ fontSize: 14, fontWeight: 500 }}>{title}</div>}
          </div>
          {action}
        </div>
      )}
      <div className={padded ? "lb-card-body" : ""}>{children}</div>
    </div>
  );
}

export function Callout({
  tone = "info",
  icon,
  children,
}: {
  tone?: "info" | "warn" | "accent" | "danger";
  icon?: ReactNode;
  children: ReactNode;
}) {
  const Icon = icon ?? (tone === "warn" ? <Ic.warn /> : tone === "danger" ? <Ic.warn /> : <Ic.info />);
  return (
    <div className={`lb-callout lb-callout-${tone}`}>
      <div style={{ flexShrink: 0, marginTop: 1 }}>{Icon}</div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

export function TagInput({
  value = [],
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
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: value.length ? 8 : 0,
        }}
      >
        {value.map((t, idx) => (
          <span key={`${t}-${idx}`} className="lb-chip">
            {t}
            <button
              type="button"
              aria-label={`Remove ${t}`}
              onClick={() => onChange(value.filter((_, j) => j !== idx))}
            >
              <Ic.x />
            </button>
          </span>
        ))}
      </div>
      <input
        className="lb-input lb-mono"
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
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
          {suggestions
            .filter((s) => !value.includes(s))
            .slice(0, 8)
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                style={{
                  fontFamily: "var(--font-geist-mono), var(--mono-stack)",
                  fontSize: 11,
                  padding: "3px 8px",
                  background: "transparent",
                  border: "1px dashed var(--surface-3)",
                  color: "var(--text-muted)",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                + {s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

export function ScoreRing({
  value = 72,
  size = 88,
  label = "Readiness",
}: {
  value?: number;
  size?: number;
  label?: string;
}) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const tone =
    value >= 80
      ? "var(--status-success)"
      : value >= 60
        ? "var(--accent)"
        : value >= 40
          ? "var(--status-warn)"
          : "var(--status-danger)";
  return (
    <div className="lb-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--surface-3)" strokeWidth="6" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={tone}
          strokeWidth="6"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c - (c * value) / 100}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .6s" }}
        />
      </svg>
      <div className="num">
        {value}
        <small>{label}</small>
      </div>
    </div>
  );
}

export function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        padding: "10px 12px",
        background: "var(--surface-2)",
        border: "1px solid var(--surface-3)",
        borderRadius: 6,
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        className="lb-checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
