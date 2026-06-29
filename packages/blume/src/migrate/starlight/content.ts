import { renameTag, rewriteCallouts } from "../shared.ts";

/**
 * Source-to-source rewrites that turn Starlight-only MDX into idiomatic Blume
 * markup. Runs once at migration time — no Starlight-aware plugins remain in the
 * Blume runtime.
 */

const STARLIGHT_IMPORT =
  /^import\s+[\s\S]*?\s+from\s+["']@astrojs\/starlight(?:\/[^"']*)?["'];?[ \t]*\n?/gmu;

/**
 * Drop `import … from "@astrojs/starlight/components"` (and other subpaths).
 * Blume injects its components globally, so these imports would fail to resolve
 * once the Starlight packages are gone.
 */
export const stripStarlightImports = (source: string): string => {
  const stripped = source.replace(STARLIGHT_IMPORT, "");
  // Collapse the blank gap a removed import block leaves behind.
  return stripped === source ? source : stripped.replaceAll(/\n{3,}/gu, "\n\n");
};

/** Starlight `<Aside type="X">` values mapped to Blume directive names. */
const ASIDE_TYPE_DIRECTIVES: Record<string, string> = {
  caution: "caution",
  danger: "danger",
  note: "note",
  tip: "tip",
};

/**
 * Convert Starlight `<Aside type="note|tip|caution|danger" title="…">`
 * components into Blume `:::` directives. A bare `<Aside>` becomes `:::note`.
 * (Plain `:::`-syntax asides already pass through unchanged — Blume's directive
 * set covers all four types, with `caution` aliased to `warning`.)
 */
export const rewriteStarlightAsides = (source: string): string =>
  rewriteCallouts(source, {
    defaultDirective: "note",
    tagDirectives: {},
    tags: ["Aside"],
    typeDirectives: ASIDE_TYPE_DIRECTIVES,
  });

/**
 * Rename Starlight container components to their Blume equivalents, then move
 * each `<Tab>`'s `label` onto the `title` prop Blume reads. `LinkCard` folds into
 * `Card` (which renders an `href`); its `description` has no Card prop and is
 * dropped. `CardGrid`'s `stagger` layout flag has no equivalent and is left on
 * the tag harmlessly (Blume ignores unknown attributes).
 */
export const rewriteStarlightComponents = (source: string): string => {
  let out = renameTag(source, "CardGrid", "CardGroup");
  out = renameTag(out, "LinkCard", "Card");
  out = renameTag(out, "TabItem", "Tab");
  // Starlight selects a tab label with `label=`; Blume's `<Tab>` uses `title=`.
  out = out.replaceAll(
    /(?<tab><Tab\b[^>]*?)\blabel(?<eq>\s*=)/gu,
    "$<tab>title$<eq>"
  );
  return out;
};

/** Starlight components with no drop-in Blume equivalent — flagged for review. */
const UNSUPPORTED_COMPONENTS = ["Code", "FileTree", "LinkButton", "Steps"];

/** Names of Starlight components in `source` that need manual attention. */
export const unsupportedStarlightComponents = (source: string): string[] =>
  UNSUPPORTED_COMPONENTS.filter((name) =>
    new RegExp(`<${name}\\b`, "u").test(source)
  );

const ASSET_ALIAS =
  /(?:!\[[^\]]*\]\(|\bsrc\s*=\s*["'])(?<path>[~@]\/[^"')\s]+)/u;

/** True when the source references images via Starlight's `~/`/`@/` aliases. */
export const hasAliasedAssets = (source: string): boolean =>
  ASSET_ALIAS.test(source);
