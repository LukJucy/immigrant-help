/**
 * About / Trust — the required disclaimer (signposting, not legal advice),
 * how content is kept current, and privacy + full profile deletion (GDPR).
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../store/profile";
import { content } from "../lib/content";
import { Button, SectionTitle } from "../components/ui";
import { IconShield } from "../components/icons";
import { formatDateLong } from "../lib/dates";

export function About() {
  const navigate = useNavigate();
  const { profile, deleteProfile } = useProfile();
  const [confirming, setConfirming] = useState(false);

  function onDelete() {
    deleteProfile();
    // also clear task/checklist/vote state for a true wipe
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("settlein.")) localStorage.removeItem(key);
    }
    navigate("/onboard", { replace: true });
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-2">
        <IconShield className="h-7 w-7 text-primary" />
        <h1 className="text-[28px] font-bold text-ink">About &amp; trust</h1>
      </header>

      <section className="rounded-card border border-info/30 bg-blue-50 p-4">
        <SectionTitle>Signposting, not legal advice</SectionTitle>
        <p className="text-ink">
          SettleIn helps you find and prepare for official processes. It is{" "}
          <strong>not legal or immigration advice</strong>. Rules, fees and wait times change —
          always confirm the details on the official <em>gov.ie</em> and{" "}
          <em>irishimmigration.ie</em> pages we link to before you act.
        </p>
      </section>

      <section>
        <SectionTitle>How we keep content current</SectionTitle>
        <p className="text-ink">
          Every guide carries a <strong>“Verified” date</strong> and links to its official source.
          Our content was last reviewed on{" "}
          <strong>{formatDateLong(content.generatedAt)}</strong>. If you spot something out of date,
          tell us and we'll re-check it — the community keeps these guides honest.
        </p>
      </section>

      <section>
        <SectionTitle>Your privacy</SectionTitle>
        <ul className="list-disc space-y-1.5 pl-5 text-ink">
          <li>Everything you enter stays in <strong>this browser only</strong>. We have no server and no account.</li>
          <li>Sensitive details like your passport number and date of birth are never sent anywhere or logged.</li>
          <li>SettleIn never logs into portals, submits applications, or takes payments on your behalf.</li>
          <li>You can delete all of your data at any time, below.</li>
        </ul>
      </section>

      <section className="space-y-3 border-t border-border pt-5">
        {profile && (
          <Button variant="secondary" fullWidth onClick={() => navigate("/onboard")}>
            Edit my profile
          </Button>
        )}
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="w-full rounded-lg border border-danger px-4 py-3 font-semibold text-danger hover:bg-red-50"
          >
            Delete all my data
          </button>
        ) : (
          <div className="rounded-card border border-danger/40 bg-red-50 p-4">
            <p className="mb-3 text-ink">
              This permanently erases your profile and all saved progress from this browser. This
              can't be undone.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfirming(false)}
                className="rounded-lg border border-border bg-white px-4 py-3 font-semibold text-ink"
              >
                Cancel
              </button>
              <button
                onClick={onDelete}
                className="rounded-lg bg-danger px-4 py-3 font-semibold text-white"
              >
                Delete everything
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
