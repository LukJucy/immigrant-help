/**
 * Personalisation: decide whether a guide applies to a given profile.
 * This is what keeps EU students from seeing IRP/visa guides and
 * non-working students from seeing the tax guide.
 */
import type { AppliesTo, TaskGuide, UserProfile } from "../types/content";

export function guideApplies(appliesTo: AppliesTo | undefined, profile: UserProfile): boolean {
  if (!appliesTo) return true; // omitted == everyone

  if (appliesTo.nationalityClass && appliesTo.nationalityClass.length > 0) {
    if (!appliesTo.nationalityClass.includes(profile.core.nationalityClass)) return false;
  }
  if (appliesTo.stamp && appliesTo.stamp.length > 0) {
    if (!appliesTo.stamp.includes(profile.core.visaStamp)) return false;
  }
  if (appliesTo.requiresWillWork && !profile.extended.willWork) return false;

  return true;
}

/** Filter a list of guides down to those that apply to the profile. */
export function applicableGuides(guides: TaskGuide[], profile: UserProfile): TaskGuide[] {
  return guides.filter((g) => guideApplies(g.appliesTo, profile));
}
