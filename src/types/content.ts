/**
 * Content & domain types for SettleIn.
 * These mirror docs/technical/data-model.md. The build script
 * (scripts/build-content.ts) parses content/**/*.txt into these shapes,
 * validates them with Zod, and emits public/content.json.
 */

// ----- Enums -----

export type Category =
  | "legal"
  | "money"
  | "transport"
  | "health"
  | "housing"
  | "comms"
  | "lifestyle";

export type Priority =
  | "pre_arrival"
  | "week_1"
  | "first_month"
  | "first_90_days"
  | "when_working"
  | "each_year"
  | "after_graduation";

export type NationalityClass = "eu_eea_swiss" | "non_eea";
export type VisaStamp = "stamp_2" | "stamp_1g" | "eu_none";

// ----- TaskGuide -----

export interface GuideStep {
  order: number;
  text: string;
}

export interface OfficialLink {
  label: string;
  url: string;
}

export interface Fees {
  amount: number; // 0 == free
  currency: string;
  note?: string;
}

/** A free-form CAPS section in the source that isn't a known field. */
export interface ExtraSection {
  label: string;
  text: string;
}

export interface AppliesTo {
  nationalityClass?: NationalityClass[];
  stamp?: VisaStamp[];
  /** Only relevant when the user intends to work (e.g. the tax guide). */
  requiresWillWork?: boolean;
}

export interface TaskGuide {
  id: string;
  title: string;
  category: Category;
  priority: Priority;
  whoNeedsIt: string;
  why: string;
  steps: GuideStep[];
  documents: string[];
  fees: Fees;
  timeframe: string;
  officialLinks: OfficialLink[];
  bookingPortal?: string;
  tips: string[];
  extraSections: ExtraSection[];
  relatedGuides: string[];
  appliesTo?: AppliesTo; // omitted == applies to everyone
  lastVerified: string; // ISO-8601 date
  verifyFlags: string[];
}

// ----- TimelineItem (rules engine input) -----

export type Anchor = "arrivalDate" | "courseStart";

export interface TimingRule {
  anchor: Anchor;
  /** Days from the anchor. Negative == before the anchor. */
  offsetDays: number;
}

export interface TimelineItem {
  taskId: string;
  phase: Priority;
  timingRule: TimingRule;
  hardDeadline: boolean;
  blockedBy: string[];
  showCountdown: boolean;
}

// ----- PrefillTemplate -----

export type TemplateType = "email" | "letter";

export interface PrefillTemplate {
  id: string;
  type: TemplateType;
  title: string;
  subject?: string;
  body: string;
  placeholders: string[];
  relatedGuide: string;
}

// ----- Per-task document checklist -----

export interface DocChecklist {
  taskId: string;
  title: string;
  items: string[];
  note?: string;
}

// ----- Forum -----

export type ForumStatus = "published" | "pending" | "removed";

export interface ForumPost {
  id: string;
  taskTag: string;
  title: string;
  authorAlias: string;
  authorNationality?: string;
  body: string;
  upvotes: number;
  isSeed: boolean;
  createdAt: string; // ISO-8601
  status: ForumStatus;
}

// ----- Reference entities -----

export type TrustTier = "official" | "university" | "community";

export interface CuratedLink {
  label: string;
  url: string;
  taskTag: string;
  trustTier: TrustTier;
  lastChecked: string;
}

export interface GlossaryEntry {
  term: string;
  definition: string;
}

export interface Contact {
  name: string;
  phone: string;
  category: string;
  note?: string;
}

// ----- The compiled content bundle -----

export interface ContentBundle {
  generatedAt: string;
  guides: TaskGuide[];
  timelineRules: TimelineItem[];
  prefillTemplates: PrefillTemplate[];
  docChecklists: DocChecklist[];
  forumSeed: ForumPost[];
  glossary: GlossaryEntry[];
  curatedLinks: CuratedLink[];
  contacts: Contact[];
}

// ----- UserProfile -----

export interface ProfileCore {
  fullName: string;
  nationality: string; // ISO country code, e.g. "IN"
  nationalityClass: NationalityClass;
  visaStamp: VisaStamp;
  university: string; // slug, e.g. "tcd"
  courseStart: string; // ISO date
  arrivalDate: string; // ISO date
}

export interface ProfileExtended {
  passportNumber: string | null; // SENSITIVE — client-side only, never logged
  dateOfBirth: string | null; // SENSITIVE
  irishAddress: string | null;
  homeAddress: string | null;
  hasAccommodation: boolean;
  phoneIrish: string | null;
  email: string | null;
  studentId: string | null;
  courseName: string | null;
  willWork: boolean;
}

export interface ProfileDerived {
  needsVisa: boolean;
  needsIrp: boolean;
  irpDeadline: string | null; // ISO date
  needsPpsn: boolean;
  showTaxGuide: boolean;
}

export interface UserProfile {
  id: string;
  core: ProfileCore;
  extended: ProfileExtended;
  // `derived` is always recomputed from core/extended — never the source of truth.
  derived: ProfileDerived;
}
