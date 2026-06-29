import { z } from "zod";

import { stripUnknownPageMeta } from "../shared.ts";

/**
 * One-time translation of Starlight page frontmatter into Blume's shape. Runs at
 * migration time only — Blume's runtime page schema stays Starlight-free and
 * strict. `sidebar.badge` flattens to a string, `pagefind:false` becomes
 * `search.exclude`, `lastUpdated` (a date) becomes `lastModified`, and
 * `prev`/`next:false` become `hideFooterPagination`. Starlight-only keys
 * (`template`, `hero`, `banner`, `tableOfContents`, `editUrl`, `head`) are then
 * dropped by the strict-schema pass and reported.
 */

const starlightBadgeSchema = z.union([
  z.string(),
  z.object({ text: z.string() }).passthrough(),
]);

const starlightSidebarSchema = z
  .object({
    badge: starlightBadgeSchema.optional(),
    hidden: z.boolean().optional(),
    label: z.string().optional(),
    order: z.number().optional(),
  })
  .passthrough();

const starlightPageMetaInputSchema = z
  .object({
    lastUpdated: z.union([z.date(), z.string(), z.boolean()]).optional(),
    next: z.unknown().optional(),
    pagefind: z.boolean().optional(),
    prev: z.unknown().optional(),
    sidebar: starlightSidebarSchema.optional(),
  })
  .passthrough();

type StarlightPageMeta = z.infer<typeof starlightPageMetaInputSchema>;

const normalizedSidebar = (
  sidebar: NonNullable<StarlightPageMeta["sidebar"]>
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  if (sidebar.label !== undefined) {
    out.label = sidebar.label;
  }
  if (sidebar.order !== undefined) {
    out.order = sidebar.order;
  }
  if (sidebar.hidden !== undefined) {
    out.hidden = sidebar.hidden;
  }
  const badge =
    typeof sidebar.badge === "string" ? sidebar.badge : sidebar.badge?.text;
  if (badge !== undefined) {
    out.badge = badge;
  }
  return out;
};

/**
 * Map Starlight page frontmatter onto Blume's frontmatter shape, returning the
 * cleaned data plus any unknown keys dropped to satisfy the strict page schema.
 */
export const normalizeStarlightPageMeta = (
  value: unknown
): { data: Record<string, unknown>; removed: string[] } => {
  const parsed = starlightPageMetaInputSchema.safeParse(value);
  if (!parsed.success || typeof value !== "object" || value === null) {
    return stripUnknownPageMeta((value ?? {}) as Record<string, unknown>);
  }

  const meta = parsed.data;
  const data: Record<string, unknown> = {
    ...(value as Record<string, unknown>),
  };

  if (meta.sidebar) {
    const sidebar = normalizedSidebar(meta.sidebar);
    if (Object.keys(sidebar).length > 0) {
      data.sidebar = sidebar;
    } else {
      delete data.sidebar;
    }
  }

  if (meta.pagefind === false) {
    const existing =
      typeof data.search === "object" && data.search !== null
        ? (data.search as Record<string, unknown>)
        : {};
    data.search = { ...existing, exclude: true };
  }
  delete data.pagefind;

  if (meta.lastUpdated instanceof Date) {
    data.lastModified = meta.lastUpdated.toISOString();
  } else if (typeof meta.lastUpdated === "string") {
    data.lastModified = meta.lastUpdated;
  }
  delete data.lastUpdated;

  if (meta.prev === false || meta.next === false) {
    data.hideFooterPagination = true;
  }
  delete data.prev;
  delete data.next;

  return stripUnknownPageMeta(data);
};
