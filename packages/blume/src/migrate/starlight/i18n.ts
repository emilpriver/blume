import type { BlumeConfig } from "../../core/schema.ts";
import type { LiteralValue } from "../shared.ts";
import { asLiteralString, isLiteralObject } from "../shared.ts";

/**
 * Map Starlight's `defaultLocale` + `locales` onto Blume's `i18n` config.
 * Starlight keys locales by URL segment (`root` for the un-prefixed default) and
 * carries the BCP-47 tag in `lang`; Blume keys by `code`. The `root` locale maps
 * to the default with `hideDefaultLocalePrefix`, and locale directories under
 * `src/content/docs` line up with Blume's `"dir"` parser.
 */

type I18nConfig = NonNullable<BlumeConfig["i18n"]>;

export const starlightI18n = (
  options: Record<string, LiteralValue>
): I18nConfig | undefined => {
  const locales = isLiteralObject(options.locales)
    ? options.locales
    : undefined;
  if (!locales) {
    return undefined;
  }

  const entries: { code: string; label: string }[] = [];
  let rootCode: string | undefined;
  for (const [key, value] of Object.entries(locales)) {
    const entry = isLiteralObject(value) ? value : undefined;
    const lang = asLiteralString(entry?.lang);
    const label = asLiteralString(entry?.label) ?? key;
    const code = key === "root" ? (lang ?? "en") : (lang ?? key);
    if (key === "root") {
      rootCode = code;
    }
    entries.push({ code, label });
  }
  if (entries.length === 0) {
    return undefined;
  }

  const requested = asLiteralString(options.defaultLocale);
  const fallback = rootCode ?? entries[0]?.code ?? "en";
  const preferred =
    requested === undefined || requested === "root" ? fallback : requested;
  const codes = new Set(entries.map((locale) => locale.code));
  const defaultLocale = codes.has(preferred) ? preferred : fallback;

  return {
    defaultLocale,
    hideDefaultLocalePrefix: true,
    locales: entries,
    parser: "dir",
  };
};
