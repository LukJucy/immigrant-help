/**
 * Forum feed — seeded experience posts with tag filter, sort, and in-browser
 * upvotes (localStorage). Seed posts are clearly labelled as examples.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { content } from "../lib/content";
import { useLocalStorage } from "../lib/useLocalStorage";
import { Chip } from "../components/ui";
import { IconUpvote } from "../components/icons";

const FLAG: Record<string, string> = {
  India: "🇮🇳", Nigeria: "🇳🇬", China: "🇨🇳", Brazil: "🇧🇷", Pakistan: "🇵🇰",
  Malaysia: "🇲🇾", Vietnam: "🇻🇳", Egypt: "🇪🇬", Philippines: "🇵🇭", Kenya: "🇰🇪",
  Mexico: "🇲🇽", Indonesia: "🇮🇩",
};

export function Forum() {
  const posts = content.forumSeed.filter((p) => p.status === "published");
  const tags = ["all", ...Array.from(new Set(posts.map((p) => p.taskTag)))];
  const [tag, setTag] = useState("all");
  const [sort, setSort] = useState<"top" | "new">("top");

  // Extra upvotes the user adds, persisted; one vote per post.
  const [voted, setVoted] = useLocalStorage<string[]>("settlein.votes.v1", []);

  const list = useMemo(() => {
    let l = posts.filter((p) => tag === "all" || p.taskTag === tag);
    const score = (id: string, base: number) => base + (voted.includes(id) ? 1 : 0);
    l = [...l].sort((a, b) =>
      sort === "top"
        ? score(b.id, b.upvotes) - score(a.id, a.upvotes)
        : b.createdAt.localeCompare(a.createdAt),
    );
    return l;
  }, [posts, tag, sort, voted]);

  function toggleVote(id: string) {
    setVoted((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-[28px] font-bold text-ink">Experiences</h1>
        <span className="text-sm text-muted">Real tips from students</span>
      </header>

      {/* Filters */}
      <div className="flex items-center justify-between gap-2">
        <select
          aria-label="Filter by topic"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
        >
          {tags.map((t) => (
            <option key={t} value={t}>
              {t === "all" ? "All topics" : t}
            </option>
          ))}
        </select>
        <div className="flex gap-1 rounded-lg border border-border bg-white p-0.5 text-sm">
          {(["top", "new"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`rounded-md px-3 py-1.5 font-medium ${
                sort === s ? "bg-primary-soft text-primary" : "text-muted"
              }`}
            >
              {s === "top" ? "Top" : "New"}
            </button>
          ))}
        </div>
      </div>

      <ul className="space-y-3">
        {list.map((post) => {
          const score = post.upvotes + (voted.includes(post.id) ? 1 : 0);
          return (
            <li key={post.id} className="rounded-card border border-border bg-surface p-4">
              <div className="mb-1.5 flex items-center justify-between">
                <Chip tone="primary">{post.taskTag}</Chip>
                {post.isSeed && <Chip tone="neutral">example</Chip>}
              </div>
              <h2 className="font-semibold text-ink">{post.title}</h2>
              <p className="mt-1 line-clamp-3 text-sm text-muted">{post.body}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-muted">
                  @{post.authorAlias} {post.authorNationality && (FLAG[post.authorNationality] ?? "")}
                </span>
                <button
                  onClick={() => toggleVote(post.id)}
                  aria-pressed={voted.includes(post.id)}
                  aria-label={`Upvote (${score})`}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-semibold ${
                    voted.includes(post.id)
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border text-muted hover:text-ink"
                  }`}
                >
                  <IconUpvote className="h-4 w-4" /> {score}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="rounded-card border border-border bg-bg p-3 text-center text-sm text-muted">
        These are example posts to show how the community works.{" "}
        <Link to="/about" className="font-medium text-primary underline underline-offset-2">
          Learn more
        </Link>
      </p>
    </div>
  );
}
