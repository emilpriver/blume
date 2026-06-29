import type { FolderMeta } from "../../core/schema.ts";
import {
  parseKey,
  readString,
  scanObject,
  splitKeyValue,
  stripJsComments,
} from "../shared.ts";

/**
 * Read Nextra `_meta` files (ordering + per-entry config) and map them onto
 * Blume's folder `meta.ts` shape. `_meta.js`/`_meta.ts` are parsed by extracting
 * their default-exported object literal as text — Nextra meta is overwhelmingly
 * a map of string titles and simple config objects — rather than executing user
 * code (matching the other migrators, which never eval). Entries whose value is
 * an expression (JSX title, imported component, computed) keep their slug for
 * ordering but are otherwise flagged `unparseable`. The low-level JS scanners
 * live in `../shared.ts` so the Starlight migrator reuses them.
 */

export interface NextraMetaEntry {
  display?: string;
  href?: string;
  newWindow?: boolean;
  slug: string;
  title?: string;
  type?: string;
  /** The value couldn't be read beyond its key (e.g. a JSX/expression title). */
  unparseable: boolean;
}

const DEFAULT_EXPORT = /(?:export\s+default|module\.exports\s*=)\s*/u;

/** Locate and split the default-exported object literal into raw entries. */
const extractObjectEntries = (source: string): string[] | null => {
  const clean = stripJsComments(source);
  const marker = DEFAULT_EXPORT.exec(clean);
  if (!marker) {
    return null;
  }
  let index = marker.index + marker[0].length;
  while (index < clean.length && /\s/u.test(clean[index] ?? "")) {
    index += 1;
  }
  if (clean[index] !== "{") {
    return null;
  }
  return scanObject(clean, index)?.entries ?? null;
};

const applyField = (
  target: NextraMetaEntry,
  key: string,
  value: string
): void => {
  if (key === "newWindow") {
    const flag = value.trim();
    if (flag === "true") {
      target.newWindow = true;
    } else if (flag === "false") {
      target.newWindow = false;
    }
    return;
  }
  const str = readString(value);
  if (str === null) {
    return;
  }
  if (key === "title") {
    target.title = str;
  } else if (key === "type") {
    target.type = str;
  } else if (key === "display") {
    target.display = str;
  } else if (key === "href") {
    target.href = str;
  }
};

const entryFromObjectEntries = (
  slug: string,
  entries: string[]
): NextraMetaEntry => {
  const entry: NextraMetaEntry = { slug, unparseable: false };
  for (const raw of entries) {
    const kv = splitKeyValue(raw);
    if (kv?.key) {
      applyField(entry, parseKey(kv.key), kv.value);
    }
  }
  return entry;
};

const entryFromValue = (slug: string, value: string): NextraMetaEntry => {
  const trimmed = value.trim();
  const [first] = trimmed;
  if (first === '"' || first === "'" || first === "`") {
    const str = readString(trimmed);
    return str === null
      ? { slug, unparseable: true }
      : { slug, title: str, unparseable: false };
  }
  if (first === "{") {
    const scan = scanObject(trimmed, 0);
    if (scan) {
      return entryFromObjectEntries(slug, scan.entries);
    }
  }
  return { slug, unparseable: true };
};

const entryFromJson = (slug: string, value: unknown): NextraMetaEntry => {
  if (typeof value === "string") {
    return { slug, title: value, unparseable: false };
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const entry: NextraMetaEntry = { slug, unparseable: false };
    if (typeof obj.title === "string") {
      entry.title = obj.title;
    }
    if (typeof obj.type === "string") {
      entry.type = obj.type;
    }
    if (typeof obj.display === "string") {
      entry.display = obj.display;
    }
    if (typeof obj.href === "string") {
      entry.href = obj.href;
    }
    if (typeof obj.newWindow === "boolean") {
      entry.newWindow = obj.newWindow;
    }
    return entry;
  }
  return { slug, unparseable: true };
};

/**
 * Parse a Nextra `_meta` file into ordered entries, or null if no object
 * literal could be located (the caller then moves the file as-is and warns).
 */
export const parseNextraMeta = (
  source: string,
  ext: string
): NextraMetaEntry[] | null => {
  if (ext === ".json") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(source);
    } catch {
      return null;
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return Object.entries(parsed as Record<string, unknown>).map(
      ([slug, value]) => entryFromJson(slug, value)
    );
  }

  const rawEntries = extractObjectEntries(source);
  if (!rawEntries) {
    return null;
  }
  const result: NextraMetaEntry[] = [];
  for (const raw of rawEntries) {
    const kv = splitKeyValue(raw);
    if (kv?.key) {
      result.push(entryFromValue(parseKey(kv.key), kv.value));
    }
  }
  return result;
};

export interface NextraMetaConversion {
  folderMeta: FolderMeta;
  /** Child subfolder slug -> title (Nextra declares a folder's title in its parent). */
  folderTitles: Record<string, string>;
  /** Child page slugs to hide from the sidebar (`display: "hidden"`). */
  hiddenPages: string[];
  /** `type: "page"` entries -> top-nav tabs (only used for the root meta). */
  navPages: { label: string; path: string }[];
  /** Child page slug -> sidebar label (a Nextra `_meta` string title). */
  pageLabels: Record<string, string>;
  warnings: string[];
}

/**
 * Map parsed Nextra entries onto a Blume `FolderMeta` (`pages` ordering) plus
 * the cross-file overrides the orchestrator threads into child `meta.ts` titles
 * and page frontmatter. `hasPage`/`hasDir` report whether a slug resolves to a
 * content file or a subdirectory in this folder.
 */
export const toBlumeFolderMeta = (
  entries: NextraMetaEntry[],
  options: {
    hasDir: (slug: string) => boolean;
    hasPage: (slug: string) => boolean;
  }
): NextraMetaConversion => {
  const pages: string[] = [];
  const folderTitles: Record<string, string> = {};
  const pageLabels: Record<string, string> = {};
  const hiddenPages: string[] = [];
  const navPages: { label: string; path: string }[] = [];
  const warnings: string[] = [];

  for (const entry of entries) {
    const { slug } = entry;
    const label = entry.title ?? slug;

    if (entry.type === "separator") {
      warnings.push(
        `Dropped separator "${label}" — recreate it with a sidebar group if needed.`
      );
      continue;
    }
    if (entry.href) {
      warnings.push(
        `External link "${label}" (${entry.href}) — add it to navbar.links manually.`
      );
      continue;
    }
    if (entry.type === "menu") {
      warnings.push(
        `Dropped navbar menu "${label}" — recreate it via navbar/navigation config.`
      );
      continue;
    }
    if (entry.type === "page") {
      navPages.push({ label, path: slug === "index" ? "/" : `/${slug}` });
      continue;
    }

    const isPage = options.hasPage(slug);
    const isDir = options.hasDir(slug);
    if (!(isPage || isDir)) {
      continue;
    }
    if (entry.display === "hidden") {
      if (isPage) {
        hiddenPages.push(slug);
      }
      continue;
    }

    pages.push(slug);
    if (entry.title) {
      if (isDir) {
        folderTitles[slug] = entry.title;
      } else {
        pageLabels[slug] = entry.title;
      }
    }
  }

  return {
    folderMeta: pages.length > 0 ? { pages } : {},
    folderTitles,
    hiddenPages,
    navPages,
    pageLabels,
    warnings,
  };
};
