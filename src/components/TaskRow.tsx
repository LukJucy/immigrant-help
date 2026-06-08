/** A single task row: done checkbox · title · timing chip · blocked-by note. */
import { Link } from "react-router-dom";
import { Chip, CATEGORY_META } from "./ui";
import { IconCheck, IconChevronRight } from "./icons";
import { formatDate } from "../lib/dates";
import type { ComputedTask } from "../engines/timeline";

function timing(task: ComputedTask): { label: string; tone: "neutral" | "danger" | "warning" | "success" } {
  if (task.daysUntilDue < 0 && task.hardDeadline) return { label: "overdue", tone: "danger" };
  if (task.hardDeadline) return { label: `by ${formatDate(task.dueDate)}`, tone: "warning" };
  if (task.daysUntilDue < 0) return { label: "now", tone: "neutral" };
  return { label: formatDate(task.dueDate), tone: "neutral" };
}

export function TaskRow({
  task,
  done,
  onToggle,
  blockerTitles,
}: {
  task: ComputedTask;
  done: boolean;
  onToggle: () => void;
  blockerTitles: string[];
}) {
  const t = timing(task);
  const cat = CATEGORY_META[task.guide.category];

  return (
    <div className="flex items-start gap-3 border-b border-border py-3 last:border-0">
      <button
        role="checkbox"
        aria-checked={done}
        aria-label={done ? `Mark ${task.guide.title} not done` : `Mark ${task.guide.title} done`}
        onClick={onToggle}
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${
          done ? "border-success bg-success text-white" : "border-border bg-white"
        }`}
      >
        {done && <IconCheck className="h-4 w-4" />}
      </button>

      <Link to={`/task/${task.taskId}`} className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-base">
            {cat.icon}
          </span>
          <span className={`font-medium ${done ? "text-muted line-through" : "text-ink"}`}>
            {task.guide.title}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Chip tone={t.tone}>{t.label}</Chip>
          {blockerTitles.length > 0 && (
            <span className="text-xs text-muted">Do after: {blockerTitles.join(", ")}</span>
          )}
        </div>
      </Link>

      <Link to={`/task/${task.taskId}`} aria-label={`Open ${task.guide.title}`} className="mt-1 text-muted">
        <IconChevronRight className="h-5 w-5" />
      </Link>
    </div>
  );
}
