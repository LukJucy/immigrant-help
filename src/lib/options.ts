/** Dropdown option data for onboarding + the Priya demo seed. */
import type { NationalityClass, ProfileCore, ProfileExtended, VisaStamp } from "../types/content";

export interface NationalityOption {
  code: string;
  label: string;
  klass: NationalityClass;
}

// A curated short list (the demo doesn't need every country). Class drives
// whether the user sees IRP/visa guidance.
export const NATIONALITIES: NationalityOption[] = [
  { code: "IN", label: "India", klass: "non_eea" },
  { code: "NG", label: "Nigeria", klass: "non_eea" },
  { code: "CN", label: "China", klass: "non_eea" },
  { code: "BR", label: "Brazil", klass: "non_eea" },
  { code: "PK", label: "Pakistan", klass: "non_eea" },
  { code: "MY", label: "Malaysia", klass: "non_eea" },
  { code: "US", label: "United States", klass: "non_eea" },
  { code: "EG", label: "Egypt", klass: "non_eea" },
  { code: "PH", label: "Philippines", klass: "non_eea" },
  { code: "KE", label: "Kenya", klass: "non_eea" },
  { code: "ZZ", label: "Other (outside the EU/EEA)", klass: "non_eea" },
  { code: "FR", label: "France", klass: "eu_eea_swiss" },
  { code: "DE", label: "Germany", klass: "eu_eea_swiss" },
  { code: "PL", label: "Poland", klass: "eu_eea_swiss" },
  { code: "ES", label: "Spain", klass: "eu_eea_swiss" },
  { code: "EE", label: "Other EU / EEA / Switzerland", klass: "eu_eea_swiss" },
];

export interface StampOption {
  value: VisaStamp;
  label: string;
  help: string;
  forClass: NationalityClass;
}

export const STAMPS: StampOption[] = [
  {
    value: "stamp_2",
    label: "Non-EU student (Stamp 2)",
    help: "You'll register for an IRP within 90 days of arriving.",
    forClass: "non_eea",
  },
  {
    value: "stamp_1g",
    label: "Graduate (Stamp 1G)",
    help: "You've finished a course and are staying to seek work.",
    forClass: "non_eea",
  },
  {
    value: "eu_none",
    label: "EU / EEA / Swiss — no permit needed",
    help: "You don't need a visa or an IRP to study in Ireland.",
    forClass: "eu_eea_swiss",
  },
];

export interface UniversityOption {
  slug: string;
  label: string;
}

export const UNIVERSITIES: UniversityOption[] = [
  { slug: "tcd", label: "Trinity College Dublin" },
  { slug: "ucd", label: "University College Dublin" },
  { slug: "dcu", label: "Dublin City University" },
  { slug: "tud", label: "Technological University Dublin" },
  { slug: "rcsi", label: "RCSI" },
  { slug: "maynooth", label: "Maynooth University" },
  { slug: "other", label: "Another Irish university" },
];

/** Priya — the demo persona (data-model.md §2). */
export const PRIYA_CORE: ProfileCore = {
  fullName: "Priya Sharma",
  nationality: "IN",
  nationalityClass: "non_eea",
  visaStamp: "stamp_2",
  university: "tcd",
  courseStart: "2026-09-14",
  arrivalDate: "2026-08-25",
};

export const PRIYA_EXTENDED: Partial<ProfileExtended> = {
  dateOfBirth: "2001-04-02",
  email: "priya@example.com",
  courseName: "MSc Computer Science",
  studentId: "24300001",
  willWork: true,
  hasAccommodation: false,
};
