import type { BlumeConfig } from "../../core/schema.ts";

/** Asset paths referenced by the resolved config (logo, favicon, backgrounds). */
const assetRefs = (config: BlumeConfig): unknown[] => {
  const refs: unknown[] = ["/images"];
  const logo = config.logo as
    | string
    | { dark?: string; light?: string }
    | undefined;
  if (typeof logo === "string") {
    refs.push(logo);
  } else if (logo) {
    refs.push(logo.light, logo.dark);
  }
  const favicon = config.favicon as
    | string
    | { dark?: string; light?: string }
    | undefined;
  if (typeof favicon === "string") {
    refs.push(favicon);
  } else if (favicon) {
    refs.push(favicon.light, favicon.dark);
  }
  refs.push(config.theme?.backgroundImage, config.theme?.backgroundImageDark);
  return refs;
};

/**
 * Top-level path segments referenced as static assets by a Mintlify config
 * (the conventional `/images`, plus logo/favicon/background paths). These are
 * the root-served folders Mintlify exposes at the site root; Blume serves them
 * via `content.assets` (bridge) or relocates them under `public/` (migrator).
 */
export const assetSegments = (config: BlumeConfig): string[] => {
  const segments = new Set<string>();
  for (const ref of assetRefs(config)) {
    if (typeof ref !== "string" || !ref.startsWith("/")) {
      continue;
    }
    const [segment] = ref.replace(/^\/+/u, "").split("/");
    if (segment) {
      segments.add(segment);
    }
  }
  return [...segments];
};
