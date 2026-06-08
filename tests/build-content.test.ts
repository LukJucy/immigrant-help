import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  parseChecklists,
  parseDateToISO,
  parseFees,
  parseForumSeed,
  parseGuide,
  parseListItems,
  parseTemplates,
  normalisePriority,
} from "../scripts/parse.ts";

const CONTENT = path.resolve(__dirname, "../content");
const read = (rel: string) => readFileSync(path.join(CONTENT, rel), "utf8");

describe("parseDateToISO", () => {
  it("parses '8 June 2026'", () => {
    expect(parseDateToISO("8 June 2026")).toBe("2026-06-08");
  });
  it("ignores a trailing parenthetical note", () => {
    expect(parseDateToISO("8 June 2026 (updated from user visa guide)")).toBe("2026-06-08");
  });
  it("throws on garbage", () => {
    expect(() => parseDateToISO("sometime soon")).toThrow();
  });
});

describe("parseFees", () => {
  it("treats 'Free' as amount 0", () => {
    expect(parseFees("Free")).toMatchObject({ amount: 0, currency: "EUR" });
  });
  it("extracts a euro amount", () => {
    expect(parseFees("€300 registration fee (unless exempt)")).toMatchObject({ amount: 300 });
  });
});

describe("parseListItems", () => {
  it("strips numbering and joins wrapped continuation lines", () => {
    const items = parseListItems("  1. First line\n     wraps here\n  2. Second");
    expect(items).toEqual(["First line wraps here", "Second"]);
  });
  it("skips separator rule lines", () => {
    expect(parseListItems("----------------\n[ ] Passport\n----------------")).toEqual(["Passport"]);
  });
});

describe("normalisePriority", () => {
  it("maps 90-day phrasing to first_90_days", () => {
    expect(normalisePriority("First 90 days — HARD DEADLINE")).toBe("first_90_days");
  });
  it("maps pre-arrival phrasing", () => {
    expect(normalisePriority("Before you fly")).toBe("pre_arrival");
  });
});

describe("parseGuide (PPSN)", () => {
  const guide = parseGuide("ppsn", read("01-task-guides/ppsn.txt"));

  it("extracts a clean title", () => {
    expect(guide.title).toBe("PPSN (Personal Public Service Number)");
  });
  it("marks it free", () => {
    expect(guide.fees.amount).toBe(0);
  });
  it("parses every step with sequential order", () => {
    expect(guide.steps.length).toBe(8);
    expect(guide.steps.map((s) => s.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(guide.steps[0].text).toMatch(/RESIDENT/);
  });
  it("collects official links as valid URLs", () => {
    expect(guide.officialLinks.length).toBeGreaterThanOrEqual(2);
    for (const l of guide.officialLinks) expect(l.url).toMatch(/^https?:\/\//);
  });
  it("has an ISO lastVerified (the trust gate)", () => {
    expect(guide.lastVerified).toBe("2026-06-08");
  });
});

describe("parseGuide (IRP) preserves extra sections + verify flags", () => {
  const guide = parseGuide("irp-registration", read("01-task-guides/irp-registration.txt"));

  it("keeps non-standard CAPS sections (e.g. renewal, stamp 2)", () => {
    const labels = guide.extraSections.map((s) => s.label);
    expect(labels.some((l) => /RENEW/i.test(l))).toBe(true);
    expect(labels.some((l) => /STAMP 2/i.test(l))).toBe(true);
  });
  it("captures the booking portal", () => {
    expect(guide.bookingPortal).toMatch(/inisonline/);
  });
  it("surfaces [VERIFY] flags as a maintenance queue", () => {
    expect(guide.verifyFlags.length).toBeGreaterThan(0);
  });
});

describe("parseTemplates", () => {
  const templates = parseTemplates(read("02-prefill-templates/letter-templates.txt"));

  it("parses the PPSN college-letter request", () => {
    const t = templates.find((x) => x.id === "ppsn-college-letter-request");
    expect(t).toBeDefined();
    expect(t!.subject).toMatch(/PPSN/);
    expect(t!.placeholders).toContain("full_name");
    expect(t!.body).not.toMatch(/^Subject:/);
    expect(t!.body).not.toMatch(/----/); // no separator leakage
  });
});

describe("parseChecklists", () => {
  const lists = parseChecklists(read("02-prefill-templates/document-checklists.txt"));

  it("parses all task sections including parenthesised headers", () => {
    const ids = lists.map((l) => l.taskId);
    for (const id of ["visa-application", "ppsn", "irp-registration", "student-leap-card", "tax-revenue"]) {
      expect(ids).toContain(id);
    }
  });
  it("pulls NOTE out of items and into the note field", () => {
    const ppsn = lists.find((l) => l.taskId === "ppsn")!;
    expect(ppsn.note).toMatch(/temporary/i);
    expect(ppsn.items.every((i) => !/^NOTE:/i.test(i))).toBe(true);
    expect(ppsn.items.every((i) => !/^----/.test(i))).toBe(true);
  });
});

describe("parseForumSeed", () => {
  const posts = parseForumSeed(read("03-forum-seed/seed-posts.txt"));

  it("parses ~12 seed posts, all flagged isSeed", () => {
    expect(posts.length).toBe(12);
    expect(posts.every((p) => p.isSeed)).toBe(true);
  });
  it("zero-pads ids and parses upvotes as numbers", () => {
    const first = posts[0];
    expect(first.id).toBe("post_001");
    expect(typeof first.upvotes).toBe("number");
    expect(first.upvotes).toBeGreaterThan(0);
  });
});
