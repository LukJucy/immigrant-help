/**
 * CountdownCard — the pinned IRP 90-day countdown. Calm by default, amber when
 * the booking window is tightening, red only when genuinely urgent/overdue
 * (design-system.md: never alarm without cause).
 */
import { Link } from "react-router-dom";
import { IconClock } from "./icons";
import { formatDate } from "../lib/dates";
import type { IrpCountdown } from "../engines/timeline";

export function CountdownCard({ irp }: { irp: IrpCountdown }) {
  const { daysLeft, deadline, bookBy, overdue } = irp;

  // Tone by urgency, not by default.
  const tone = overdue || daysLeft <= 14
    ? { ring: "border-danger/40", accent: "text-danger", bg: "bg-red-50" }
    : daysLeft <= 30
      ? { ring: "border-warning/40", accent: "text-warning", bg: "bg-amber-50" }
      : { ring: "border-primary/30", accent: "text-primary", bg: "bg-primary-soft/40" };

  return (
    <section
      className={`rounded-card border ${tone.ring} ${tone.bg} p-4`}
      aria-label="IRP registration deadline"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-ink">
        <IconClock className={`h-5 w-5 ${tone.accent}`} />
        IRP registration deadline
      </div>
      <p className="mt-2 flex items-baseline gap-2">
        <span className={`text-4xl font-bold ${tone.accent}`}>
          {overdue ? "Overdue" : daysLeft}
        </span>
        {!overdue && <span className="text-lg font-medium text-ink">days left</span>}
      </p>
      <p className="mt-1 text-sm text-muted">
        Register by <strong className="text-ink">{formatDate(deadline)}</strong> · book your
        appointment by <strong className="text-ink">{formatDate(bookBy)}</strong> to allow for the
        wait.
      </p>
      <Link
        to="/task/irp-registration"
        className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 font-semibold text-white hover:bg-primary/90"
      >
        Book your appointment
      </Link>
    </section>
  );
}
