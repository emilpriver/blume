# 10 — Component Library

Blume ships a complete component library so authors get rich docs with **zero
imports** and **zero setup**. The bar is explicit: **out-of-the-box parity with
both Mintlify and Fumadocs**, built on **shadcn/ui** (Radix + Tailwind v4), and
every component overridable via `components.tsx` ([05](./05-customization.md)).

> This doc is the catalogue + rationale. The **exact prop contracts** for every
> component live in [16-component-api.md](./16-component-api.md).

Two families, matching the two override buckets:

- **`mdx.*`** — components usable inside MDX content (this doc's focus).
- **`layout.*`** — app-shell slots ([06-navigation.md](./06-navigation.md)).

## Content components (`mdx.*`)

### Callouts / admonitions
`Callout` plus semantic aliases `Note`, `Tip`, `Info`, `Warning`, `Check`,
`Danger`. Authored as components **or** via markdown directives
(`> [!NOTE]`, `:::warning`). One `Callout` override restyles them all.

### Structure & disclosure
- `Tabs` / `Tab` — labeled tabbed content; URL-syncable, persisted selection.
- `Steps` / `Step` — numbered procedures (also sugar over ordered lists).
- `Accordion` / `Accordions` — collapsible sections.
- `Expandable` — inline expandable rows (great for nested fields).

### Cards & layout
- `Card` — title, icon, description, optional `href` (link card).
- `Cards` / `Columns` — responsive grid wrapper (`columns` count).
- `Frame` — bordered/captioned media container.

### Code
- Fenced code blocks with: titles, line numbers, line/range/word highlight, diff,
  focus, and a copy button (all via the Shiki pipeline in
  [03-content-pipeline.md](./03-content-pipeline.md)).
- `CodeGroup` — tabbed multi-language code blocks.
- `DynamicCodeBlock` — runtime-provided code (e.g. generated snippets).
- Twoslash TS hovers (default-on status: **09-S**).

### API reference *(components in v1; OpenAPI generation post-1.0 — resolved 09-Q)*
The **components** ship in v1; full **OpenAPI-spec → auto-generated reference** is
post-1.0.
- `TypeTable` — document a type's fields (name, type, default, description).
- `AutoTypeTable` — generate a `TypeTable` from a real TS type/interface.
- `ParamField` / `ResponseField` — request params / response fields.
- `RequestExample` / `ResponseExample` — paired example panels.
- `Panel` — right-rail example container for reference pages.

### Media & misc
- `Mermaid` — diagrams from ```mermaid``` fences (client-rendered).
- `ImageZoom` — click-to-zoom images (could be the default `img` behavior).
- `Tooltip` — inline hover tooltips.
- `Icon` — render an icon by Lucide name (`<Icon name="rocket" />`) or pass any
  React node for custom/brand icons (resolved 09-I). Overridable.
- `Update` — changelog/release entry block.
- `Banner` — site/page-level announcement bar (also a `layout` slot).
- `InlineTOC` — inline table of contents for long pages.
- `GithubInfo` — repo stars/info card.
- `Snippet` — reusable MDX partial include (`_`-prefixed files, see
  [03](./03-content-pipeline.md)).

### Landing / home page *(resolved 09-U)*
A small set of primitives for the optional first-class landing/home page — enough
for a polished entry page, not a full marketing-site system:
- `Hero` — headline, subtitle, CTAs, optional visual.
- `FeatureGrid` / reuse of `Cards`/`Columns` — feature highlights.
- `CTA` — call-to-action band.
A page opts into the full-bleed landing layout via frontmatter (`layout: "landing"`,
see [03-content-pipeline.md](./03-content-pipeline.md)); the rest of the docs chrome
(narrow column, TOC) is suppressed.

## Parity matrix (out-of-the-box)

✅ shipped · ⚠️ scope/decision pending · — n/a

| Component | Mintlify | Fumadocs | Blume |
| --- | :---: | :---: | :---: |
| Callout / Note / Warning / Info / Tip / Check / Danger | ✅ | ✅ | ✅ |
| Accordion(s) / AccordionGroup | ✅ | ✅ | ✅ |
| Tabs / Tab | ✅ | ✅ | ✅ |
| Steps / Step | ✅ | ✅ | ✅ |
| Card / Cards / CardGroup / Columns | ✅ | ✅ | ✅ |
| Frame | ✅ | — | ✅ |
| CodeGroup | ✅ | ✅ | ✅ |
| Code features (title, highlight, diff, copy) | ✅ | ✅ | ✅ |
| Twoslash (TS hovers) | — | ✅ | ✅ |
| TypeTable | — | ✅ | ✅ |
| AutoTypeTable | — | ✅ | ✅ |
| ParamField / ResponseField | ✅ | — | ✅ |
| RequestExample / ResponseExample / Panel | ✅ | — | ✅ |
| Expandable | ✅ | — | ✅ |
| Files / File / Folder | — | ✅ | ✅ |
| Mermaid | ✅ | ✅ | ✅ |
| Math / LaTeX | ✅ | ✅ | ✅ |
| ImageZoom | — | ✅ | ✅ |
| Tooltip | ✅ | — | ✅ |
| Icon | ✅ | — | ✅ |
| Update / changelog | ✅ | — | ✅ |
| Banner | — | ✅ | ✅ |
| InlineTOC | — | ✅ | ✅ |
| GithubInfo | — | ✅ | ✅ |
| Snippet / reusable include | ✅ | — | ✅ |
| Full OpenAPI → API reference generation | ✅ | partial | ⏳ post-1.0 (09-Q) |

## Prop API conventions — ✅ RESOLVED (09-R): own API + codemods

Blume designs its **own** clean, consistent prop API (one mental model across all
components — e.g. a single `Callout` `type` enum, uniform `icon`/`title`/`href` on
cards). To keep migration friction low, Blume ships **codemods**:

```
blume migrate mintlify   # rewrites Mintlify MDX/components to Blume's API
blume migrate fumadocs   # rewrites Fumadocs MDX/components to Blume's API
```

The codemods handle component renames, prop renames, and admonition-syntax
differences where mechanically possible, and flag the rest. This gives us design
freedom without punishing switchers — a core GTM lever. See [02-cli.md](./02-cli.md).

## Built on shadcn/ui

Each component composes shadcn/ui primitives, e.g.:

| Blume component | shadcn primitives |
| --- | --- |
| `Tabs` | `tabs` |
| `Accordion(s)` | `accordion` |
| `Tooltip` | `tooltip`, `hover-card` |
| `Card(s)` | `card` |
| `CodeGroup` | `tabs` + code block |
| `Callout` | `alert` |
| `Expandable` | `collapsible` |
| `TypeTable` / fields | `table` |

Because components are shadcn-based, the override and **eject** stories are
coherent: a Blume component is a shadcn-style component you can pull into your own
project and edit — see the registry question in **09-P**.

## Overriding & composing

All components live in the `mdx` registry. Override any of them in
`components.tsx`:

```tsx
import { defineComponents } from "blume";
import { Callout as DefaultCallout } from "blume/components";

export default defineComponents({
  mdx: {
    Callout: (props) => <DefaultCallout {...props} className="rounded-2xl" />,
    TypeTable: MyTypeTable,
  },
});
```

Adding **brand-new** MDX components (not just overriding) uses the same mechanism —
any extra key in `mdx` becomes available in MDX globally. Per-section scoping is a
post-1.0 idea ([05](./05-customization.md)).
