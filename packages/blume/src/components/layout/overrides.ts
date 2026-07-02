import type { ComponentOverride } from "../../core/define-components.ts";

/**
 * Resolve a layout-slot override to the component Astro should render, falling
 * back to Blume's built-in when no usable override is configured.
 *
 * By the time values reach here, the generated `components.ts` has already turned
 * path strings and hydrated (`client:*`) overrides into imported components /
 * wrappers, so the runtime map holds real components. This handles the remaining
 * cases: a bare component reference, an `IslandDescriptor` (`{ component }`,
 * unwrapped to its component), and — as a safety net for overrides that couldn't
 * be resolved at build time — a leftover string, which falls back to the built-in.
 */
export const resolveSlot = <T>(
  override: ComponentOverride | undefined,
  fallback: T
): T => {
  if (
    override === undefined ||
    override === null ||
    typeof override === "string"
  ) {
    return fallback;
  }
  if (
    typeof override === "object" &&
    "component" in override &&
    override.component !== undefined &&
    override.component !== null
  ) {
    return override.component as T;
  }
  return override as T;
};
