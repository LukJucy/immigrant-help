/**
 * Prefill — generate a letter draft + personalised document checklist +
 * downloadable .ics reminder. The "do it for me, almost" moment.
 *
 * Boundary: SettleIn prepares and hands off. It never logs into portals,
 * submits applications, or handles payments.
 */
import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useProfile } from "../store/profile";
import { checklistForGuide, getGuide, templatesForGuide } from "../lib/content";
import { content } from "../lib/content";
import { buildDeadlineIcs, fillTemplate } from "../engines/prefill";
import { addDays, formatDate, todayISO } from "../lib/dates";
import { copyText, downloadFile } from "../lib/download";
import { Button, SectionTitle } from "../components/ui";
import { DocChecklist } from "../components/DocChecklist";
import { IconCalendar, IconChevronLeft, IconCopy, IconDownload } from "../components/icons";
import type { ProfileExtended } from "../types/content";

/** Editable profile-backed fields a template might need. */
const FIELD_MAP: Record<string, { field: keyof ProfileExtended; label: string; type: string }> = {
  irish_address: { field: "irishAddress", label: "Your Irish address", type: "text" },
  course_name: { field: "courseName", label: "Your course name", type: "text" },
  student_id: { field: "studentId", label: "Your student ID", type: "text" },
  phone_irish: { field: "phoneIrish", label: "Your Irish phone number", type: "tel" },
  email: { field: "email", label: "Your email", type: "email" },
  date_of_birth: { field: "dateOfBirth", label: "Your date of birth", type: "date" },
  home_address: { field: "homeAddress", label: "Your home address", type: "text" },
};

export function Prefill() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { profile, updateExtended } = useProfile();
  const guide = getGuide(id);
  const template = templatesForGuide(id)[0];

  const [edited, setEdited] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const today = todayISO();
  const filled = useMemo(
    () => (template && profile ? fillTemplate(template, profile, today) : null),
    [template, profile, today],
  );

  if (!profile) return <Navigate to="/onboard" replace />;
  if (!guide || !template || !filled) return <Navigate to={`/task/${id}`} replace />;

  const draft = edited ?? filled.body;
  const checklist = checklistForGuide(id);

  // The reminder date = this task's computed due date, if it has a timeline rule.
  const rule = content.timelineRules.find((r) => r.taskId === id);
  const reminderDate = rule
    ? addDays(
        rule.timingRule.anchor === "courseStart" ? profile.core.courseStart : profile.core.arrivalDate,
        rule.timingRule.offsetDays,
      )
    : null;

  // Only show inline requests for fields we can write back to the profile.
  const missingEditable = filled.missing.filter((m) => FIELD_MAP[m]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  async function onCopy() {
    const full = filled!.subject ? `Subject: ${filled!.subject}\n\n${draft}` : draft;
    flash((await copyText(full)) ? "Copied to clipboard" : "Copy failed — select and copy manually");
  }

  function onDownloadLetter() {
    const full = filled!.subject ? `Subject: ${filled!.subject}\n\n${draft}` : draft;
    downloadFile(`${template.id}.txt`, full, "text/plain;charset=utf-8");
    flash("Letter downloaded");
  }

  function onDownloadIcs() {
    if (!reminderDate) return;
    const ics = buildDeadlineIcs(
      guide!.id,
      `SettleIn: ${guide!.title}`,
      reminderDate,
      `Reminder to handle "${guide!.title}". See SettleIn for the steps and documents.`,
      today,
    );
    downloadFile(`${guide!.id}-reminder.ics`, ics, "text/calendar;charset=utf-8");
    flash("Calendar reminder downloaded");
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <button
          onClick={() => navigate(`/task/${id}`)}
          className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
        >
          <IconChevronLeft className="h-5 w-5" /> Back to guide
        </button>
        <h1 className="text-[26px] font-bold leading-tight text-ink">Prefill: {template.title}</h1>
      </header>

      {/* Inline requests for missing fields */}
      {missingEditable.length > 0 && (
        <section className="rounded-card border border-warning/40 bg-amber-50 p-4">
          <p className="mb-3 text-sm font-medium text-ink">
            A few details are missing — add them and the draft fills in instantly:
          </p>
          <div className="space-y-3">
            {missingEditable.map((key) => {
              const m = FIELD_MAP[key];
              return (
                <label key={key} className="block">
                  <span className="mb-1 block text-sm font-medium text-ink">{m.label}</span>
                  <input
                    type={m.type}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-base focus:border-primary"
                    value={(profile.extended[m.field] as string) ?? ""}
                    onChange={(e) => {
                      updateExtended({ [m.field]: e.target.value } as Partial<ProfileExtended>);
                      setEdited(null); // re-fill from the template
                    }}
                  />
                </label>
              );
            })}
          </div>
        </section>
      )}

      {/* Draft */}
      <section>
        <SectionTitle>Your draft</SectionTitle>
        {filled.subject && (
          <p className="mb-2 rounded-lg bg-bg px-3 py-2 text-sm">
            <span className="font-semibold text-muted">Subject: </span>
            <span className="text-ink">{filled.subject}</span>
          </p>
        )}
        <textarea
          className="h-72 w-full resize-y rounded-card border border-border bg-white p-3 font-mono text-sm leading-relaxed text-ink focus:border-primary"
          value={draft}
          onChange={(e) => setEdited(e.target.value)}
          aria-label="Editable letter draft"
        />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onCopy}>
            <IconCopy className="h-5 w-5" /> Copy
          </Button>
          <Button variant="secondary" onClick={onDownloadLetter}>
            <IconDownload className="h-5 w-5" /> Download
          </Button>
        </div>
      </section>

      {/* Personalised checklist */}
      {checklist && (
        <section>
          <SectionTitle>Your document checklist</SectionTitle>
          <DocChecklist storageKey={`settlein.docs.${id}`} items={checklist.items} note={checklist.note} />
        </section>
      )}

      {/* Calendar reminder */}
      {reminderDate && (
        <section className="rounded-card border border-border bg-surface p-4">
          <p className="text-sm text-ink">
            Add a reminder for <strong>{formatDate(reminderDate)}</strong> so this doesn't slip.
          </p>
          <Button variant="secondary" fullWidth className="mt-3" onClick={onDownloadIcs}>
            <IconCalendar className="h-5 w-5" /> Add reminder to calendar
          </Button>
        </section>
      )}

      {/* Boundary disclaimer */}
      <p className="rounded-card border border-border bg-bg p-3 text-center text-sm text-muted">
        SettleIn prepares this for you to send yourself. It never logs into portals, submits
        applications, or takes payments.
      </p>

      {toast && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-24 z-20 mx-auto w-fit rounded-full bg-ink px-4 py-2 text-sm font-medium text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
