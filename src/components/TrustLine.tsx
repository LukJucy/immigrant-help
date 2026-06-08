/**
 * TrustLine — the non-negotiable trust layer. Every factual screen shows
 * "Verified {date} · {source}" linking the official page (design-system.md).
 */
import { IconCheck, IconExternal } from "./icons";
import { formatDateLong } from "../lib/dates";
import type { OfficialLink } from "../types/content";

export function TrustLine({
  lastVerified,
  source,
}: {
  lastVerified: string;
  source?: OfficialLink;
}) {
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
      <IconCheck className="h-4 w-4 text-success" />
      <span>Verified {formatDateLong(lastVerified)}</span>
      {source && (
        <>
          <span aria-hidden>·</span>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-2"
          >
            {source.label}
            <IconExternal className="h-3.5 w-3.5" />
          </a>
        </>
      )}
    </p>
  );
}
