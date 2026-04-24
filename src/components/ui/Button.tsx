import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary:
    "bg-cyan-500 text-slate-950 hover:bg-cyan-400 focus-visible:outline-cyan-400",
  secondary:
    "bg-slate-800 text-slate-100 hover:bg-slate-700 ring-1 ring-inset ring-slate-700 focus-visible:outline-slate-500",
  ghost:
    "text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 focus-visible:outline-slate-500",
  danger:
    "bg-rose-600 text-white hover:bg-rose-500 focus-visible:outline-rose-500",
};

const sizes: Record<Size, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-3.5 py-2 text-sm",
};

function classes(variant: Variant, size: Size, extra = "") {
  return `inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${extra}`;
}

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button className={classes(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

type LinkButtonProps = CommonProps & {
  href: string;
};

export function LinkButton({
  href,
  variant = "secondary",
  size = "md",
  className = "",
  children,
}: LinkButtonProps) {
  return (
    <Link href={href} className={classes(variant, size, className)}>
      {children}
    </Link>
  );
}
