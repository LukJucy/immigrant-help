/**
 * parse.ts — pure parsing functions for the content/ txt library.
 * No filesystem access here so the parser can be unit-tested directly
 * (see tests/build-content.test.ts). build-content.ts does the IO,
 * Zod validation, and writes public/content.json.
 *
 * Where prose can't encode something machine-readably (personalisation
 * `appliesTo`, cross-links), small curated tables below supply it, each
 * citing its source.
 */
import type {
  AppliesTo,
  Category,
  DocChecklist,
  ForumPost,
  PrefillTemplate,
  Priority,
  TaskGuide,
} from "../src/types/content.ts";

// ----- Curated enrichment (cites source) -----

/** Who each guide applies to. Source: guide WHO-NEEDS-IT + product-spec §3. */
export const APPLIES_TO: Record<string, AppliesTo> = {
  "irp-registration": { nationalityClass: ["non_eea"], stamp: ["stamp_2"] },
  "visa-application": { nationalityClass: ["non_eea"] },
  "tax-revenue": { requiresWillWork: true },
};

/** Cross-links. Source: relatedGuides in data-model.md §1. */
export const RELATED: Record<string, string[]> = {
  ppsn: ["irp-registration", "student-bank-account", "tax-revenue", "accommodation"],
  "irp-registration": ["health-gp", "ppsn", "accommodation"],
  "student-bank-account": ["ppsn", "accommodation"],
  "tax-revenue": ["ppsn"],
  "health-gp": ["irp-registration"],
};

/** Template id/type metadata keyed by the "TEMPLATE N:" number. */
export const TEMPLATE_IDS: Record<number, { id: string; relatedGuide: string; type: "email" | "letter" }> = {
  1: { id: "ppsn-college-letter-request", relatedGuide: "ppsn", type: "email" },
  2: { id: "ppsn-reason-letter", relatedGuide: "ppsn", type: "letter" },
  3: { id: "gp-registration-enquiry", relatedGuide: "health-gp", type: "email" },
  4: { id: "accommodation-viewing-enquiry", relatedGuide: "accommodation", type: "email" },
};

// ----- Generic txt helpers -----

const MONTHS: Record<string, string> = {
  january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
};

/** "8 June 2026" / "8 June 2026 (note)" -> "2026-06-08". Throws if unparseable. */
export function parseDateToISO(raw: string): string {
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
export function fieldHeader(line: string): { label: string; rest: string } | null {
  const idx = line.indexOf(":");
  if (idx <= 0) return null;
  const before = line.slice(0, idx);
  const labelCore = before.replace(/\(.*?\)/g, "").trim(); // lowercase allowed only in (parens)
  if (labelCore.length === 0 || labelCore.length > 45) return null;
  if (!/^[A-Z0-9][A-Z0-9 /&'’.,\-]*$/.test(labelCore)) return null;
  return { label: before.trim().toUpperCase(), rest: line.slice(idx + 1).trim() };
}

/** Split a body into ordered { label, value } blocks keyed on CAPS headers. */
export function parseFields(lines: string[]): Array<{ label: string; value: string }> {
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
export function parseListItems(block: string): string[] {
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
    if (/^[-=_*]{3,}$/.test(line)) continue; // separator rule line
    const bullet = line.match(/^(\d+\.|[-•*]|\[[ xX]\])\s+(.*)$/);
    const isBreakLabel = /^NOTE:/i.test(line) || (line.length < 40 && /:$/.test(line));
    if (bullet) {
      flush();
      buf = bullet[2];
    } else if (isBreakLabel) {
      flush();
      buf = line;
    } else if (buf) {
      buf += " " + line;
    } else {
      buf = line;
    }
  }
  flush();
  return items;
}

export function normaliseCategory(raw: string): Category {
  const first = raw.split("/")[0].trim().toLowerCase();
  const map: Record<string, Category> = {
    legal: "legal", money: "money", transport: "transport", health: "health",
    housing: "housing", comms: "comms", communications: "comms", lifestyle: "lifestyle",
  };
  return map[first] ?? "legal";
}

export function normalisePriority(raw: string): Priority {
  const s = raw.toLowerCase();
  if (/after grad|stamp 1g/.test(s)) return "after_graduation";
  if (/each year|renew|annual/.test(s)) return "each_year";
  if (/90 ?days|first 90/.test(s)) return "first_90_days";
  if (/when working|paid job|first payday/.test(s)) return "when_working";
  if (/week ?1|day 1|first days|first week/.test(s)) return "week_1";
  if (/first month/.test(s)) return "first_month";
  if (/pre.?arrival|before you fly|before arrival|before flying/.test(s)) return "pre_arrival";
  return "first_month";
}

export function parseFees(raw: string): { amount: number; currency: string; note?: string } {
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

function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** All unique URLs in a document, as {label, url} — a fallback link source. */
export function harvestUrls(raw: string): Array<{ label: string; url: string }> {
  const seen = new Set<string>();
  const out: Array<{ label: string; url: string }> = [];
  for (const m of raw.matchAll(/https?:\/\/\S+/g)) {
    const url = m[0].replace(/[.,)\]]+$/, "");
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ label: hostLabel(url), url });
  }
  return out;
}

export function parseLinks(block: string): Array<{ label: string; url: string }> {
  const urls = parseListItems(block).flatMap((item) => {
    const um = item.match(/https?:\/\/\S+/);
    return um ? [um[0].replace(/[.,)]+$/, "")] : [];
  });
  if (urls.length === 0) {
    const um = block.match(/https?:\/\/\S+/);
    if (um) urls.push(um[0].replace(/[.,)]+$/, ""));
  }
  return urls.map((url) => ({ label: hostLabel(url), url }));
}

const KNOWN_GUIDE_LABELS = new Set([
  "TASK", "CATEGORY", "PRIORITY", "WHO NEEDS IT", "WHY", "STEPS", "DOCUMENTS",
  "FEES", "TIMEFRAME", "OFFICIAL LINK", "OFFICIAL LINKS", "BOOKING PORTAL",
  "TIPS", "LAST VERIFIED",
]);

// ----- Entity parsers -----

export function parseGuide(id: string, raw: string): TaskGuide {
  const lines = withoutBanners(raw);
  const titleLine = lines.find((l) => /^TASK GUIDE:/i.test(l.trim()));
  const title = titleLine ? titleLine.replace(/^TASK GUIDE:/i, "").trim() : id;

  const fields = parseFields(lines);
  const get = (label: string) => fields.find((f) => f.label === label)?.value ?? "";

  const lastVerifiedRaw = get("LAST VERIFIED");
  if (!lastVerifiedRaw) {
    throw new Error(`Guide "${id}" is missing LAST VERIFIED — build aborted.`);
  }

  // Steps: prefer STEPS; fall back to a "HOW TO APPLY…" section (e.g. the visa guide).
  let stepsBlock = get("STEPS");
  let stepsFallbackLabel: string | null = null;
  if (parseListItems(stepsBlock).length === 0) {
    const howto = fields.find((f) => /^HOW TO( APPLY| GET)?\b/.test(f.label));
    if (howto) {
      stepsBlock = howto.value;
      stepsFallbackLabel = howto.label;
    }
  }

  const extraSections = fields
    .filter(
      (f) =>
        !KNOWN_GUIDE_LABELS.has(f.label) &&
        f.label !== "TASK GUIDE" &&
        f.label !== stepsFallbackLabel, // don't repeat steps as an extra section
    )
    .map((f) => ({ label: f.label, text: f.value.replace(/[ \t]+\n/g, "\n").trim() }))
    .filter((s) => s.text.length > 0);

  const officialBlock = get("OFFICIAL LINKS") || get("OFFICIAL LINK");
  // Trust line needs a source: if no OFFICIAL LINK section, harvest inline URLs.
  let officialLinks = parseLinks(officialBlock);
  if (officialLinks.length === 0) officialLinks = harvestUrls(raw).slice(0, 5);

  return {
    id,
    title,
    category: normaliseCategory(get("CATEGORY") || "legal"),
    priority: normalisePriority(get("PRIORITY")),
    whoNeedsIt: get("WHO NEEDS IT").replace(/\s+/g, " ").trim(),
    why: get("WHY").replace(/\s+/g, " ").trim(),
    steps: parseListItems(stepsBlock).map((text, i) => ({ order: i + 1, text })),
    documents: parseListItems(get("DOCUMENTS")),
    fees: parseFees(get("FEES")),
    timeframe: get("TIMEFRAME").replace(/\s*\n\s*/g, " ").replace(/\s+/g, " ").trim(),
    officialLinks,
    bookingPortal: (get("BOOKING PORTAL").match(/https?:\/\/\S+/) ?? [])[0]?.replace(/[.,)]+$/, ""),
    tips: parseListItems(get("TIPS")),
    extraSections,
    relatedGuides: RELATED[id] ?? [],
    appliesTo: APPLIES_TO[id],
    lastVerified: parseDateToISO(lastVerifiedRaw),
    verifyFlags: collectVerifyFlags(raw),
  };
}

export function parseTemplates(raw: string): PrefillTemplate[] {
  const out: PrefillTemplate[] = [];
  const parts = raw.split(/^TEMPLATE\s+(\d+):/gim);
  for (let i = 1; i < parts.length; i += 2) {
    const num = Number(parts[i]);
    const meta = TEMPLATE_IDS[num];
    if (!meta) continue;
    let block = parts[i + 1] ?? "";
    block = block.replace(/LAST VERIFIED:.*$/is, "").replace(/^=+$/gm, "").trim();

    const lines = block.split(/\r?\n/);
    const titleLine = lines.find((l) => l.trim() && !l.trim().startsWith("("));
    const title = (titleLine ?? meta.id).replace(/\s+/g, " ").trim();

    const subjMatch = block.match(/^Subject:\s*(.+)$/im);
    const subject = subjMatch ? subjMatch[1].trim() : undefined;

    let body: string;
    if (subjMatch) {
      body = block.slice(block.indexOf(subjMatch[0]) + subjMatch[0].length);
    } else {
      body = lines.slice(1).join("\n");
    }
    body = body
      .split(/\r?\n/)
      .filter((l) => !/^[-=_]{3,}$/.test(l.trim())) // drop separator rule lines
      .join("\n")
      .replace(/^\s*\n/, "")
      .trim();

    const placeholders = [...new Set([...block.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]))];

    out.push({ id: meta.id, type: meta.type, title, subject, body, placeholders, relatedGuide: meta.relatedGuide });
  }
  return out;
}

/** Map a CAPS section header in document-checklists.txt to a guide id. */
export function checklistHeaderToTaskId(header: string): string | null {
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

export function parseChecklists(raw: string): DocChecklist[] {
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

export function parseForumSeed(raw: string): ForumPost[] {
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
