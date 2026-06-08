import { describe, expect, it } from "vitest";
import { buildDeadlineIcs, buildIcs, fillTemplate } from "../src/engines/prefill";
import type { ContentBundle, PrefillTemplate, UserProfile } from "../src/types/content";
import bundleJson from "../public/content.json";

const bundle = bundleJson as unknown as ContentBundle;
const TODAY = "2026-06-08";

function makeProfile(): UserProfile {
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
    },
    extended: {
      passportNumber: null,
      dateOfBirth: "2001-04-02",
      irishAddress: null, // deliberately missing
      homeAddress: null,
      hasAccommodation: false,
      phoneIrish: "+353 87 123 4567",
      email: "priya@example.com",
      studentId: "24300001",
      courseName: "MSc Computer Science",
      willWork: true,
    },
    derived: { needsVisa: true, needsIrp: true, irpDeadline: null, needsPpsn: true, showTaxGuide: true },
  };
}

const ppsnTemplate = () =>
  bundle.prefillTemplates.find((t) => t.id === "ppsn-college-letter-request") as PrefillTemplate;

describe("fillTemplate (PPSN college letter)", () => {
  const filled = fillTemplate(ppsnTemplate(), makeProfile(), TODAY);

  it("resolves known placeholders from the profile", () => {
    expect(filled.body).toContain("Trinity College Dublin"); // university slug -> name
    expect(filled.body).toContain("Priya Sharma");
    expect(filled.body).toContain("MSc Computer Science");
    expect(filled.subject).toContain("Priya Sharma");
  });

  it("leaves no unresolved {{placeholders}}", () => {
    expect(filled.body).not.toMatch(/\{\{.*?\}\}/);
  });

  it("tracks missing fields and marks them with readable brackets", () => {
    expect(filled.missing).toContain("irish_address");
    expect(filled.body).toContain("[irish address]");
  });

  it("formats dates in long form", () => {
    expect(filled.body).toContain("14 September 2026"); // course_start
  });
});

describe("fillTemplate with a complete profile", () => {
  it("reports no missing fields once the address is supplied", () => {
    const p = makeProfile();
    p.extended.irishAddress = "12 Foster Place, Dublin 2";
    const filled = fillTemplate(ppsnTemplate(), p, TODAY);
    expect(filled.missing).not.toContain("irish_address");
    expect(filled.body).toContain("12 Foster Place, Dublin 2");
  });
});

describe("buildIcs", () => {
  const ics = buildIcs(
    { uid: "test@settlein.app", title: "IRP deadline", description: "Register within 90 days", date: "2026-11-23" },
    TODAY,
  );

  it("produces a valid VCALENDAR/VEVENT with all-day dates", () => {
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261123");
    expect(ics).toContain("DTEND;VALUE=DATE:20261124"); // exclusive end
    expect(ics).toContain("END:VCALENDAR");
  });

  it("uses CRLF line endings and a 3-day alarm", () => {
    expect(ics).toContain("\r\n");
    expect(ics).toContain("TRIGGER:-P3D");
  });

  it("is deterministic for a fixed stamp (no Date.now)", () => {
    const again = buildIcs(
      { uid: "test@settlein.app", title: "IRP deadline", description: "Register within 90 days", date: "2026-11-23" },
      TODAY,
    );
    expect(again).toBe(ics);
  });
});

describe("buildDeadlineIcs", () => {
  it("embeds the task id and deadline in the UID", () => {
    const ics = buildDeadlineIcs("irp-registration", "IRP deadline", "2026-11-23", "Register your IRP", TODAY);
    expect(ics).toContain("UID:irp-registration-20261123@settlein.app");
    expect(ics).toContain("SUMMARY:IRP deadline");
  });
});
