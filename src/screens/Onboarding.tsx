/**
 * Onboarding wizard — collects the 6 core fields (one idea per screen) that
 * personalise everything downstream. Calm tone, "why we ask" micro-help.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../store/profile";
import { Button } from "../components/ui";
import { IconChevronLeft } from "../components/icons";
import {
  NATIONALITIES,
  PRIYA_CORE,
  PRIYA_EXTENDED,
  STAMPS,
  UNIVERSITIES,
} from "../lib/options";
import type { NationalityClass, ProfileCore, VisaStamp } from "../types/content";

interface Draft extends ProfileCore {
  willWork: boolean;
}

const initialDraft: Draft = {
  fullName: "",
  nationality: "",
  nationalityClass: "non_eea",
  visaStamp: "stamp_2",
  university: "",
  courseStart: "",
  arrivalDate: "",
  willWork: true,
};

export function Onboarding() {
  const navigate = useNavigate();
  const { saveProfile } = useProfile();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(initialDraft);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  // Steps available depend on nationality class (EU users skip the stamp question).
  const isEu = draft.nationalityClass === "eu_eea_swiss";

  const steps = useMemo(
    () => buildSteps(draft, set, isEu),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft, isEu],
  );

  const current = steps[step];
  const isLast = step === steps.length - 1;

  function finish(finalDraft: Draft) {
    const { willWork, ...core } = finalDraft;
    const extended = core.nationality === PRIYA_CORE.nationality && core.fullName === PRIYA_CORE.fullName
      ? { ...PRIYA_EXTENDED, willWork }
      : { willWork };
    saveProfile(core, extended);
    navigate("/timeline");
  }

  function next() {
    if (isLast) finish(draft);
    else setStep((s) => Math.min(s + 1, steps.length - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function useDemoProfile() {
    const demoDraft: Draft = { ...PRIYA_CORE, willWork: PRIYA_EXTENDED.willWork ?? true };
    setDraft(demoDraft);
    finish(demoDraft);
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-app flex-col px-4 py-6">
      {/* Progress + skip */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {step > 0 && (
            <button onClick={back} aria-label="Back" className="text-muted hover:text-ink">
              <IconChevronLeft className="h-6 w-6" />
            </button>
          )}
          <div className="flex gap-1.5" aria-hidden>
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${i <= step ? "bg-primary" : "bg-border"}`}
              />
            ))}
          </div>
        </div>
        <span className="text-sm text-muted">
          Step {step + 1} of {steps.length}
        </span>
      </div>

      {/* Question */}
      <div className="flex-1">
        <h1 className="mb-1 text-[28px] font-bold leading-tight text-ink">{current.question}</h1>
        {current.help && <p className="mb-6 text-base text-muted">{current.help}</p>}
        <div className="mt-6">{current.field}</div>
      </div>

      {/* Actions */}
      <div className="mt-8 space-y-3">
        <Button onClick={next} fullWidth disabled={!current.valid}>
          {isLast ? "See my plan" : "Next"}
        </Button>
        {step === 0 && (
          <button
            onClick={useDemoProfile}
            className="w-full text-center text-sm font-medium text-primary underline underline-offset-2"
          >
            Or explore with Priya's demo profile →
          </button>
        )}
      </div>
    </div>
  );
}

// ----- Step definitions -----

interface Step {
  question: string;
  help?: string;
  field: React.ReactNode;
  valid: boolean;
}

function buildSteps(draft: Draft, set: (p: Partial<Draft>) => void, isEu: boolean): Step[] {
  const inputClass =
    "w-full rounded-lg border border-border bg-white px-4 py-3 text-base focus:border-primary";

  const nameStep: Step = {
    question: "What should we call you?",
    help: "We use your name on the letters SettleIn drafts for you.",
    valid: draft.fullName.trim().length > 1,
    field: (
      <label className="block">
        <span className="sr-only">Full name</span>
        <input
          className={inputClass}
          type="text"
          autoFocus
          placeholder="e.g. Priya Sharma"
          value={draft.fullName}
          onChange={(e) => set({ fullName: e.target.value })}
        />
      </label>
    ),
  };

  const nationalityStep: Step = {
    question: "Where are you from?",
    help: "This decides whether you need a visa and an IRP.",
    valid: draft.nationality !== "",
    field: (
      <label className="block">
        <span className="sr-only">Nationality</span>
        <select
          className={inputClass}
          value={draft.nationality}
          onChange={(e) => {
            const opt = NATIONALITIES.find((n) => n.code === e.target.value);
            const klass: NationalityClass = opt?.klass ?? "non_eea";
            set({
              nationality: e.target.value,
              nationalityClass: klass,
              visaStamp: klass === "eu_eea_swiss" ? "eu_none" : "stamp_2",
            });
          }}
        >
          <option value="" disabled>
            Select your nationality…
          </option>
          {NATIONALITIES.map((n) => (
            <option key={n.code} value={n.code}>
              {n.label}
            </option>
          ))}
        </select>
      </label>
    ),
  };

  const stampStep: Step = {
    question: "What's your study status?",
    help: "This sets which legal steps apply to you.",
    valid: true,
    field: (
      <fieldset className="space-y-3">
        <legend className="sr-only">Study status</legend>
        {STAMPS.filter((s) => s.forClass === draft.nationalityClass).map((s) => (
          <label
            key={s.value}
            className={`flex cursor-pointer flex-col gap-0.5 rounded-card border p-4 ${
              draft.visaStamp === s.value ? "border-primary bg-primary-soft" : "border-border bg-white"
            }`}
          >
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="stamp"
                className="accent-primary"
                checked={draft.visaStamp === s.value}
                onChange={() => set({ visaStamp: s.value as VisaStamp })}
              />
              <span className="font-semibold text-ink">{s.label}</span>
            </span>
            <span className="pl-6 text-sm text-muted">{s.help}</span>
          </label>
        ))}
      </fieldset>
    ),
  };

  const universityStep: Step = {
    question: "Which university?",
    help: "We tailor college letters and campus tips to your university.",
    valid: draft.university !== "",
    field: (
      <label className="block">
        <span className="sr-only">University</span>
        <select
          className={inputClass}
          value={draft.university}
          onChange={(e) => set({ university: e.target.value })}
        >
          <option value="" disabled>
            Select your university…
          </option>
          {UNIVERSITIES.map((u) => (
            <option key={u.slug} value={u.slug}>
              {u.label}
            </option>
          ))}
        </select>
      </label>
    ),
  };

  const arrivalStep: Step = {
    question: "When do you arrive in Ireland?",
    help: "This starts your 90-day IRP clock and orders your tasks.",
    valid: draft.arrivalDate !== "",
    field: (
      <label className="block">
        <span className="sr-only">Arrival date</span>
        <input
          className={inputClass}
          type="date"
          value={draft.arrivalDate}
          onChange={(e) => set({ arrivalDate: e.target.value })}
        />
      </label>
    ),
  };

  const courseStep: Step = {
    question: "When does your course start?",
    help: "We use this to time pre-arrival tasks like your visa.",
    valid: draft.courseStart !== "",
    field: (
      <label className="block">
        <span className="sr-only">Course start date</span>
        <input
          className={inputClass}
          type="date"
          value={draft.courseStart}
          onChange={(e) => set({ courseStart: e.target.value })}
        />
      </label>
    ),
  };

  const workStep: Step = {
    question: "Will you work part-time while studying?",
    help: "If yes, we'll add tax and PPSN steps so you avoid emergency tax.",
    valid: true,
    field: (
      <div className="grid grid-cols-2 gap-3">
        {[
          { v: true, label: "Yes, I plan to" },
          { v: false, label: "No, just studying" },
        ].map((o) => (
          <button
            key={String(o.v)}
            onClick={() => set({ willWork: o.v })}
            className={`rounded-card border p-4 text-center font-semibold ${
              draft.willWork === o.v
                ? "border-primary bg-primary-soft text-primary"
                : "border-border bg-white text-ink"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    ),
  };

  return [
    nameStep,
    nationalityStep,
    ...(isEu ? [] : [stampStep]),
    universityStep,
    arrivalStep,
    courseStep,
    workStep,
  ];
}
