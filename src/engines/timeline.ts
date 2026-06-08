/**
 * Timeline engine — deterministic, client-side, unit-tested.
 *
 * Input:  the user's profile anchors (arrivalDate, courseStart) + the
 *         timeline rules + guides from content.json.
 * Output: an ordered, dated, phase-grouped task list, the IRP 90-day
 *         countdown, and resolved `blockedBy` relationships.
 *
 * No Date.now() inside — callers pass `today` so output is testable.
 */
import type {
  Priority,
  TaskGuide,
  TimelineItem,
  UserProfile,
} from "../types/content";
import { addDays, daysBetween } from "../lib/dates";
import { guideApplies } from "../lib/personalise";

export const PHASE_ORDER: Priority[] = [
  "pre_arrival",
  "week_1",
  "first_month",
  "first_90_days",
  "when_working",
  "each_year",
  "after_graduation",
];

export const PHASE_LABELS: Record<Priority, string> = {
  pre_arrival: "Before arrival",
  week_1: "Week 1",
  first_month: "First month",
  first_90_days: "First 90 days",
  when_working: "When you start working",
  each_year: "Each year",
  after_graduation: "After graduation",
};

export interface ComputedTask {
  taskId: string;
  guide: TaskGuide;
  phase: Priority;
  dueDate: string; // ISO
  hardDeadline: boolean;
  showCountdown: boolean;
  /** Blockers that are also in this user's plan (so the UI can link them). */
  blockedBy: string[];
  daysUntilDue: number; // relative to `today`
}

export interface PhaseGroup {
  phase: Priority;
  label: string;
  tasks: ComputedTask[];
}

export interface IrpCountdown {
  deadline: string; // arrivalDate + 90
  bookBy: string; // deadline - 70 (allow for appointment wait)
  daysLeft: number; // deadline - today
  overdue: boolean;
}

export interface TimelinePlan {
  groups: PhaseGroup[];
  orderedTasks: ComputedTask[];
  irp?: IrpCountdown;
}

function anchorDate(rule: TimelineItem, profile: UserProfile): string {
  return rule.timingRule.anchor === "courseStart"
    ? profile.core.courseStart
    : profile.core.arrivalDate;
}

/**
 * Build the personalised plan.
 * @param today ISO date used for countdown / daysUntilDue (inject for tests).
 */
export function buildTimeline(
  profile: UserProfile,
  rules: TimelineItem[],
  guides: TaskGuide[],
  today: string,
): TimelinePlan {
  const guideById = new Map(guides.map((g) => [g.id, g]));

  // 1. Keep only rules whose guide exists AND applies to this profile.
  const applicable = rules.filter((rule) => {
    const guide = guideById.get(rule.taskId);
    return guide && guideApplies(guide.appliesTo, profile);
  });
  const includedIds = new Set(applicable.map((r) => r.taskId));

  // 2. Compute each task's due date + blockers (only blockers in this plan).
  const tasks: ComputedTask[] = applicable.map((rule) => {
    const dueDate = addDays(anchorDate(rule, profile), rule.timingRule.offsetDays);
    return {
      taskId: rule.taskId,
      guide: guideById.get(rule.taskId)!,
      phase: rule.phase,
      dueDate,
      hardDeadline: rule.hardDeadline,
      showCountdown: rule.showCountdown,
      blockedBy: rule.blockedBy.filter((b) => includedIds.has(b)),
      daysUntilDue: daysBetween(today, dueDate),
    };
  });

  // 3. Order globally by phase, then by due date, then hard deadlines first.
  const byDueDate = (a: ComputedTask, b: ComputedTask) =>
    a.dueDate.localeCompare(b.dueDate) ||
    Number(b.hardDeadline) - Number(a.hardDeadline) ||
    a.taskId.localeCompare(b.taskId);

  const orderedTasks = [...tasks].sort(
    (a, b) =>
      PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase) || byDueDate(a, b),
  );

  // 4. Group by phase in canonical order.
  const groups: PhaseGroup[] = PHASE_ORDER.map((phase) => ({
    phase,
    label: PHASE_LABELS[phase],
    tasks: orderedTasks.filter((t) => t.phase === phase),
  })).filter((g) => g.tasks.length > 0);

  // 5. IRP countdown (only if the user has a countdown task — i.e. needs IRP).
  const irpTask = tasks.find((t) => t.showCountdown);
  let irp: IrpCountdown | undefined;
  if (irpTask) {
    const daysLeft = daysBetween(today, irpTask.dueDate);
    irp = {
      deadline: irpTask.dueDate,
      bookBy: addDays(irpTask.dueDate, -70),
      daysLeft,
      overdue: daysLeft < 0,
    };
  }

  return { groups, orderedTasks, irp };
}
