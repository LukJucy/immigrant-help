/** Search — instant client-side filter over guides (title, why, who, tips). */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { content } from "../lib/content";
import { CATEGORY_META } from "../components/ui";
import { IconSearch } from "../components/icons";

export function Search() {
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return content.guides.filter((g) =>
      [g.title, g.why, g.whoNeedsIt, g.category, ...g.tips, ...g.documents]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [q]);

  return (
    <div className="space-y-4">
      <h1 className="text-[28px] font-bold text-ink">Search</h1>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2.5 focus-within:border-primary">
        <IconSearch className="h-5 w-5 text-muted" />
        <input
          autoFocus
          className="w-full bg-transparent text-base outline-none"
          placeholder="Search guides — e.g. PPSN, bank, visa…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search guides"
        />
      </div>

      {q.trim() && (
        <p className="text-sm text-muted">
          {results.length} guide{results.length === 1 ? "" : "s"} found
        </p>
      )}

      <ul className="space-y-2">
        {results.map((g) => {
          const cat = CATEGORY_META[g.category];
          return (
            <li key={g.id}>
              <Link
                to={`/task/${g.id}`}
                className="flex items-center gap-3 rounded-card border border-border bg-surface p-3 hover:border-primary"
              >
                <span aria-hidden className="text-lg">
                  {cat.icon}
                </span>
                <span>
                  <span className="block font-medium text-ink">{g.title}</span>
                  <span className="block text-sm text-muted">{cat.label}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {q.trim() && results.length === 0 && (
        <p className="rounded-card border border-border bg-bg p-4 text-center text-muted">
          No guides match “{q}”. Try a simpler word like “bank” or “tax”.
        </p>
      )}
    </div>
  );
}
