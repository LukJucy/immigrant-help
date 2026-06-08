/**
 * Static content loader. The compiled content.json (built from content/*.txt
 * by scripts/build-content.ts) is imported at build time — the app is a thin
 * client over this data, no backend needed for the demo.
 */
import type {
  ContentBundle,
  DocChecklist,
  ForumPost,
  PrefillTemplate,
  TaskGuide,
} from "../types/content";
import bundleJson from "../../public/content.json";

export const content = bundleJson as unknown as ContentBundle;

export function getGuide(id: string): TaskGuide | undefined {
  return content.guides.find((g) => g.id === id);
}

export function getTemplate(id: string): PrefillTemplate | undefined {
  return content.prefillTemplates.find((t) => t.id === id);
}

export function templatesForGuide(guideId: string): PrefillTemplate[] {
  return content.prefillTemplates.filter((t) => t.relatedGuide === guideId);
}

export function checklistForGuide(guideId: string): DocChecklist | undefined {
  return content.docChecklists.find((c) => c.taskId === guideId);
}

export function postsForTag(tag: string): ForumPost[] {
  return content.forumSeed.filter((p) => p.taskTag === tag && p.status === "published");
}
