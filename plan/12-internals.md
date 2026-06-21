# 12 — Internal Contracts & Schemas

The conceptual docs (01–11) describe *what* Blume does. This doc pins the precise
*contracts* so the system is buildable: the config types, the `defineComponents`
registry, the `blume.manifest.json` schema, and the `.blume/` generator output.

These are design targets, not frozen APIs — but they're concrete enough to start
M0. Types are illustrative TypeScript.

---

## 1. `blume.config` types

`defineConfig` is identity + types only (no author-time transform).

```ts
export function defineConfig(config: BlumeConfig): BlumeConfig;

type Icon = string | React.ReactNode;          // string = Lucide name (09-I)
type ColorMode = "light" | "dark" | "system";

interface BlumeConfig {
  // Identity
  name?: string;
  description?: string;
  url?: string;                                 // canonical base (SEO/sitemap/OG)
  logo?: string | { light?: string; dark?: string; href?: string; alt?: string; text?: string };
  favicon?: string;

  // Theme (single accent; deeper control = theme.css — 09-L)
  theme?: {
    colors?: { primary?: string };
    defaultMode?: ColorMode;                    // default "system" (dark-first look)
    modeToggle?: boolean;                        // default true
    radius?: "none" | "sm" | "md" | "lg" | (string & {});
    font?: { sans?: string; mono?: string };
    code?: {                                     // Shiki dual-theme + code options
      themes?: { light?: string; dark?: string };  // any Shiki theme id
      lineNumbers?: boolean;                     // default false
      copyButton?: boolean;                      // default true
      langs?: string[];                          // extra languages to preload
    };
  };

  banner?: { content: string; dismissible?: boolean; id?: string };
  sidebar?: { expand?: "multi" | "single" | "all"; persist?: boolean };  // default multi+persist
  toc?: { enabled?: boolean; minDepth?: 2 | 3 | 4; maxDepth?: 2 | 3 | 4 };

  // Navigation (omit = derive from filesystem + meta.json — 09-H)
  navigation?: {
    tabs?: { label: string; path: string; icon?: Icon }[];
    // explicit tree optional; precedence config > meta.json > filesystem
    items?: NavItem[];
  };

  navbar?: {
    links?: { label: string; href: string }[];
    cta?: { label: string; href: string };
    github?: string;                            // "owner/repo"
  };

  footer?: { text?: string; links?: NavItem[] };
  social?: Partial<Record<"x" | "github" | "discord" | "youtube" | "linkedin", string>>;

  search?: { provider?: "pagefind" | "algolia" | "orama" | (string & {}); options?: unknown };

  seo?: {
    titleTemplate?: string;                     // "%s · Acme"
    openGraph?: { image?: string };
    sitemap?: boolean;
    robots?: boolean;
    noindex?: boolean;
    structuredData?: boolean;                   // auto JSON-LD (09-AK)
  };

  feedback?: { enabled?: boolean; comment?: boolean; webhook?: string };  // 09-AJ

  contentDir?: string;                          // default "." (project root — 09-C)
  variables?: Record<string, string>;           // {{ var }} substitution (09-AA)

  // Content collections + feeds (15-content-types.md — 09-AF/AG)
  collections?: Record<string, {
    type: "doc" | "blog" | "changelog";
    path: string;                               // route base
    schema?: unknown;                           // a Zod schema (optional, 09-AG)
    source?:                                     // default = files under `path` (09-AM)
      | { type: "files" }
      | { type: "github"; repo: string; includePrereleases?: boolean };
  }>;
  feeds?: { rss?: boolean; atom?: boolean; json?: boolean; limit?: number };

  git?: {                                        // git-derived page metadata (09-AB)
    lastUpdated?: boolean;
    contributors?: boolean;
    editUrl?: string;                            // "...edit/main/{path}"
  };

  mdx?: {
    remarkPlugins?: unknown[];
    rehypePlugins?: unknown[];
    // feature toggles for the always-on-but-overridable pipeline (09-S)
    features?: Partial<Record<"math" | "mermaid" | "twoslash", boolean>>;
  };

  redirects?: { from: string; to: string; permanent?: boolean }[];

  // AI-native (11-ai.md, 09-T)
  ai?: {
    llmsTxt?: boolean;                          // default true
    rawMarkdown?: boolean;                      // default true
    copyMarkdown?: boolean;                     // default true
    openInLLM?: ("chatgpt" | "claude")[];       // default ["chatgpt","claude"]
    askAI?: {                                   // server-only (09-Z)
      enabled?: boolean;                        // default false; requires output:server
      provider?: string;                        // AI SDK provider; key from server env
      model?: string;
    };
  };

  integrations?: {
    // built-in providers + custom script (09-AH)
    analytics?:
      | { provider: "plausible" | "ga4" | "vercel" | "posthog"; [k: string]: unknown }
      | { provider: "custom"; script: string };
  };

  output?: "auto" | "static" | "server";        // default "auto" (09-B2)
  basePath?: string;                            // subpath deploy, e.g. "/docs" (19)
  trailingSlash?: boolean;                      // default false (19)

  // reserved seam, single value in v1 (09-O)
  i18n?: { defaultLocale: string; locales: string[] };
  versions?: { default: string; list: string[] };
}

interface NavItem {
  label: string;
  href?: string;                                // internal route or external URL
  icon?: Icon;
  badge?: string;
  items?: NavItem[];                            // nested group
}
```

Validation: a Zod schema mirrors this; errors report the offending path
([04-configuration.md](./04-configuration.md)).

---

## 2. `defineComponents` & the registry

Two buckets in, two merged registries out ([05-customization.md](./05-customization.md)).

```ts
export function defineComponents(c: UserComponents): UserComponents;

// lowercase = HTML primitives; Capitalized = named/stdlib components
type MdxComponents = Partial<Record<
  | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  | "p" | "a" | "ul" | "ol" | "li" | "blockquote" | "hr" | "img"
  | "pre" | "code" | "table" | "thead" | "tbody" | "tr" | "th" | "td"
  | "strong" | "em" | "del" | "kbd",
  React.ComponentType<any>
>> & Record<string, React.ComponentType<any>>;   // + Callout, Tabs, TypeTable, …

type LayoutComponents = Partial<Record<
  | "Root" | "PageWrapper" | "Navbar" | "Sidebar" | "SidebarItem" | "Toc"
  | "Footer" | "Logo" | "ThemeToggle" | "SearchButton" | "Breadcrumbs"
  | "Pager" | "EditOnGithub" | "PageMeta" | "Feedback" | "MobileNav" | "Banner"
  | "AskAI" | "PageActions"                        // AI surfaces (11)
  | "BlogList" | "BlogPost" | "ChangelogList",     // collection templates (15)
  React.ComponentType<any>
>>;

interface UserComponents {
  mdx?: MdxComponents;
  layout?: LayoutComponents;
}
```

Merge (generated, see §4):

```ts
const mdxComponents    = { ...defaultMdx,    ...user.mdx };
const layoutComponents = { ...defaultLayout, ...user.layout };
```

Context available to any component:

```ts
function useBlume(): {
  config: BlumeConfig;
  page: { slug: string[]; route: string; frontmatter: Frontmatter; toc: TocItem[] };
  nav: { tree: NavNode[]; activeTrail: string[]; prev?: NavLink; next?: NavLink };
  theme: { mode: ColorMode; resolvedMode: "light" | "dark"; setMode(m: ColorMode): void };
};
```

---

## 3. `blume.manifest.json` schema

Generated at dev startup / build; the runtime reads it and never re-scans the FS.
Carries the version/locale seam (single default in v1 — 09-O).

```ts
interface Manifest {
  schemaVersion: 1;
  site: { name?: string; description?: string; url?: string };

  defaultVersion: string;                       // "default" in v1
  defaultLocale: string;                        // e.g. "en"

  routes: Record<string, RouteEntry>;           // key: URL path, e.g. "/guides/setup"
  nav: NavNode[];                               // sidebar tree
  tabs?: { label: string; path: string; icon?: string }[];
  redirects?: { from: string; to: string; permanent: boolean }[];
  search?: { provider: string };
}

interface RouteEntry {
  file: string;                                 // source path relative to project
  version?: string;                             // reserved; defaults to defaultVersion
  locale?: string;                              // reserved; defaults to defaultLocale
  frontmatter: Frontmatter;
  toc: TocItem[];                               // h2–h3 by default
  layout: "doc" | "landing";                    // 09-U
  draft?: boolean;
  noindex?: boolean;
}

interface Frontmatter {
  title?: string; description?: string; sidebarTitle?: string;
  icon?: string; order?: number; group?: string;
  full?: boolean; layout?: "doc" | "landing";
  [k: string]: unknown;                         // unknown keys preserved
}

interface TocItem { depth: 2 | 3 | 4; text: string; id: string }

interface NavNode {
  type: "page" | "group" | "link" | "divider";
  label?: string;
  route?: string;                               // for "page"
  href?: string;                                // for external "link"
  icon?: string;
  badge?: string;
  children?: NavNode[];                         // for "group"
}
```

Prev/next is computed from the flattened, ordered `nav` (not stored per route).

---

## 4. The `.blume/` generated app

What the generator writes, and the key generated files (illustrative).

```
.blume/
├── app/
│   ├── layout.tsx
│   └── [[...slug]]/page.tsx
├── blume.manifest.json
├── components.generated.ts
├── content.generated.ts
├── next.config.mjs
└── tsconfig.json            # path aliases below
```

### Aliases (tsconfig + bundler)
| Alias | Resolves to |
| --- | --- |
| `@content/*` | the user's content root |
| `@blume/user-config` | the user's `blume.config.ts` |
| `@blume/user-components` | the user's `components.tsx` (or a stub) |
| `@blume/user-theme` | the user's `theme.css` (or empty) |

### `components.generated.ts`
```ts
import { defaultMdx, defaultLayout } from "@blume/components";
import user from "@blume/user-components";       // default export, may be {}
export const mdxComponents    = { ...defaultMdx,    ...(user?.mdx ?? {}) };
export const layoutComponents = { ...defaultLayout, ...(user?.layout ?? {}) };
```

### `content.generated.ts` (build-time bundling — 09-B)
```ts
// route → lazy import of the compiled MDX module (code-split per page)
export const content: Record<string, () => Promise<{ default: React.ComponentType<any>;
  frontmatter: Frontmatter; toc: TocItem[] }>> = {
  "/":            () => import("@content/index.mdx"),
  "/quickstart":  () => import("@content/quickstart.mdx"),
  // …one entry per route in the manifest
};
```

### `app/[[...slug]]/page.tsx`
```tsx
import { renderPage, staticParamsFrom } from "@blume/app/runtime";
import { mdxComponents, layoutComponents } from "../../components.generated";
import { content } from "../../content.generated";
import manifest from "../../blume.manifest.json";

export const dynamicParams = false;
export function generateStaticParams() { return staticParamsFrom(manifest); }

export async function generateMetadata({ params }) {
  return (await import("@blume/app/runtime")).metadataFor(manifest, (await params).slug);
}

export default async function Page({ params }) {
  const slug = (await params).slug ?? [];
  return renderPage({ slug, manifest, content, mdxComponents, layoutComponents });
}
```

### `app/layout.tsx`
```tsx
import { BlumeRoot } from "@blume/app/runtime";
import config from "@blume/user-config";
import { layoutComponents } from "./../components.generated";
import manifest from "../blume.manifest.json";
import "@blume/theme/styles.css";                // default theme (data-slot layer)
import "@blume/user-theme";                       // user theme.css (optional)

export default function RootLayout({ children }) {
  return (
    <BlumeRoot config={config} manifest={manifest} components={layoutComponents}>
      {children}
    </BlumeRoot>
  );
}
```

Everything Blume-owned lives in `@blume/app/runtime` and `@blume/components`; the
generated files are thin glue, which is what keeps **`blume eject`** clean (09-N).

---

## 5. Data flow

```
blume.config.ts ─┐
components.tsx   ├─►  loader (jiti)  ─►  ┌─ content source ─► manifest ──┐
theme.css        │                       │  (discover, route,           │
content/**.mdx ──┘                       │   frontmatter, toc, nav)     │
                                         └─ mdx compile (bundle) ────────┤
                                                                         ▼
                                                       generator writes .blume/*
                                                                         ▼
                                                          next dev / next build
```

- **Loader:** `jiti` for TS config/components outside Next (resolves 09-K toward
  jiti — zero-config TS/ESM, used widely; revisit if JSX edge cases bite).
- **Watch:** body edits → Next HMR; frontmatter/add/move/delete → manifest rebuild;
  config/components/theme change → regen generated files (+ restart if needed).

---

## 6. Still loose (small)
- **K (loader):** leaning `jiti`; `bundle-require` is the fallback if JSX/ESM
  interop in `components.tsx` needs esbuild.
- **N (eject):** `blume eject` copies `.blume/` + inlines `@blume/app` glue into the
  project and swaps aliases for real paths; exact supportability promise TBD.
