# 05 — Customization (`components.tsx`)

This is Blume's signature feature and its biggest differentiator. A single
`components.tsx` lets you override **any** component — both the markdown renderer's
primitives and the application shell — while keeping Blume's defaults for
everything you don't touch.

## The API

Overrides are grouped into two explicit buckets: **`mdx`** (everything rendered
inside the markdown) and **`layout`** (the application chrome).

```tsx
// components.tsx
import { defineComponents } from "blume";

export default defineComponents({
  // mdx → markdown primitives + built-in MDX components
  mdx: {
    h1: ({ children, ...props }) => (
      <h1 className="font-display text-4xl" {...props}>{children}</h1>
    ),
    Callout: ({ type, children }) => (
      <div data-callout={type} className="rounded-xl border p-4">{children}</div>
    ),
  },

  // layout → application shell slots
  layout: {
    Navbar: (props) => <MyCustomNavbar {...props} />,
  },
});
```

The user's earlier sketch — `{ h1: ({ children }) => <h1>{children}</h1> }` — now
lives under the `mdx` bucket. `defineComponents` returns a typed registry and
exists for types/autocomplete; the default export is what Blume reads.

> **RESOLVED (was 09-D):** grouped object over case-based keys. It's more
> discoverable, self-documents the markdown-vs-chrome split, and avoids ambiguity
> for edge-case names. Internally this maps to two registries (below).

## Why one file overrides both markdown and chrome

Blume keeps two registries (see [01-architecture.md](./01-architecture.md)) and
merges your buckets into them:

```ts
const mdxComponents    = { ...defaultMdx,    ...userComponents.mdx };
const layoutComponents = { ...defaultLayout, ...userComponents.layout };
```

`mdxComponents` is handed to the MDX renderer (for `h1`, `code`, `Callout`, …);
`layoutComponents` is handed to the app shell (for `Navbar`, `Sidebar`, `Toc`,
…). Override a key in either bucket and every consumer uses your version;
everything you don't override stays default.

## Key namespaces

### `mdx.*` — markdown primitives
`h1`–`h6`, `p`, `a`, `ul`, `ol`, `li`, `blockquote`, `hr`, `img`, `pre`, `code`,
`table`, `thead`, `tbody`, `tr`, `th`, `td`, `strong`, `em`, `del`, `kbd`.

### `mdx.*` — built-in components (the MDX stdlib)
`Callout`, `Note`, `Tip`, `Warning`, `Card`, `Cards`, `Tabs`, `Tab`, `Steps`,
`Step`, `CodeGroup`, `Accordion`, `Accordions`, `Frame`, `Files`, `File`, `Folder`.

### `layout.*` — app-shell slots
`Root`/`PageWrapper`, `Navbar`, `Sidebar`, `SidebarItem`, `Toc`, `Footer`,
`Logo`, `ThemeToggle`, `SearchButton`, `Breadcrumbs`, `Pager` (prev/next),
`EditOnGithub`, `PageMeta` (git-derived footer), `Feedback`, `MobileNav`,
`Banner`, `AskAI`, `PageActions`, and collection templates (`BlogList`,
`BlogPost`, `ChangelogList`).

> Convention: lowercase keys are HTML primitives, Capitalized keys are named
> components — the **bucket** (`mdx` vs `layout`) decides where they're consumed.

## Context: reading Blume state inside overrides

Overrides receive props, but also have access to a hook for site/page state:

```tsx
import { useBlume } from "blume/react";

function MyNavbar() {
  const { config, page, nav, theme } = useBlume();
  // config: resolved blume.config
  // page:   current route's frontmatter, toc, slug
  // nav:    navigation tree + active trail
  // theme:  current mode + setMode()
  return /* ... */;
}
```

This lets custom chrome stay fully data-driven without prop-drilling.

## Server vs. client overrides

The runtime is RSC-first. Default components are server components where possible.
**An override that uses state, effects, or browser APIs must be a client
component** (`"use client"` at the top of the file or component module).

- We document this prominently and give a clear error/lint when an override uses
  hooks without `"use client"`.
- The default interactive components (theme toggle, tabs, search, mobile nav) are
  already client components; overriding them with a client component is seamless.

> **RESOLVED (09-E):** users mark their own client overrides with `"use client"`.
> Blume does **not** auto-wrap — instead it gives a precise, friendly error (plus a
> `blume doctor` check) when an override uses hooks/browser APIs without the
> directive. Honest and predictable over magical. Error UX spec:
> [18-errors.md](./18-errors.md).

## Composing with defaults

Sometimes you want to wrap, not replace. Blume exports its defaults so you can
build on them:

```tsx
import { defineComponents } from "blume";
import { Callout as DefaultCallout } from "blume/components";

export default defineComponents({
  mdx: {
    Callout: (props) => <DefaultCallout {...props} className="my-shadow" />,
  },
});
```

## Deep customization: `blume add` (the registry path)

`components.tsx` is the fast path — wrap or replace by reference. When you want to
**own and edit a component's source**, run `blume add <component>` (resolved 09-P).
Backed by Blume's shadcn-compatible registry, it copies the editable shadcn-style
source into your project and wires it into the right registry bucket. Because the
defaults are built on shadcn/ui ([10-components.md](./10-components.md)), this feels
exactly like adding any shadcn component — and it's the same source you'd carry out
via `blume eject`.

So the customization spectrum is:
**`theme.css` (tokens) → `components.tsx` (wrap/replace) → `blume add` (own the source)**.

## Styling without React

For users who only want to restyle, `theme.css` (CSS variables / tokens) covers
most needs without touching `components.tsx`. See [07-theming.md](./07-theming.md).
The ladder: **config theme → `theme.css` → `components.tsx` → `blume add`**.

## Future: scoped overrides

Possible later additions (not v0), captured for direction:
- **Per-route / per-section overrides** (e.g. different `Callout` under `/api`).
- **Slot props** for finer control without full replacement (e.g. `Navbar` accepts
  `start`/`center`/`end` slots).
- **`registerComponents`** to add brand-new MDX components (vs. only overriding).
  Likely just an extension of `defineComponents` with new Capitalized keys.
