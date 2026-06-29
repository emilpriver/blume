import type { FolderMeta } from "../../core/schema.ts";

/**
 * Read Nextra `_meta` files (ordering + per-entry config) and map them onto
 * Blume's folder `meta.ts` shape. `_meta.js`/`_meta.ts` are parsed by extracting
 * their default-exported object literal as text — Nextra meta is overwhelmingly
 * a map of string titles and simple config objects — rather than executing user
 * code (matching the other migrators, which never eval). Entries whose value is
 * an expression (JSX title, imported component, computed) keep their slug for
 * ordering but are otherwise flagged `unparseable`.
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

/** Index of a string within a JS source: the close quote matching `s[open]`. */
const findStringEnd = (s: string, open: number): number => {
  const quote = s[open];
  for (let index = open + 1; index < s.length; index += 1) {
    if (s[index] === "\\") {
      index += 1;
      continue;
    }
    if (s[index] === quote) {
      return index;
    }
  }
  return -1;
};

const unescapeString = (inner: string): string =>
  inner.replaceAll(/\\(?<ch>["'`\\nt])/gu, (_match, ch: string) => {
    if (ch === "n") {
      return "\n";
    }
    if (ch === "t") {
      return "\t";
    }
    return ch;
  });

interface ScanResult {
  end: number;
  entries: string[];
}

/** Index of the last char of a `//` or block comment at `index`, else `index`. */
const skipComment = (source: string, index: number): number => {
  if (source[index + 1] === "/") {
    const newline = source.indexOf("\n", index + 2);
    return newline === -1 ? source.length : newline;
  }
  if (source[index + 1] === "*") {
    const close = source.indexOf("*/", index + 2);
    return close === -1 ? source.length : close + 1;
  }
  return index;
};

const pushEntry = (
  entries: string[],
  source: string,
  start: number,
  end: number
): void => {
  const raw = source.slice(start, end).trim();
  if (raw) {
    entries.push(raw);
  }
};

/**
 * Walk a `{…}` object literal starting at `openIndex`, returning the matching
 * close-brace index and the raw `key: value` text of each top-level entry.
 * Quote-, comment-, and bracket-aware so commas/braces nested in strings,
 * arrays, or child objects don't split entries. Returns null if unterminated.
 */
const scanObject = (source: string, openIndex: number): ScanResult | null => {
  let depth = 0;
  const entries: string[] = [];
  let entryStart = openIndex + 1;

  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];

    if (char === '"' || char === "'" || char === "`") {
      const end = findStringEnd(source, index);
      index = end === -1 ? source.length : end;
      continue;
    }
    if (char === "/") {
      const skipped = skipComment(source, index);
      if (skipped !== index) {
        index = skipped;
        continue;
      }
    }
    if (char === "{" || char === "[" || char === "(") {
      depth += 1;
      continue;
    }
    if (char === "}" || char === "]" || char === ")") {
      depth -= 1;
      if (char === "}" && depth === 0) {
        pushEntry(entries, source, entryStart, index);
        return { end: index, entries };
      }
      continue;
    }
    if (char === "," && depth === 1) {
      pushEntry(entries, source, entryStart, index);
      entryStart = index + 1;
    }
  }

  return null;
};

/**
 * Strip `//` and block comments so they don't leak into entry text (the scanner
 * splits on slices, so an inter-entry comment would otherwise attach to the next
 * entry). String literals are preserved verbatim.
 */
const stripJsComments = (source: string): string => {
  let out = "";
  let quote: string | null = null;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      out += char;
      if (char === "\\") {
        out += source[index + 1] ?? "";
        index += 1;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      out += char;
      continue;
    }
    if (char === "/" && source[index + 1] === "/") {
      const newline = source.indexOf("\n", index + 2);
      index = newline === -1 ? source.length - 1 : newline - 1;
      continue;
    }
    if (char === "/" && source[index + 1] === "*") {
      const close = source.indexOf("*/", index + 2);
      index = close === -1 ? source.length - 1 : close + 1;
      out += " ";
      continue;
    }
    out += char;
  }
  return out;
};

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

interface KeyValue {
  key: string;
  value: string;
}

/** Split a raw `key: value` entry at its top-level colon. */
const splitKeyValue = (entry: string): KeyValue | null => {
  let index = 0;
  while (index < entry.length && /\s/u.test(entry[index] ?? "")) {
    index += 1;
  }
  const first = entry[index];
  if (first === "[") {
    // Computed key — not something we can resolve statically.
    return null;
  }

  let key: string;
  if (first === '"' || first === "'" || first === "`") {
    const close = findStringEnd(entry, index);
    if (close === -1) {
      return null;
    }
    key = entry.slice(index, close + 1);
    index = close + 1;
  } else {
    const start = index;
    while (index < entry.length && !/[\s:]/u.test(entry[index] ?? "")) {
      index += 1;
    }
    key = entry.slice(start, index);
  }

  while (index < entry.length && /\s/u.test(entry[index] ?? "")) {
    index += 1;
  }
  if (entry[index] !== ":") {
    return { key, value: "" };
  }
  return { key, value: entry.slice(index + 1).trim() };
};

const parseKey = (key: string): string => {
  const trimmed = key.trim();
  const [quote] = trimmed;
  if (quote === '"' || quote === "'" || quote === "`") {
    const end = findStringEnd(trimmed, 0);
    if (end !== -1) {
      return unescapeString(trimmed.slice(1, end));
    }
  }
  return trimmed;
};

/** Read a clean string literal value, or null if it's an expression. */
const readString = (value: string): string | null => {
  const trimmed = value.trim();
  const [quote] = trimmed;
  if (quote !== '"' && quote !== "'" && quote !== "`") {
    return null;
  }
  if (quote === "`" && trimmed.includes("${")) {
    return null;
  }
  const end = findStringEnd(trimmed, 0);
  if (end === -1 || trimmed.slice(end + 1).trim() !== "") {
    return null;
  }
  return unescapeString(trimmed.slice(1, end));
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
