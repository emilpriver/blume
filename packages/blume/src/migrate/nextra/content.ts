import { rewriteCallouts } from "../shared.ts";

/**
 * Source-to-source rewrites that turn Nextra-only MDX into idiomatic Blume
 * markup. Runs once at migration time.
 */

/** Nextra `<Callout type="X">` values mapped to Blume directive names. */
const CALLOUT_TYPE_DIRECTIVES: Record<string, string> = {
  default: "note",
  error: "danger",
  info: "info",
  warning: "warning",
};

/**
 * Convert Nextra `<Callout>` components (with an optional `type`) into Blume
 * `:::` directives. A bare `<Callout>` becomes `:::note`; the `emoji` prop is
 * dropped.
 */
export const rewriteNextraCallouts = (source: string): string =>
  rewriteCallouts(source, {
    defaultDirective: "note",
    tagDirectives: {},
    tags: ["Callout"],
    typeDirectives: CALLOUT_TYPE_DIRECTIVES,
  });

const NEXTRA_IMPORT =
  /^import\s+[\s\S]*?\s+from\s+["']nextra(?:\/[^"']*)?["'];?[ \t]*\n?/gmu;

/**
 * Drop `import … from "nextra/…"` statements. Blume injects its components
 * globally, so these imports would fail to resolve once `nextra` is gone.
 */
export const stripNextraImports = (source: string): string =>
  source.replace(NEXTRA_IMPORT, "");

/** Nextra components with no drop-in Blume equivalent — flagged for review. */
const UNSUPPORTED_COMPONENTS = ["Bleed", "Cards", "FileTree", "Steps", "Tabs"];

/** Names of Nextra components in `source` that need manual attention. */
export const unsupportedNextraComponents = (source: string): string[] =>
  UNSUPPORTED_COMPONENTS.filter((name) =>
    new RegExp(`<${name}\\b`, "u").test(source)
  );
