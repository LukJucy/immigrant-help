/**
 * Assistant engine — "Ask SettleIn".
 *
 * Deterministic, client-side retrieval over the guides + official sources.
 * Given a free-text question it returns a short, plain-language answer plus
 * links: internal links to the relevant task guide(s), the official source(s),
 * and (when relevant) the forum. Personalised by profile (e.g. EU students are
 * told they don't need an IRP; deadline questions return the live countdown).
 *
 * This is the retrieval half of the hybrid: a future Claude-API provider can
 * implement the same AssistantProvider interface (see assistant/provider.ts)
 * and reuse this as its grounding/tool layer.
 */
import type { ContentBundle, TaskGuide, UserProfile } from "../types/content";
import { buildTimeline } from "./timeline";
import { guideApplies } from "../lib/personalise";
import { formatDate } from "../lib/dates";

export interface ReplyLink {
  kind: "guide" | "official" | "route" | "forum";
  label: string;
  to?: string; // internal route
  href?: string; // external url
}

export interface AssistantReply {
  text: string;
  links: ReplyLink[];
}

export interface AssistantContext {
  content: ContentBundle;
  profile: UserProfile | null;
  today: string;
}

/** Keyword → guide intent. Cheap synonyms so plain questions hit the right guide. */
const INTENTS: Array<{ id: string; terms: string[] }> = [
  { id: "ppsn", terms: ["ppsn", "pps number", "personal public service", "tax number"] },
  { id: "irp-registration", terms: ["irp", "residence permit", "stamp 2", "stamp2", "register", "registration", "burgh quay", "isd", "immigration permission", "90 days", "90-day"] },
  { id: "visa-application", terms: ["visa", "avats", "entry visa", "d visa", "study visa"] },
  { id: "student-bank-account", terms: ["bank", "account", "iban", "aib", "boi", "revolut", "n26", "money"] },
  { id: "student-leap-card", terms: ["leap", "leap card", "bus", "luas", "dart", "transport", "travel", "fares"] },
  { id: "sim-card", terms: ["sim", "phone", "mobile", "number", "esim", "data", "three", "vodafone", "eir", "gomo", "48"] },
  { id: "health-gp", terms: ["gp", "doctor", "health", "insurance", "medical", "sick", "clinic"] },
  { id: "tax-revenue", terms: ["tax", "revenue", "emergency tax", "payslip", "paye", "myaccount", "job", "work", "salary"] },
  { id: "accommodation", terms: ["accommodation", "rent", "house", "housing", "flat", "apartment", "landlord", "deposit", "daft", "scam"] },
  { id: "driving-licence", terms: ["driving", "licence", "license", "car", "drive"] },
  { id: "student-life-discounts", terms: ["discount", "isic", "student card", "societies", "freshers", "things to do"] },
];

const STOP = new Set([
  "the", "a", "an", "i", "do", "need", "to", "how", "what", "is", "my", "for", "in", "of", "and",
  "can", "get", "when", "where", "should", "with", "on", "it", "me", "you", "are", "be", "will",
]);

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOP.has(t));
}

/** Score a guide against the query: intent hits dominate, then text overlap. */
function scoreGuide(guide: TaskGuide, query: string, tokens: string[]): number {
  const q = query.toLowerCase();
  let score = 0;

  const intent = INTENTS.find((i) => i.id === guide.id);
  if (intent) {
    for (const term of intent.terms) {
      if (q.includes(term)) score += term.includes(" ") ? 8 : 5;
    }
  }

  const haystack = [guide.title, guide.whoNeedsIt, guide.why, guide.category, ...guide.tips]
    .join(" ")
    .toLowerCase();
  for (const tok of tokens) {
    if (haystack.includes(tok)) score += 1;
    if (guide.title.toLowerCase().includes(tok)) score += 2;
  }
  return score;
}

function guideLinks(guide: TaskGuide): ReplyLink[] {
  const links: ReplyLink[] = [
    { kind: "guide", label: `Open the ${guide.title} guide`, to: `/task/${guide.id}` },
  ];
  const src = guide.officialLinks[0];
  if (src) links.push({ kind: "official", label: `Official: ${src.label}`, href: src.url });
  return links;
}

const DEADLINE_RE = /(deadline|how long|when.*(register|irp)|90 ?days|days left|by when|overdue)/i;
const ELIGIBILITY_RE = /(do i need|am i required|necessary|have to)/i;

/** The core, pure retrieval function — easy to unit-test. */
export function answerQuery(query: string, ctx: AssistantContext): AssistantReply {
  const { content, profile, today } = ctx;
  const tokens = tokenize(query);

  // Guides visible to this user (personalisation).
  const visible = content.guides.filter((g) => !profile || guideApplies(g.appliesTo, profile));

  // 1. Deadline / IRP-timing questions → live countdown if we have a profile.
  if (DEADLINE_RE.test(query) && profile) {
    const plan = buildTimeline(profile, content.timelineRules, content.guides, today);
    if (plan.irp) {
      const { daysLeft, deadline, bookBy, overdue } = plan.irp;
      return {
        text: overdue
          ? `Your 90-day IRP registration window has passed (it was ${formatDate(deadline)}). Don't panic — book the earliest appointment you can; ISD won't cancel your permission while you wait.`
          : `You have ${daysLeft} days left to register your IRP — the deadline is ${formatDate(deadline)} (90 days after you arrive). Because appointment waits can be 8–10 weeks, aim to book by ${formatDate(bookBy)}.`,
        links: [
          ...guideLinks(content.guides.find((g) => g.id === "irp-registration")!),
          { kind: "route", label: "See your full timeline", to: "/timeline" },
          { kind: "forum", label: "Read how students got their IRP slot", to: "/forum" },
        ],
      };
    }
  }

  // 2. "Do I need…" eligibility questions for IRP/visa, personalised.
  if (profile && ELIGIBILITY_RE.test(query) && /(irp|visa|residence permit|stamp)/i.test(query)) {
    if (profile.core.nationalityClass === "eu_eea_swiss") {
      return {
        text: "Good news — as an EU/EEA/Swiss student you don't need a visa or an IRP to study in Ireland. You can skip those steps entirely.",
        links: [{ kind: "route", label: "See the steps that do apply to you", to: "/timeline" }],
      };
    }
    return {
      text: "Yes — as a non-EU/EEA student staying more than 90 days you must register for an IRP (Irish Residence Permit, usually Stamp 2) within 90 days of arriving.",
      links: guideLinks(content.guides.find((g) => g.id === "irp-registration")!),
    };
  }

  // 3. General retrieval: best-matching guide(s).
  const ranked = visible
    .map((g) => ({ g, score: scoreGuide(g, query, tokens) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) {
    return {
      text: "I'm not sure which step that maps to, but I can point you to the right place. Try a keyword like “PPSN”, “bank”, “SIM”, “tax”, or “IRP” — or browse your timeline.",
      links: [
        { kind: "route", label: "Browse your timeline", to: "/timeline" },
        { kind: "route", label: "Search all guides", to: "/search" },
      ],
    };
  }

  const top = ranked[0].g;
  const links = guideLinks(top);

  // Add a second guide if it's clearly relevant too.
  if (ranked[1] && ranked[1].score >= ranked[0].score - 2) {
    links.push({ kind: "guide", label: `Also: ${ranked[1].g.title}`, to: `/task/${ranked[1].g.id}` });
  }

  const feeBit =
    top.fees.amount === 0 ? "It's free. " : `It costs €${top.fees.amount}. `;
  return {
    text: `Here's what you need for ${top.title.replace(/\s*\(.*?\)\s*/, " ").trim()}. ${feeBit}${oneLine(top.why)} Open the guide for the exact steps, documents, and official links.`,
    links,
  };
}

function oneLine(text: string): string {
  const first = text.split(/(?<=[.!?])\s/)[0] ?? text;
  return first.length > 160 ? first.slice(0, 158) + "…" : first;
}

/** Suggested starter questions shown when the chat is empty. */
export const STARTER_QUESTIONS = [
  "Do I need an IRP?",
  "When is my IRP deadline?",
  "How do I get a PPSN?",
  "What's the cheapest SIM?",
  "How do I avoid emergency tax?",
];
