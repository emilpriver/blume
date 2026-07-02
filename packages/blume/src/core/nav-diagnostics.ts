import { hasIcon } from "../theme/icons.ts";
import type { Diagnostic, NavNode, Navigation } from "./types.ts";

/**
 * Navigation diagnostics: catch icon typos and structural mistakes (missing
 * pages, duplicate labels) that otherwise fail silently — a wrong icon just
 * doesn't render, a bad tab path just 404s. Run over the built navigation so it
 * covers every source (config, folder meta, frontmatter) at once.
 */

const IMAGE_ICON =
  /^(?:https?:\/\/|data:image\/|\/|\.{1,2}\/)|\.(?:avif|gif|jpe?g|png|svg|webp)$/iu;

/** Whether an icon string is an asset (image/URL/inline SVG), not a set name. */
const isAssetIcon = (value: string): boolean =>
  value.startsWith("<") || IMAGE_ICON.test(value);

/** Flatten a sidebar tree to every node, descending into groups. */
const flattenNodes = (nodes: NavNode[]): NavNode[] =>
  nodes.flatMap((node) =>
    node.kind === "group" ? [node, ...flattenNodes(node.children)] : [node]
  );

/** Every icon string referenced anywhere in the navigation, with a label. */
const collectIcons = (
  navigation: Navigation
): { icon: string; where: string }[] => {
  const icons: { icon: string; where: string }[] = [];
  const push = (icon: string | undefined, where: string): void => {
    if (icon) {
      icons.push({ icon, where });
    }
  };
  for (const tab of navigation.tabs) {
    push(tab.icon, `tab "${tab.label}"`);
    for (const item of tab.items ?? []) {
      push(item.icon, `tab item "${item.label}"`);
    }
  }
  for (const selector of navigation.selectors) {
    for (const item of selector.items) {
      push(item.icon, `selector "${item.label}"`);
    }
  }
  const sidebars = [
    navigation.sidebar,
    ...navigation.sidebarVariants.map((variant) => variant.sidebar),
  ];
  for (const sidebar of sidebars) {
    for (const node of flattenNodes(sidebar)) {
      push(node.icon, `"${node.label}"`);
    }
  }
  return icons;
};

/** Warn about icon names that aren't in Blume's set (skipping image/SVG icons). */
export const validateNavIcons = (navigation: Navigation): Diagnostic[] => {
  const seen = new Set<string>();
  const diagnostics: Diagnostic[] = [];
  for (const { icon, where } of collectIcons(navigation)) {
    if (isAssetIcon(icon) || hasIcon(icon) || seen.has(icon)) {
      continue;
    }
    seen.add(icon);
    diagnostics.push({
      code: "BLUME_UNKNOWN_ICON",
      message: `Unknown icon "${icon}" (${where}) — it isn't in Blume's icon set.`,
      severity: "warning",
      suggestion:
        "Use a built-in icon name, an image path/URL, or inline SVG markup.",
    });
  }
  return diagnostics;
};
