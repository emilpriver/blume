import { satteri } from "@astrojs/markdown-satteri";

import { packageInstallPlugin } from "./package-install.ts";

export {
  PACKAGE_MANAGERS,
  type PackageManager,
  toPackageCommands,
} from "./package-commands.ts";
export { packageInstallPlugin } from "./package-install.ts";

/** Element type of Satteri's `mdastPlugins`, sourced from the (alpha) core. */
type MdastPlugin = NonNullable<
  NonNullable<Parameters<typeof satteri>[0]>["mdastPlugins"]
>[number];

/**
 * Sätteri Markdown features Blume enables beyond Astro's defaults. GFM,
 * frontmatter, and smart punctuation are already on; this adds superscript
 * (`^text^`) and subscript (`~text~`), which render to native `<sup>`/`<sub>`.
 *
 * Math, directives, heading attributes, and wikilinks are intentionally left off
 * — they parse but need extra rendering (a KaTeX/MathML step, directive→component
 * mapping, link resolution) before they are useful.
 */
const FEATURES = { subscript: true, superscript: true };

/** Sätteri processor for plain `.md`, with Blume's curated feature set. */
export const blumeMarkdownProcessor = () =>
  satteri({ features: { ...FEATURES } });

/**
 * Sätteri MDX processor: Blume's feature set plus the MDAST plugins (e.g.
 * `package-install`). Used as the `processor` for `@astrojs/mdx` in the generated
 * runtime so the transforms apply to `.mdx` only (leaving plain `.md` on
 * {@link blumeMarkdownProcessor}).
 *
 * The plugin is modeled with minimal structural types; bridge it to Satteri's
 * full `MdastPlugin` type at this single boundary.
 */
export const blumeMdxProcessor = () =>
  satteri({
    features: { ...FEATURES },
    mdastPlugins: [packageInstallPlugin() as unknown as MdastPlugin],
  });
