/**
 * Timeline / Dashboard (home) — the anxiety-killer. A personalised, deadline-
 * ordered task list grouped by phase, with the pinned IRP countdown.
 */
import { useMemo } from "react";
import { Navigate, Link } from "react-router-dom";
import { useProfile } from "../store/profile";
import { content } from "../lib/content";
import { buildTimeline } from "../engines/timeline";
import { todayISO } from "../lib/dates";
import { useStoredSet } from "../lib/useLocalStorage";
import { CountdownCard } from "../components/CountdownCard";
import { TaskRow } from "../components/TaskRow";

export function Timeline() {
  const { profile } = useProfile();
  const completed = useStoredSet("settlein.completed.v1");

  const plan = useMemo(
    () => (profile ? buildTimeline(profile, content.timelineRules, content.guides, todayISO()) : null),
    [profile],
  );

  if (!profile) return <Navigate to="/onboard" replace />;
  if (!plan) return null;

  const firstName = profile.core.fullName.split(" ")[0];
  const total = plan.orderedTasks.length;
  const doneCount = plan.orderedTasks.filter((t) => completed.has(t.taskId)).length;
  const titleById = new Map(plan.orderedTasks.map((t) => [t.taskId, t.guide.title]));

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-ink">Hi {firstName} 👋</h1>
          <p className="text-sm text-muted">
            {doneCount} of {total} done · your first 90 days, in order.
          </p>
        </div>
        <Link to="/about" className="text-sm font-medium text-primary underline underline-offset-2">
          Edit / privacy
        </Link>
      </header>

      {plan.irp && <CountdownCard irp={plan.irp} />}

      {plan.groups.map((group) => (
        <section key={group.phase}>
          <h2 className="sticky top-0 z-[1] -mx-4 bg-bg/95 px-4 py-1.5 text-sm font-semibold uppercase tracking-wide text-muted backdrop-blur">
            {group.label}
          </h2>
          <div className="rounded-card border border-border bg-surface px-4">
            {group.tasks.map((task) => (
              <TaskRow
                key={task.taskId}
                task={task}
                done={completed.has(task.taskId)}
                onToggle={() => completed.toggle(task.taskId)}
                blockerTitles={task.blockedBy.map((b) => titleById.get(b) ?? b)}
              />
            ))}
          </div>
        </section>
      ))}

      {doneCount === total && total > 0 && (
        <p className="rounded-card border border-success/30 bg-green-50 p-4 text-center text-success">
          🎉 You've worked through every step. You're settled in!
        </p>
      )}
    </div>
  );
}
