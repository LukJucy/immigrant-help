/** Small design-system primitives (see docs/design/design-system.md). */
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Category } from "../types/content";

// ----- Button -----

type ButtonVariant = "primary" | "secondary" | "text";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const buttonStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary/90 active:bg-primary/80",
  secondary: "border border-primary text-primary bg-white hover:bg-primary-soft",
  text: "text-primary hover:bg-primary-soft",
};

export function Button({ variant = "primary", fullWidth, className = "", ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] ${buttonStyles[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    />
  );
}

// ----- Card -----

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-card border border-border bg-surface p-4 ${className}`}>{children}</div>
  );
}

// ----- Chip / FactChip -----

export function Chip({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "primary" | "danger" | "warning" | "success" | "info";
  className?: string;
}) {
  const tones = {
    neutral: "bg-bg text-muted border-border",
    primary: "bg-primary-soft text-primary border-primary-soft",
    danger: "bg-red-50 text-danger border-red-100",
    warning: "bg-amber-50 text-warning border-amber-100",
    success: "bg-green-50 text-success border-green-100",
    info: "bg-blue-50 text-info border-blue-100",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function FactChip({ label, value }: { label: string; value: ReactNode }) {
  return (
    <span className="inline-flex flex-col rounded-lg border border-border bg-bg px-3 py-1.5">
      <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
      <span className="text-sm font-semibold text-ink">{value}</span>
    </span>
  );
}

// ----- Section title -----

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-2 text-[20px] font-semibold text-ink">{children}</h2>;
}

// ----- Category metadata (icon + label per design-system iconography) -----

export const CATEGORY_META: Record<Category, { icon: string; label: string }> = {
  legal: { icon: "⚖", label: "Legal" },
  money: { icon: "€", label: "Money" },
  transport: { icon: "🚌", label: "Transport" },
  health: { icon: "＋", label: "Health" },
  housing: { icon: "🏠", label: "Housing" },
  comms: { icon: "📱", label: "Comms" },
  lifestyle: { icon: "★", label: "Lifestyle" },
};
