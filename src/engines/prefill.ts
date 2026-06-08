/**
 * Prefill engine — deterministic, client-side, unit-tested.
 *
 *   PrefillTemplate + UserProfile  ->  filled letter draft
 *                                      + personalised document checklist
 *                                      + downloadable .ics reminder
 *
 * Boundary (product-spec §Pillar 2): SettleIn prepares, pre-fills, reminds,
 * and hands off. It never logs into portals, submits applications, or
 * handles payments.
 */
import type {
  DocChecklist,
  PrefillTemplate,
  TimelineItem,
  UserProfile,
} from "../types/content";
import { addDays, formatDateLong } from "../lib/dates";

/** University slug -> display name for letter drafts. */
const UNIVERSITY_NAMES: Record<string, string> = {
  tcd: "Trinity College Dublin",
  ucd: "University College Dublin",
  dcu: "Dublin City University",
  tud: "Technological University Dublin",
  rcsi: "RCSI",
  maynooth: "Maynooth University",
};

const NATIONALITY_NAMES: Record<string, string> = {
  IN: "Indian", NG: "Nigerian", CN: "Chinese", BR: "Brazilian", PK: "Pakistani",
  MY: "Malaysian", VN: "Vietnamese", EG: "Egyptian", PH: "Filipino", KE: "Kenyan",
  MX: "Mexican", ID: "Indonesian", US: "American", FR: "French", DE: "German",
};

/**
 * Resolve a snake_case template placeholder from the profile.
 * Returns null when the field is missing (so the UI can request it inline).
 * `today` is injected for deterministic {{today}} resolution.
 */
export function resolvePlaceholder(
  key: string,
  profile: UserProfile,
  today: string,
): string | null {
  const { core, extended } = profile;
  switch (key) {
    case "full_name":
      return core.fullName || null;
    case "university":
      return UNIVERSITY_NAMES[core.university] ?? core.university ?? null;
    case "nationality":
      return NATIONALITY_NAMES[core.nationality] ?? core.nationality ?? null;
    case "course_start":
      return core.courseStart ? formatDateLong(core.courseStart) : null;
    case "arrival_date":
      return core.arrivalDate ? formatDateLong(core.arrivalDate) : null;
    case "course_name":
      return extended.courseName ?? null;
    case "student_id":
      return extended.studentId ?? null;
    case "date_of_birth":
      return extended.dateOfBirth ? formatDateLong(extended.dateOfBirth) : null;
    case "irish_address":
      return extended.irishAddress ?? null;
    case "home_address":
      return extended.homeAddress ?? null;
    case "phone_irish":
      return extended.phoneIrish ?? null;
    case "email":
      return extended.email ?? null;
    case "today":
      return formatDateLong(today);
    case "listing_reference":
      return null; // user supplies per-listing
    default:
      return null;
  }
}

export interface FilledTemplate {
  subject?: string;
  body: string;
  /** Placeholders that had no value — surfaced to the user as missing fields. */
  missing: string[];
}

/** Fill a template from the profile, leaving readable [BRACKETS] for gaps. */
export function fillTemplate(
  template: PrefillTemplate,
  profile: UserProfile,
  today: string,
): FilledTemplate {
  const missing: string[] = [];
  const replace = (text: string): string =>
    text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      const value = resolvePlaceholder(key, profile, today);
      if (value === null || value === "") {
        if (!missing.includes(key)) missing.push(key);
        return `[${key.replace(/_/g, " ")}]`;
      }
      return value;
    });

  return {
    subject: template.subject ? replace(template.subject) : undefined,
    body: replace(template.body),
    missing,
  };
}

/** The personalised document checklist for a task (just the source list for now;
 *  personalisation hooks can prune items by profile later). */
export function checklistForTask(
  taskId: string,
  checklists: DocChecklist[],
): DocChecklist | undefined {
  return checklists.find((c) => c.taskId === taskId);
}

// ----- .ics calendar generation -----

export interface IcsEvent {
  uid: string;
  title: string;
  description: string;
  /** All-day date (ISO YYYY-MM-DD). */
  date: string;
}

/** Escape per RFC 5545 (commas, semicolons, newlines). */
function icsEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function compact(iso: string): string {
  return iso.replace(/-/g, "");
}

/**
 * Build a valid all-day VEVENT .ics document. `stamp` (an ISO date) is used
 * for DTSTAMP so output is deterministic — no Date.now().
 */
export function buildIcs(event: IcsEvent, stamp: string): string {
  const dtStart = compact(event.date);
  const dtEnd = compact(addDays(event.date, 1)); // DTEND is exclusive for all-day
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SettleIn//Reminders//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${compact(stamp)}T000000Z`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${icsEscape(event.title)}`,
    `DESCRIPTION:${icsEscape(event.description)}`,
    "BEGIN:VALARM",
    "TRIGGER:-P3D", // remind 3 days before
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsEscape(event.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  // RFC 5545 requires CRLF line endings.
  return lines.join("\r\n") + "\r\n";
}

/** Build the IRP-deadline reminder .ics from the timeline rule + profile. */
export function buildDeadlineIcs(
  taskId: string,
  title: string,
  deadlineDate: string,
  description: string,
  stamp: string,
): string {
  return buildIcs(
    {
      uid: `${taskId}-${compact(deadlineDate)}@settlein.app`,
      title,
      description,
      date: deadlineDate,
    },
    stamp,
  );
}

export type { TimelineItem };
