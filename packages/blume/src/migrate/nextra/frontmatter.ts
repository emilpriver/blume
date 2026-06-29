import { stripUnknownPageMeta } from "../shared.ts";

export interface NextraPageOverride {
  hidden?: boolean;
  label?: string;
}

/**
 * Fold Nextra `_meta` overrides (a sidebar label, `display: "hidden"`) into a
 * page's frontmatter, then drop any keys Blume's strict page schema rejects.
 * Nextra's own `title`/`description`/`sidebarTitle` already validate and pass
 * through untouched. Explicit page frontmatter wins over `_meta` overrides.
 */
export const normalizeNextraPageMeta = (
  value: unknown,
  override: NextraPageOverride = {}
): { data: Record<string, unknown>; removed: string[] } => {
  const source =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const data: Record<string, unknown> = { ...source };

  const sidebar: Record<string, unknown> = {
    ...(typeof source.sidebar === "object" && source.sidebar !== null
      ? (source.sidebar as Record<string, unknown>)
      : {}),
  };
  if (override.label !== undefined && sidebar.label === undefined) {
    sidebar.label = override.label;
  }
  if (override.hidden && sidebar.hidden === undefined) {
    sidebar.hidden = true;
  }
  if (Object.keys(sidebar).length > 0) {
    data.sidebar = sidebar;
  }

  return stripUnknownPageMeta(data);
};
