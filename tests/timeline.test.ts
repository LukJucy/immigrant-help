import { describe, expect, it } from "vitest";
import { buildTimeline, PHASE_ORDER } from "../src/engines/timeline";
import type { ContentBundle, UserProfile } from "../src/types/content";
import bundleJson from "../public/content.json";

const bundle = bundleJson as unknown as ContentBundle;
const TODAY = "2026-06-08";

function makeProfile(overrides: Partial<UserProfile["core"]> = {}): UserProfile {
  return {
    id: "usr_test",
    core: {
      fullName: "Priya Sharma",
      nationality: "IN",
      nationalityClass: "non_eea",
      visaStamp: "stamp_2",
      university: "tcd",
      courseStart: "2026-09-14",
      arrivalDate: "2026-08-25",
      ...overrides,
    },
    extended: {
      passportNumber: null,
      dateOfBirth: "2001-04-02",
      irishAddress: null,
      homeAddress: null,
      hasAccommodation: false,
      phoneIrish: null,
      email: "priya@example.com",
      studentId: null,
      courseName: "MSc Computer Science",
      willWork: true,
    },
    derived: {
      needsVisa: true,
      needsIrp: true,
      irpDeadline: null,
      needsPpsn: true,
      showTaxGuide: true,
    },
  };
}

const plan = (p: UserProfile) =>
  buildTimeline(p, bundle.timelineRules, bundle.guides, TODAY);

describe("buildTimeline — non-EU student (Priya)", () => {
  const result = plan(makeProfile());

  it("computes the IRP 90-day deadline as arrival + 90 (= 23 Nov 2026)", () => {
    expect(result.irp).toBeDefined();
    expect(result.irp!.deadline).toBe("2026-11-23");
  });

  it("computes a book-by date 70 days before the deadline", () => {
    expect(result.irp!.bookBy).toBe("2026-09-14");
  });

  it("reports the correct days-left countdown from today", () => {
    expect(result.irp!.daysLeft).toBe(168);
    expect(result.irp!.overdue).toBe(false);
  });

  it("orders tasks by phase (pre-arrival first, IRP in first_90_days)", () => {
    const phases = result.orderedTasks.map((t) => t.phase);
    // phases must be non-decreasing in canonical order
    const idxs = phases.map((p) => PHASE_ORDER.indexOf(p));
    expect(idxs).toEqual([...idxs].sort((a, b) => a - b));
    expect(result.orderedTasks[0].phase).toBe("pre_arrival");
  });

  it("resolves blockedBy only to tasks present in the plan", () => {
    const ppsn = result.orderedTasks.find((t) => t.taskId === "ppsn")!;
    expect(ppsn.blockedBy).toContain("accommodation");
    const tax = result.orderedTasks.find((t) => t.taskId === "tax-revenue")!;
    expect(tax.blockedBy).toContain("ppsn");
  });

  it("includes the IRP and visa guides for a non-EU student", () => {
    const ids = result.orderedTasks.map((t) => t.taskId);
    expect(ids).toContain("irp-registration");
    expect(ids).toContain("visa-application");
  });
});

describe("buildTimeline — EU student (personalisation)", () => {
  const result = plan(
    makeProfile({ nationalityClass: "eu_eea_swiss", visaStamp: "eu_none", nationality: "FR" }),
  );

  it("has no IRP countdown", () => {
    expect(result.irp).toBeUndefined();
  });

  it("hides the IRP and visa guides", () => {
    const ids = result.orderedTasks.map((t) => t.taskId);
    expect(ids).not.toContain("irp-registration");
    expect(ids).not.toContain("visa-application");
  });
});

describe("buildTimeline — non-working student", () => {
  it("hides the tax guide when willWork is false", () => {
    const p = makeProfile();
    p.extended.willWork = false;
    const result = plan(p);
    expect(result.orderedTasks.map((t) => t.taskId)).not.toContain("tax-revenue");
  });
});
