import { describe, expect, it } from "vitest";
import { answerQuery } from "../src/engines/assistant";
import type { AssistantContext } from "../src/engines/assistant";
import { localProvider } from "../src/engines/assistant/provider";
import type { ContentBundle, UserProfile } from "../src/types/content";
import bundleJson from "../public/content.json";

const content = bundleJson as unknown as ContentBundle;
const TODAY = "2026-06-08";

function makeProfile(klass: "non_eea" | "eu_eea_swiss" = "non_eea"): UserProfile {
  return {
    id: "usr_test",
    core: {
      fullName: "Priya Sharma",
      nationality: klass === "non_eea" ? "IN" : "FR",
      nationalityClass: klass,
      visaStamp: klass === "non_eea" ? "stamp_2" : "eu_none",
      university: "tcd",
      courseStart: "2026-09-14",
      arrivalDate: "2026-08-25",
    },
    extended: {
      passportNumber: null, dateOfBirth: null, irishAddress: null, homeAddress: null,
      hasAccommodation: false, phoneIrish: null, email: null, studentId: null,
      courseName: null, willWork: true,
    },
    derived: { needsVisa: true, needsIrp: true, irpDeadline: null, needsPpsn: true, showTaxGuide: true },
  };
}

const ctx = (profile: UserProfile | null): AssistantContext => ({ content, profile, today: TODAY });

describe("answerQuery — retrieval + links", () => {
  it("routes a PPSN question to the PPSN guide with an official link", () => {
    const r = answerQuery("how do I get a PPSN?", ctx(null));
    expect(r.links.some((l) => l.to === "/task/ppsn")).toBe(true);
    expect(r.links.some((l) => l.kind === "official" && l.href?.startsWith("http"))).toBe(true);
  });

  it("routes a SIM question to the sim-card guide", () => {
    const r = answerQuery("what's the cheapest sim card?", ctx(null));
    expect(r.links.some((l) => l.to === "/task/sim-card")).toBe(true);
  });

  it("maps 'open a bank account' to the bank guide via synonyms", () => {
    const r = answerQuery("how do I open a bank account?", ctx(null));
    expect(r.links.some((l) => l.to === "/task/student-bank-account")).toBe(true);
  });
});

describe("answerQuery — deadline questions", () => {
  it("returns the live IRP countdown for a non-EU profile", () => {
    const r = answerQuery("when is my IRP deadline?", ctx(makeProfile()));
    expect(r.text).toMatch(/168 days left|23 Nov 2026/);
    expect(r.links.some((l) => l.to === "/timeline")).toBe(true);
  });
});

describe("answerQuery — personalisation", () => {
  it("tells an EU student they don't need an IRP", () => {
    const r = answerQuery("do I need an IRP?", ctx(makeProfile("eu_eea_swiss")));
    expect(r.text.toLowerCase()).toMatch(/don'?t need|do not need/);
    expect(r.links.every((l) => l.to !== "/task/irp-registration")).toBe(true);
  });

  it("confirms a non-EU student does need an IRP", () => {
    const r = answerQuery("do I need an IRP?", ctx(makeProfile()));
    expect(r.links.some((l) => l.to === "/task/irp-registration")).toBe(true);
  });
});

describe("answerQuery — fallback", () => {
  it("offers browse/search links when nothing matches", () => {
    const r = answerQuery("asdfghjkl zzz", ctx(null));
    expect(r.links.some((l) => l.to === "/timeline")).toBe(true);
  });
});

describe("localProvider", () => {
  it("implements the AssistantProvider interface", async () => {
    const r = await localProvider.ask("how do I get a PPSN?", ctx(null));
    expect(r.text.length).toBeGreaterThan(0);
    expect(Array.isArray(r.links)).toBe(true);
  });
});
