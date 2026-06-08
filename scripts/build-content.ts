/**
 * build-content.ts — compiles the content/ txt library into a validated
 * public/content.json that the SPA loads statically.
 *
 *   npm run build:content
 *
 * Pipeline (see docs/technical/data-model.md):
 *   1. Parse each .txt on its `FIELD:` keys (CAPS prefix) into schema shapes
 *      (pure functions in scripts/parse.ts).
 *   2. Validate every entity with Zod; FAIL THE BUILD if a guide is missing
 *      `lastVerified` (the trust gate).
 *   3. Emit JSON the frontend loads statically (no DB for the demo).
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import type { ContentBundle, TaskGuide, TimelineItem } from "../src/types/content.ts";
import {
  parseChecklists,
  parseForumSeed,
  parseGuide,
  parseTemplates,
} from "./parse.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content");
const OUT_FILE = path.join(ROOT, "public", "content.json");

/**
 * Timeline rules engine input. Source: content/04-reference/timeline-deadlines.txt
 * (a human-readable table, hand-encoded here so the engine has computable offsets).
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

// ----- Zod validation -----

const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected ISO YYYY-MM-DD");

const GuideSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.enum(["legal", "money", "transport", "health", "housing", "comms", "lifestyle"]),
  priority: z.enum(["pre_arrival", "week_1", "first_month", "first_90_days", "when_working", "each_year", "after_graduation"]),
  whoNeedsIt: z.string(),
  why: z.string(),
  steps: z.array(z.object({ order: z.number(), text: z.string().min(1) })), // may be empty for informational guides
  documents: z.array(z.string()),
  fees: z.object({ amount: z.number(), currency: z.string(), note: z.string().optional() }),
  timeframe: z.string(),
  officialLinks: z.array(z.object({ label: z.string(), url: z.string().url() })).min(1),
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

const ForumSchema = z.object({
  id: z.string(),
  taskTag: z.string(),
  title: z.string(),
  authorAlias: z.string(),
  authorNationality: z.string().optional(),
  body: z.string(),
  upvotes: z.number(),
  isSeed: z.boolean(),
  createdAt: z.string(),
  status: z.enum(["published", "pending", "removed"]),
});

// ----- Main -----

async function readFile(rel: string): Promise<string> {
  return fs.readFile(path.join(CONTENT_DIR, rel), "utf8");
}

async function main() {
  const guideDir = path.join(CONTENT_DIR, "01-task-guides");
  const guideFiles = (await fs.readdir(guideDir)).filter((f) => f.endsWith(".txt")).sort();
  const guides: TaskGuide[] = [];
  for (const file of guideFiles) {
    const id = file.replace(/\.txt$/, "");
    const raw = await fs.readFile(path.join(guideDir, file), "utf8");
    guides.push(GuideSchema.parse(parseGuide(id, raw)) as TaskGuide);
  }

  const prefillTemplates = z
    .array(TemplateSchema)
    .parse(parseTemplates(await readFile("02-prefill-templates/letter-templates.txt")));

  const docChecklists = z
    .array(ChecklistSchema)
    .parse(parseChecklists(await readFile("02-prefill-templates/document-checklists.txt")));

  const forumSeed = z
    .array(ForumSchema)
    .parse(parseForumSeed(await readFile("03-forum-seed/seed-posts.txt")));

  // Timeline rules must reference real guides.
  const guideIds = new Set(guides.map((g) => g.id));
  for (const rule of TIMELINE_RULES) {
    if (!guideIds.has(rule.taskId)) {
      throw new Error(`Timeline rule references unknown guide "${rule.taskId}".`);
    }
  }

  const bundle: ContentBundle = {
    // Deterministic stamp from the newest guide lastVerified (no Date.now()).
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
