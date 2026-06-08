/**
 * Task guide detail — how to do one task. Trust line up top, why/steps/docs/
 * facts/tips, and CTAs to prefill + experiences. Verified facts + official links.
 */
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { checklistForGuide, getGuide, postsForTag, templatesForGuide } from "../lib/content";
import { TrustLine } from "../components/TrustLine";
import { DocChecklist } from "../components/DocChecklist";
import { Button, Chip, FactChip, SectionTitle, CATEGORY_META } from "../components/ui";
import { IconChevronLeft, IconExternal } from "../components/icons";

export function TaskGuideScreen() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const guide = getGuide(id);
  const [tipsOpen, setTipsOpen] = useState(false);

  if (!guide) return <Navigate to="/timeline" replace />;

  const cat = CATEGORY_META[guide.category];
  const template = templatesForGuide(guide.id)[0];
  const checklist = checklistForGuide(guide.id);
  const posts = postsForTag(tagForGuide(guide.id));
  const feeLabel = guide.fees.amount === 0 ? "Free" : `€${guide.fees.amount}`;

  return (
    <article className="space-y-5">
      <header className="space-y-2">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
        >
          <IconChevronLeft className="h-5 w-5" /> Back
        </button>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[26px] font-bold leading-tight text-ink">{guide.title}</h1>
          <Chip tone="primary" className="shrink-0">
            <span aria-hidden>{cat.icon}</span> {cat.label}
          </Chip>
        </div>
        <TrustLine lastVerified={guide.lastVerified} source={guide.officialLinks[0]} />
      </header>

      {guide.whoNeedsIt && (
        <p className="rounded-card border border-border bg-primary-soft/30 p-3 text-sm text-ink">
          <strong>Who needs this:</strong> {guide.whoNeedsIt}
        </p>
      )}

      <section>
        <SectionTitle>Why it matters</SectionTitle>
        <p className="text-ink">{guide.why}</p>
      </section>

      {/* Fact chips */}
      <div className="flex flex-wrap gap-2">
        <FactChip label="Fee" value={feeLabel} />
        <FactChip label="Category" value={cat.label} />
        {guide.timeframe && <FactChip label="Timeframe" value={shortTimeframe(guide.timeframe)} />}
      </div>

      {guide.steps.length > 0 && (
      <section>
        <SectionTitle>Steps</SectionTitle>
        <ol className="space-y-3">
          {guide.steps.map((step) => (
            <li key={step.order} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                {step.order}
              </span>
              <span className="text-ink">{step.text}</span>
            </li>
          ))}
        </ol>
      </section>
      )}

      {guide.documents.length > 0 && (
        <section>
          <SectionTitle>Documents to bring</SectionTitle>
          <DocChecklist storageKey={`settlein.docs.${guide.id}`} items={checklist?.items ?? guide.documents} note={checklist?.note} />
        </section>
      )}

      {guide.tips.length > 0 && (
        <section>
          <button
            onClick={() => setTipsOpen((o) => !o)}
            aria-expanded={tipsOpen}
            className="flex w-full items-center justify-between rounded-card border border-border bg-surface px-4 py-3 text-left font-semibold text-ink"
          >
            Tips ({guide.tips.length})
            <span className="text-muted">{tipsOpen ? "▾" : "▸"}</span>
          </button>
          {tipsOpen && (
            <ul className="mt-2 space-y-2 px-1">
              {guide.tips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-ink">
                  <span aria-hidden className="text-primary">
                    •
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Extra detail sections preserved from the source (eligibility, etc.) */}
      {guide.extraSections.map((sec) => (
        <section key={sec.label}>
          <h3 className="mb-1 text-base font-semibold text-ink">{titleCase(sec.label)}</h3>
          <p className="whitespace-pre-line text-sm text-ink">{sec.text}</p>
        </section>
      ))}

      {/* Official links */}
      <section>
        <SectionTitle>Official sources</SectionTitle>
        <ul className="space-y-2">
          {guide.officialLinks.map((link) => (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-primary underline underline-offset-2"
              >
                {link.label}
                <IconExternal className="h-4 w-4" />
              </a>
            </li>
          ))}
          {guide.bookingPortal && (
            <li>
              <a
                href={guide.bookingPortal}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-primary underline underline-offset-2"
              >
                Booking portal
                <IconExternal className="h-4 w-4" />
              </a>
            </li>
          )}
        </ul>
      </section>

      {/* CTAs */}
      <div className="space-y-3 border-t border-border pt-4">
        {template && (
          <Button fullWidth onClick={() => navigate(`/prefill/${guide.id}`)}>
            Prefill this ({template.type === "email" ? "letter" : "document"})
          </Button>
        )}
        {posts.length > 0 && (
          <Link
            to="/forum"
            className="block rounded-lg border border-primary px-4 py-3 text-center font-semibold text-primary hover:bg-primary-soft"
          >
            See {posts.length} experience{posts.length > 1 ? "s" : ""} from students
          </Link>
        )}
        <p className="text-center text-sm text-muted">
          Rules change. Spotted something out of date?{" "}
          <Link to="/about" className="font-medium text-primary underline underline-offset-2">
            Report it
          </Link>
        </p>
      </div>
    </article>
  );
}

/** Guide ids map to short forum tags used in the seed data. */
function tagForGuide(id: string): string {
  const map: Record<string, string> = {
    "irp-registration": "irp",
    ppsn: "ppsn",
    "student-bank-account": "bank",
    "student-leap-card": "leap",
    "sim-card": "sim",
    "tax-revenue": "tax",
    accommodation: "accommodation",
    "health-gp": "health",
  };
  return map[id] ?? "general";
}

/** "COMMON REASONS FOR REFUSAL" -> "Common reasons for refusal". */
function titleCase(label: string): string {
  const lower = label.toLowerCase().replace(/\s+/g, " ").trim();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function shortTimeframe(t: string): string {
  const m = t.match(/within \d+ days/i);
  return m ? m[0] : t.length > 28 ? t.slice(0, 26) + "…" : t;
}
