/**
 * Profile store — React context backed by localStorage.
 *
 * Privacy (product-spec §8, data-model §2): passportNumber and dateOfBirth are
 * sensitive. They are kept CLIENT-SIDE ONLY, never sent anywhere, never logged,
 * and `deleteProfile()` performs a full GDPR-style wipe of all stored data.
 * `derived.*` is always recomputed — never trusted from storage.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type {
  ProfileCore,
  ProfileDerived,
  ProfileExtended,
  UserProfile,
} from "../types/content";
import { addDays } from "../lib/dates";

const STORAGE_KEY = "settlein.profile.v1";

export const emptyExtended: ProfileExtended = {
  passportNumber: null,
  dateOfBirth: null,
  irishAddress: null,
  homeAddress: null,
  hasAccommodation: false,
  phoneIrish: null,
  email: null,
  studentId: null,
  courseName: null,
  willWork: true,
};

/** Recompute derived flags from core + extended. Never stored as source of truth. */
export function deriveProfile(core: ProfileCore, extended: ProfileExtended): ProfileDerived {
  const nonEea = core.nationalityClass === "non_eea";
  const needsIrp = nonEea;
  return {
    needsVisa: nonEea,
    needsIrp,
    irpDeadline: needsIrp && core.arrivalDate ? addDays(core.arrivalDate, 90) : null,
    needsPpsn: extended.willWork || nonEea,
    showTaxGuide: extended.willWork,
  };
}

function assembleProfile(core: ProfileCore, extended: ProfileExtended, id: string): UserProfile {
  return { id, core, extended, derived: deriveProfile(core, extended) };
}

/** Load + re-derive from storage. Sensitive fields stay only in this browser. */
function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id: string; core: ProfileCore; extended: ProfileExtended };
    return assembleProfile(parsed.core, { ...emptyExtended, ...parsed.extended }, parsed.id);
  } catch {
    return null;
  }
}

interface ProfileContextValue {
  profile: UserProfile | null;
  /** Create/replace the whole profile (e.g. from onboarding). */
  saveProfile: (core: ProfileCore, extended?: Partial<ProfileExtended>) => void;
  /** Patch extended fields (e.g. an inline "missing field" request in prefill). */
  updateExtended: (patch: Partial<ProfileExtended>) => void;
  /** Full wipe of all stored data (GDPR). */
  deleteProfile: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(() => loadProfile());

  // Persist core + extended only (derived is recomputed on load).
  useEffect(() => {
    if (!profile) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const { id, core, extended } = profile;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, core, extended }));
  }, [profile]);

  const saveProfile = useCallback(
    (core: ProfileCore, extended: Partial<ProfileExtended> = {}) => {
      const id = profile?.id ?? `usr_${core.arrivalDate.replace(/-/g, "")}`;
      setProfile(assembleProfile(core, { ...emptyExtended, ...profile?.extended, ...extended }, id));
    },
    [profile],
  );

  const updateExtended = useCallback((patch: Partial<ProfileExtended>) => {
    setProfile((prev) =>
      prev ? assembleProfile(prev.core, { ...prev.extended, ...patch }, prev.id) : prev,
    );
  }, []);

  const deleteProfile = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({ profile, saveProfile, updateExtended, deleteProfile }),
    [profile, saveProfile, updateExtended, deleteProfile],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within a ProfileProvider");
  return ctx;
}
