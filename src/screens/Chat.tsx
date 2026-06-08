/**
 * Ask SettleIn — a chat that answers in plain language and links you to the
 * relevant guide and official source. Runs on-device (retrieval), so it's
 * private and works with no backend. Signposting, not advice.
 */
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useProfile } from "../store/profile";
import { content } from "../lib/content";
import { todayISO } from "../lib/dates";
import { getAssistant } from "../engines/assistant/provider";
import { STARTER_QUESTIONS } from "../engines/assistant";
import type { AssistantReply, ReplyLink } from "../engines/assistant";
import { IconExternal, IconChevronRight, IconSearch } from "../components/icons";

interface Turn {
  role: "user" | "assistant";
  text: string;
  links?: ReplyLink[];
}

export function Chat() {
  const { profile } = useProfile();
  const assistant = useMemo(() => getAssistant(), []);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function send(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    setTurns((t) => [...t, { role: "user", text: q }]);
    setBusy(true);
    try {
      const reply: AssistantReply = await assistant.ask(q, {
        content,
        profile,
        today: todayISO(),
      });
      setTurns((t) => [...t, { role: "assistant", text: reply.text, links: reply.links }]);
    } catch {
      setTurns((t) => [
        ...t,
        { role: "assistant", text: "Sorry — I couldn't answer that just now. Try rephrasing, or browse your timeline." },
      ]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col">
      <header className="mb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-bold text-ink">Ask Ireland Buddy</h1>
          <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
            {assistant.label}
          </span>
        </div>
        <p className="text-sm text-muted">
          Ask about any step. I'll point you to the right guide and the official source.
        </p>
      </header>

      {/* Conversation */}
      <div className="flex-1 space-y-3">
        {turns.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-ink hover:border-primary hover:bg-primary-soft"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((turn, i) =>
          turn.role === "user" ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-white">
                {turn.text}
              </p>
            </div>
          ) : (
            <div key={i} className="flex justify-start">
              <div className="max-w-[90%] space-y-2 rounded-2xl rounded-bl-sm border border-border bg-surface px-4 py-3">
                <p className="text-ink">{turn.text}</p>
                {turn.links && turn.links.length > 0 && (
                  <ul className="space-y-1.5 pt-1">
                    {turn.links.map((link, j) => (
                      <li key={j}>
                        <ReplyLinkView link={link} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ),
        )}

        {busy && (
          <div className="flex justify-start">
            <p className="rounded-2xl rounded-bl-sm border border-border bg-surface px-4 py-3 text-muted">
              Looking that up…
            </p>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="sticky bottom-0 mt-3 flex items-center gap-2 bg-bg/95 py-2 backdrop-blur"
      >
        <input
          className="w-full rounded-full border border-border bg-white px-4 py-3 text-base focus:border-primary"
          placeholder="Ask a question…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Ask SettleIn a question"
        />
        <button
          type="submit"
          disabled={!input.trim() || busy}
          className="shrink-0 rounded-full bg-primary px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          Ask
        </button>
      </form>

      <p className="pb-1 pt-2 text-center text-xs text-muted">
        Signposting, not legal advice · answered on your device from verified guides
      </p>
    </div>
  );
}

function ReplyLinkView({ link }: { link: ReplyLink }) {
  const cls =
    "inline-flex items-center gap-1.5 font-medium text-primary underline underline-offset-2";
  if (link.href) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
        <IconExternal className="h-4 w-4" />
        {link.label}
      </a>
    );
  }
  return (
    <Link to={link.to ?? "/"} className={cls}>
      {link.kind === "guide" || link.kind === "route" ? (
        <IconChevronRight className="h-4 w-4" />
      ) : (
        <IconSearch className="h-4 w-4" />
      )}
      {link.label}
    </Link>
  );
}
