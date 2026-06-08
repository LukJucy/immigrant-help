/**
 * AssistantProvider seam — the hybrid boundary.
 *
 * Today: `localProvider` answers from on-device retrieval (no network, no key,
 * privacy-safe). Later: a `claudeProvider` can implement the SAME interface,
 * calling the Anthropic API via a small proxy (a browser-only key is insecure),
 * using `answerQuery`'s retrieved guides as grounding / tool results.
 *
 * The Chat screen depends only on this interface, so swapping providers is a
 * one-line change in `getAssistant()`.
 */
import type { AssistantContext, AssistantReply } from "../assistant";
import { answerQuery } from "../assistant";

export interface AssistantProvider {
  id: string;
  /** Human-readable label for any "powered by" UI. */
  label: string;
  ask(query: string, ctx: AssistantContext): Promise<AssistantReply>;
}

export const localProvider: AssistantProvider = {
  id: "local",
  label: "On-device (private)",
  ask: async (query, ctx) => answerQuery(query, ctx),
};

/**
 * Placeholder for the future Claude-backed provider. Not wired yet — it needs a
 * server-side proxy holding the API key. Kept here to make the seam explicit.
 *
 *   import Anthropic from "@anthropic-ai/sdk";
 *   // POST query + retrieved guides to /api/ask; the proxy calls Claude and
 *   // returns { text, links } in the AssistantReply shape.
 */
export const claudeProvider: AssistantProvider = {
  id: "claude",
  label: "Claude (coming soon)",
  ask: async () => {
    throw new Error("Claude provider not configured — needs a server-side API proxy.");
  },
};

/** Choose the active provider. Swap to `claudeProvider` once a proxy exists. */
export function getAssistant(): AssistantProvider {
  return localProvider;
}
