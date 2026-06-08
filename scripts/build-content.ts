/**
 * build-content.ts — compiles the content/ txt library into a validated
 * public/content.json that the SPA loads statically.
 *
 *   npm run build:content
 *
 * Pipeline (see docs/technical/data-model.md):
 *   1. Parse each .txt on its `FIELD:` keys (CAPS prefix) into schema shapes.
 *   2. Validate every entity with Zod; FAIL THE BUILD if a guide is missing
 *      `lastVerified`.
 *   3. Emit JSON the frontend loads statically (no DB for the demo).
 *
 * Where the prose .txt files don't encode something in a machine-readable way
 * (personalisation `appliesTo`, timeline timing offsets), a small curated
 * ENRICHMENT / TIMELINE_RULES table below supplies it. Each entry cites its
 * source file so it stays maintainable.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import type {
  AppliesTo,
  Category,
  ContentBundle,
  DocChecklist,
  ForumPost,
  PrefillTemplate,
  Priority,
  TaskGuide,
  TimelineItem,
} from "../src/types/content.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content");
const OUT_FILE = path.join(ROOT, "public", "content.json");

// ----------------------------------------------------------------------------
// Curated enrichment (cites source; supplies what prose can't encode)
// ----------------------------------------------------------------------------

/** Personalisation rules — who each guide applies to. Source: guide WHO-NEEDS-IT + product-spec §3. */
const APPLIES_TO: Record<string, AppliesTo> = {
  "irp-registration": { nationalityClass: ["non_eea"], stamp: ["stamp_2"] },
  "visa-application": { nationalityClass: ["non_eea"] },
  "tax-revenue": { requiresWillWork: true },
};

/** A few sensible cross-links. Source: relatedGuides in data-model.md §1. */
const RELATED: Record<string, string[]> = {
  ppsn: ["irp-registration", "student-bank-account", "tax-revenue", "accommodation"],
  "irp-registration": ["health-gp", "ppsn", "accommodation"],
  "student-bank-account": ["ppsn", "accommodation"],
  "tax-revenue": ["ppsn"],
  "health-gp": ["irp-registration"],
};

/**
 * Timeline rules engine input. Source: content/04-reference/timeline-deadlines.txt
 * (a human-readable table, so hand-encoded here with offsets the engine can compute).
 * offsetDays is relative to the anchor; negative == before it.
 */
const TIMELINE_RULES: TimelineItem[] = [
  { taskId: "visa-application", phase: "pre_arrival", timingRule: { anchor: "courseStart", offsetDays: -56 }, hardDeadline: true, blockedBy: [], showCountdown: false },
  { taskId: "accommodation", phase: "pre_arrival", timingRule: { anchor: "arrivalDate", offsetDays: -60 }, hardDeadline: false, blockedBy: [], showCountdown: false },
  { taskId: "sim-card", phase: "week_1", timingRule: { anchor: "arrivalDate", offsetDays: 1 }, hardDeadline: false, blockedBy: [], showCountdown: false },
  { taskId: "student-bank-account", phase: "week_1", timingRule: { anchor: "arrivalDate", offsetDays: 2 }, hardDeadline: false, blockedBy: ["accommodation"], showCountdown: false },
  { taskId: "student-leap-card", phase: "week_1", timingRule: { anchor: "arrivalDate", offsetDays: 5 }, hardDeadline: false, blockedBy: [], showCountdown: false },
  { taskId: "ppsn", phase: "first_month", timingRule: { anchor: "arrivalDate", offsetDays: 21 }, hardDeadline: false, blockedBy: ["accommodation"], showCountdown: false },
  { taskId: "health-gp", phase: "first_month", timingRule: { anchor: "arrivalDate", offsetDays: 21 }, hardDeadline: false, blockedBy: [], showCountdown: false },
  { taskId: "student-life-discounts", phase: "first_month", timingRule: { anchor: "arrivalDate", offsetDays: 14 }, hardDeadline: false, blockedBy: [], showCountdown: false },
  { taskId: "driving-licence", phase: "first_month", timingRule: { anchor: "arrivalDate", offsetDays: 30 }, hardDeadline: false, blockedBy: [], showCountdown: false },
  { taskId: "irp-registration", phase: "first_90_days", timingRule: { anchor: "arrivalDate", offsetDays: 90 }, hardDeadline: true, blockedBy: ["accommodation"], showCountdown: true },
  { taskId: "tax-revenue", phase: "when_working", timingRule: { anchor: "courseStart", offsetDays: 0 }, hardDeadline: false, blockedBy: ["ppsn"], showCountdown: false },
];

// ----------------------------------------------------------------------------
// Generic .txt helpers
// ----------------------------------------------------------------------------

const MONTHS: Record<string, string> = {
  january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
};

/** "8 June 2026" / "8 June 2026 (note)" -> "2026-06-08". Throws if unparseable. */
function parseDateToISO(raw: string): string {
  const cleaned = raw.replace(/\(.*?\)/g, "").trim();
  const m = cleaned.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!m) throw new Error(`Cannot parse date: "${raw}"`);
  const day = m[1].padStart(2, "0");
  const month = MONTHS[m[2].toLowerCase()];
  if (!month) throw new Error(`Unknown month in date: "${raw}"`);
  return `${m[3]}-${month}-${day}`;
}

/** Strip the `=====` banner rule lines. */
function withoutBanners(raw: string): string[] {
  return raw.split(/\r?\n/).filter((l) => !/^=+$/.test(l.trim()));
}

/** A CAPS field header like `STEPS:` or `RENEWING YOUR IRP (each year):`. */
function fieldHeader(line: string): { label: string; rest: string } | null {
  const idx = line.indexOf(":");
  if (idx <= 0) return null;
  const before = line.slice(0, idx);
  // Lowercase is allowed only inside parentheses (e.g. "(each year)").
  const labelCore = before.replace(/\(.*?\)/g, "").trim();
  if (labelCore.length === 0 || labelCore.length > 45) return null;
  if (!/^[A-Z0-9][A-Z0-9 /&'’.,\-]*$/.test(labelCore)) return null;
  return { label: before.trim().toUpperCase(), rest: line.slice(idx + 1).trim() };
}

/** Split a guide body into ordered { label, value } blocks keyed on CAPS headers. */
function parseFields(lines: string[]): Array<{ label: string; value: string }> {
  const blocks: Array<{ label: string; value: string[] }> = [];
  let current: { label: string; value: string[] } | null = null;
  for (const line of lines) {
    const hdr = fieldHeader(line);
    if (hdr) {
      current = { label: hdr.label, value: hdr.rest ? [hdr.rest] : [] };
      blocks.push(current);
    } else if (current) {
      current.value.push(line);
    }
  }
  return blocks.map((b) => ({ label: b.label, value: b.value.join("\n").trim() }));
}

/** Parse a block into list items, honouring `N.`, `-`, and `[ ]` bullets + continuations. */
function parseListItems(block: string): string[] {
  const items: string[] = [];
  let buf = "";
  const flush = () => {
    const t = buf.replace(/\s+/g, " ").trim();
    if (t) items.push(t);
    buf = "";
  };
  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const bullet = line.match(/^(\d+\.|[-•*]|\[[ xX]\])\s+(.*)$/);
    if (bullet) {
      flush();
      buf = bullet[2];
    } else if (buf) {
      buf += " " + line;
    } else {
      buf = line;
    }
  }
  flush();
  return items;
}

function normaliseCategory(raw: string): Category {
  const first = raw.split("/")[0].trim().toLowerCase();
  const map: Record<string, Category> = {
    legal: "legal", money: "money", transport: "transport", health: "health",
    housing: "housing", comms: "comms", communications: "comms", lifestyle: "lifestyle",
  };
  return map[first] ?? "legal";
}

function normalisePriority(raw: string): Priority {
  const s = raw.toLowerCase();
  if (/after grad|stamp 1g/.test(s)) return "after_graduation";
  if (/each year|renew|annual/.test(s)) return "each_year";
  if (/90 ?days|first 90/.test(s)) return "first_90_days";
  if (/when working|paid job|first payday|tax/.test(s)) return "when_working";
  if (/week ?1|day 1|first days|first week/.test(s)) return "week_1";
  if (/first month/.test(s)) return "first_month";
  if (/pre.?arrival|before you fly|before arrival|before flying/.test(s)) return "pre_arrival";
  return "first_month";
}

function parseFees(raw: string): { amount: number; currency: string; note?: string } {
  const note = raw.replace(/\s+/g, " ").trim();
  if (/free/i.test(note) && !/€|eur|\d/.test(note)) return { amount: 0, currency: "EUR", note };
  const m = note.match(/€\s?([\d,]+)|eur\s?([\d,]+)|([\d,]+)/i);
  const amount = m ? Number((m[1] ?? m[2] ?? m[3]).replace(/,/g, "")) : 0;
  return { amount, currency: "EUR", note };
}

function collectVerifyFlags(raw: string): string[] {
  const flags = new Set<string>();
  for (const m of raw.matchAll(/\[VERIFY([^\]]*)\]/gi)) {
    flags.add(("VERIFY" + (m[1] ?? "")).trim());
  }
  return [...flags];
}

function parseLinks(block: string): Array<{ label: string; url: string }> {
  const urls = parseListItems(block).flatMap((item) => {
    const um = item.match(/https?:\/\/\S+/);
    return um ? [um[0].replace(/[.,)]+$/, "")] : [];
  });
  // Also catch a single inline URL with no bullet.
  if (urls.length === 0) {
    const um = block.match(/https?:\/\/\S+/);
    if (um) urls.push(um[0].replace(/[.,)]+$/, ""));
  }
  return urls.map((url) => ({ label: hostLabel(url), url }));
}

function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const KNOWN_GUIDE_LABELS = new Set([
  "TASK", "CATEGORY", "PRIORITY", "WHO NEEDS IT", "WHY", "STEPS", "DOCUMENTS",
  "FEES", "TIMEFRAME", "OFFICIAL LINK", "OFFICIAL LINKS", "BOOKING PORTAL",
  "TIPS", "LAST VERIFIED",
]);

// ----------------------------------------------------------------------------
// Guide parser
// ----------------------------------------------------------------------------

function parseGuide(id: string, raw: string): TaskGuide {
  const lines = withoutBanners(raw);
  const titleLine = lines.find((l) => /^TASK GUIDE:/i.test(l.trim()));
  const title = titleLine ? titleLine.replace(/^TASK GUIDE:/i, "").trim() : id;

  const fields = parseFields(lines);
  const get = (label: string) =>
    fields.find((f) => f.label === label)?.value ?? "";

  const lastVerifiedRaw = get("LAST VERIFIED");
  if (!lastVerifiedRaw) {
    throw new Error(`Guide "${id}" is missing LAST VERIFIED — build aborted.`);
  }

  const extraSections = fields
    .filter((f) => !KNOWN_GUIDE_LABELS.has(f.label) && f.label !== "TASK GUIDE")
    .map((f) => ({ label: f.label, text: f.value.replace(/\s+\n/g, "\n").trim() }))
    .filter((s) => s.text.length > 0);

  const officialBlock = get("OFFICIAL LINKS") || get("OFFICIAL LINK");

  return {
    id,
    title,
    category: normaliseCategory(get("CATEGORY") || "legal"),
    priority: normalisePriority(get("PRIORITY")),
    whoNeedsIt: get("WHO NEEDS IT").replace(/\s+/g, " ").trim(),
    why: get("WHY").replace(/\s+/g, " ").trim(),
    steps: parseListItems(get("STEPS")).map((text, i) => ({ order: i + 1, text })),
    documents: parseListItems(get("DOCUMENTS")),
    fees: parseFees(get("FEES")),
    timeframe: get("TIMEFRAME").replace(/\s*\n\s*/g, " ").replace(/\s+/g, " ").trim(),
    officialLinks: parseLinks(officialBlock),
    bookingPortal: (get("BOOKING PORTAL").match(/https?:\/\/\S+/) ?? [])[0]?.replace(/[.,)]+$/, ""),
    tips: parseListItems(get("TIPS")),
    extraSections,
    relatedGuides: RELATED[id] ?? [],
    appliesTo: APPLIES_TO[id],
    lastVerified: parseDateToISO(lastVerifiedRaw),
    verifyFlags: collectVerifyFlags(raw),
  };
}

// ----------------------------------------------------------------------------
// Prefill template parser (letter-templates.txt)
// ----------------------------------------------------------------------------

const TEMPLATE_IDS: Record<number, { id: string; relatedGuide: string; type: "email" | "letter" }> = {
  1: { id: "ppsn-college-letter-request", relatedGuide: "ppsn", type: "email" },
  2: { id: "ppsn-reason-letter", relatedGuide: "ppsn", type: "letter" },
  3: { id: "gp-registration-enquiry", relatedGuide: "health-gp", type: "email" },
  4: { id: "accommodation-viewing-enquiry", relatedGuide: "accommodation", type: "email" },
};

function parseTemplates(raw: string): PrefillTemplate[] {
  const out: PrefillTemplate[] = [];
  // Split on the "TEMPLATE N:" headers.
  const parts = raw.split(/^TEMPLATE\s+(\d+):/gim);
  // parts: [preamble, "1", body1, "2", body2, ...]
  for (let i = 1; i < parts.length; i += 2) {
    const num = Number(parts[i]);
    const meta = TEMPLATE_IDS[num];
    if (!meta) continue;
    let block = parts[i + 1] ?? "";
    // Trim the trailing banner / LAST VERIFIED footer from the final template.
    block = block.replace(/LAST VERIFIED:.*$/is, "").replace(/^=+$/gm, "").trim();

    const lines = block.split(/\r?\n/);
    // First line is the human title in "(...)" form; skip a leading "(...)" line.
    const titleLine = lines.find((l) => l.trim() && !l.trim().startsWith("("));
    const title = (titleLine ?? meta.id).replace(/\s+/g, " ").trim();

    const subjMatch = block.match(/^Subject:\s*(.+)$/im);
    const subject = subjMatch ? subjMatch[1].trim() : undefined;

    // Body = everything after the Subject line (or whole block if no subject),
    // dropping the leading "(from … to …)" descriptor line.
    let body = block;
    if (subjMatch) {
      body = block.slice(block.indexOf(subjMatch[0]) + subjMatch[0].length);
    } else {
      // drop first descriptor line
      body = lines.slice(1).join("\n");
    }
    body = body.replace(/^\s*\n/, "").trimEnd();

    const placeholders = [...new Set([...block.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]))];

    out.push({
      id: meta.id,
      type: meta.type,
      title,
      subject,
      body: body.trim(),
      placeholders,
      relatedGuide: meta.relatedGuide,
    });
  }
  return out;
}

// ----------------------------------------------------------------------------
// Document checklist parser (document-checklists.txt)
// ----------------------------------------------------------------------------

/** Map a CAPS section header in document-checklists.txt to a guide id. */
function checklistHeaderToTaskId(header: string): string | null {
  const h = header.toLowerCase();
  if (h.includes("visa")) return "visa-application";
  if (h.includes("ppsn")) return "ppsn";
  if (h.includes("irp")) return "irp-registration";
  if (h.includes("bank")) return "student-bank-account";
  if (h.includes("leap")) return "student-leap-card";
  if (h.includes("gp")) return "health-gp";
  if (h.includes("tax") || h.includes("revenue")) return "tax-revenue";
  if (h.includes("sim")) return "sim-card";
  return null;
}

function parseChecklists(raw: string): DocChecklist[] {
  const lines = withoutBanners(raw);
  const out: DocChecklist[] = [];
  let current: { title: string; taskId: string; buf: string[] } | null = null;
  const flush = () => {
    if (!current) return;
    const items = parseListItems(current.buf.join("\n"));
    const noteLine = current.buf.find((l) => /^\s*NOTE:/i.test(l));
    out.push({
      taskId: current.taskId,
      title: current.title,
      items: items.filter((i) => !/^NOTE:/i.test(i)),
      note: noteLine ? noteLine.replace(/^\s*NOTE:\s*/i, "").trim() : undefined,
    });
    current = null;
  };
  for (const line of lines) {
    // Section headers have no trailing colon and are CAPS (lowercase allowed
    // only inside parentheses, e.g. "TAX / REVENUE (register a job)").
    const bare = line.trim().replace(/\(.*?\)/g, "").trim();
    const isSectionHeader =
      /^[A-Z][A-Z0-9 /&'’,.\-]+$/.test(bare) &&
      bare.length > 4 &&
      !/^\[/.test(line.trim()) &&
      !/^(PURPOSE|FIELDS)/.test(bare);
    if (isSectionHeader) {
      const taskId = checklistHeaderToTaskId(line.trim());
      if (taskId) {
        flush();
        current = { title: line.trim(), taskId, buf: [] };
        continue;
      }
    }
    if (current) current.buf.push(line);
  }
  flush();
  return out;
}

// ----------------------------------------------------------------------------
// Forum seed parser (seed-posts.txt)
// ----------------------------------------------------------------------------

function parseForumSeed(raw: string): ForumPost[] {
  const out: ForumPost[] = [];
  const blocks = raw.split(/-{10,}/g);
  for (const block of blocks) {
    const idM = block.match(/^\s*id:\s*(\S+)/im);
    if (!idM) continue;
    const field = (name: string) =>
      (block.match(new RegExp(`^\\s*${name}:\\s*(.+)$`, "im")) ?? [])[1]?.trim();
    const bodyM = block.match(/^\s*body:\s*([\s\S]+?)(?=\n\s*\n|$)/im);
    const body = bodyM ? bodyM[1].replace(/\s+/g, " ").trim() : "";
    out.push({
      id: `post_${idM[1].padStart(3, "0")}`,
      taskTag: field("task_tag") ?? "general",
      title: field("title") ?? "Untitled",
      authorAlias: field("author") ?? "anon",
      authorNationality: field("nationality"),
      body,
      upvotes: Number(field("upvotes") ?? 0),
      isSeed: true,
      createdAt: "2026-06-08T00:00:00Z",
      status: "published",
    });
  }
  return out;
}

// ----------------------------------------------------------------------------
// Zod validation
// ----------------------------------------------------------------------------

const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected ISO YYYY-MM-DD");

const GuideSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.enum(["legal", "money", "transport", "health", "housing", "comms", "lifestyle"]),
  priority: z.enum(["pre_arrival", "week_1", "first_month", "first_90_days", "when_working", "each_year", "after_graduation"]),
  whoNeedsIt: z.string(),
  why: z.string(),
  steps: z.array(z.object({ order: z.number(), text: z.string().min(1) })),
  documents: z.array(z.string()),
  fees: z.object({ amount: z.number(), currency: z.string(), note: z.string().optional() }),
  timeframe: z.string(),
  officialLinks: z.array(z.object({ label: z.string(), url: z.string().url() })),
  bookingPortal: z.string().url().optional(),
  tips: z.array(z.string()),
  extraSections: z.array(z.object({ label: z.string(), text: z.string() })),
  relatedGuides: z.array(z.string()),
  appliesTo: z.any().optional(),
  lastVerified: ISO_DATE, // <-- the trust gate
  verifyFlags: z.array(z.string()),
});

const TemplateSchema = z.object({
  id: z.string(),
  type: z.enum(["email", "letter"]),
  title: z.string(),
  subject: z.string().optional(),
  body: z.string().min(1),
  placeholders: z.array(z.string()),
  relatedGuide: z.string(),
});

const ChecklistSchema = z.object({
  taskId: z.string(),
  title: z.string(),
  items: z.array(z.string()).min(1),
  note: z.string().optional(),
});

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------

async function readFile(rel: string): Promise<string> {
  return fs.readFile(path.join(CONTENT_DIR, rel), "utf8");
}

async function main() {
  // Guides
  const guideDir = path.join(CONTENT_DIR, "01-task-guides");
  const guideFiles = (await fs.readdir(guideDir)).filter((f) => f.endsWith(".txt"));
  const guides: TaskGuide[] = [];
  for (const file of guideFiles.sort()) {
    const id = file.replace(/\.txt$/, "");
    const raw = await fs.readFile(path.join(guideDir, file), "utf8");
    const guide = GuideSchema.parse(parseGuide(id, raw)) as TaskGuide;
    guides.push(guide);
  }

  const prefillTemplates = z
    .array(TemplateSchema)
    .parse(parseTemplates(await readFile("02-prefill-templates/letter-templates.txt"))) as PrefillTemplate[];

  const docChecklists = z
    .array(ChecklistSchema)
    .parse(parseChecklists(await readFile("02-prefill-templates/document-checklists.txt"))) as DocChecklist[];

  const forumSeed = parseForumSeed(await readFile("03-forum-seed/seed-posts.txt"));

  // Validate timeline rules reference real guides.
  const guideIds = new Set(guides.map((g) => g.id));
  for (const rule of TIMELINE_RULES) {
    if (!guideIds.has(rule.taskId)) {
      throw new Error(`Timeline rule references unknown guide "${rule.taskId}".`);
    }
  }

  const bundle: ContentBundle = {
    // Deterministic: stamped from the guides' newest lastVerified, not Date.now().
    generatedAt: guides.map((g) => g.lastVerified).sort().at(-1) ?? "1970-01-01",
    guides,
    timelineRules: TIMELINE_RULES,
    prefillTemplates,
    docChecklists,
    forumSeed,
    glossary: [],
    curatedLinks: [],
    contacts: [],
  };

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(bundle, null, 2) + "\n", "utf8");

  console.log(
    `✓ content.json written: ${guides.length} guides, ${prefillTemplates.length} templates, ` +
      `${docChecklists.length} checklists, ${forumSeed.length} forum posts, ` +
      `${TIMELINE_RULES.length} timeline rules.`,
  );
}

main().catch((err) => {
  console.error("✗ build-content failed:", err.message ?? err);
  process.exit(1);
});
