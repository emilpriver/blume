# 16 — Component API Reference

The exact prop contracts for Blume's stdlib components — the concrete form of "our
own clean API" (resolved 09-R). The catalogue and parity rationale live in
[10-components.md](./10-components.md); this doc pins the props so the components are
buildable and so overrides ([05](./05-customization.md)) know what shape to honor.

Illustrative TypeScript. All components are in the `mdx` registry unless noted.

## Conventions

A few rules keep the whole library consistent (the win over inheriting Mint's/Fuma's
mixed conventions):

- **Icons:** any icon prop is `icon?: IconInput` where `IconInput = string |
  ReactNode` — a Lucide name or a node (resolved 09-I).
- **Variants:** a component's kind is a lowercase string union on `type`.
- **Titles/links:** `title?: string`, `href?: string`, `description?: ReactNode`.
- **Disclosure state:** `defaultOpen?: boolean`; persistence `persist?: boolean`.
- **Children** carry the body; props carry metadata. Everything accepts
  `className` and `id`.

```ts
type IconInput = string | React.ReactNode;
interface Base { className?: string; id?: string; children?: React.ReactNode }
```

## Callouts

```ts
type CalloutType = "note" | "tip" | "info" | "warning" | "check" | "danger";

interface CalloutProps extends Base {
  type?: CalloutType;        // default "note"
  title?: string;
  icon?: IconInput;          // overrides the type's default icon
}
```

`<Note>`, `<Tip>`, `<Info>`, `<Warning>`, `<Check>`, `<Danger>` are thin aliases —
each is `<Callout type="…">` with the rest of the props. Also producible from
markdown directives (`> [!NOTE]`, `:::warning`).

## Structure & disclosure

```ts
interface TabsProps extends Base {
  defaultValue?: string;     // value of the initially-active tab
  syncKey?: string;          // tabs sharing a key switch together site-wide
  persist?: boolean;         // remember selection (default false)
}
interface TabProps extends Base {
  label: string;             // tab button text
  value?: string;            // defaults to label
  icon?: IconInput;
}

interface StepsProps extends Base {}          // ordered container (also list sugar)
interface StepProps extends Base {
  title?: string;
  icon?: IconInput;
}

interface AccordionsProps extends Base {
  type?: "single" | "multiple";   // default "single"
}
interface AccordionProps extends Base {
  title: string;
  icon?: IconInput;
  defaultOpen?: boolean;
}

interface ExpandableProps extends Base {       // inline expandable (e.g. nested fields)
  title: string;
  defaultOpen?: boolean;
}
```

## Cards & layout

```ts
interface CardProps extends Base {
  title?: string;
  description?: React.ReactNode;
  icon?: IconInput;
  href?: string;             // makes the whole card a link
  external?: boolean;        // force new-tab + indicator (else inferred)
  cta?: string;              // optional call-to-action label
}
interface CardsProps extends Base {
  columns?: 1 | 2 | 3 | 4;   // responsive grid (default 2)
}
type ColumnsProps = CardsProps;               // alias

interface FrameProps extends Base {
  caption?: string;
}
```

## Code

Fenced code blocks are configured through **meta** strings (parsed by the Shiki
pipeline, [03](./03-content-pipeline.md)); defaults come from `config.theme.code`:

````md
```ts title="server.ts" {2-4} showLineNumbers /foo/ twoslash
````

| Meta | Effect |
| --- | --- |
| `title="…"` | code block title bar |
| `{1,3-5}` | line highlight |
| `/word/` | word highlight |
| `showLineNumbers` / `noLineNumbers` | override the config default |
| `diff` (via `// [!code ++]` / `--`) | diff markers |
| `twoslash` | TS type-on-hover |

```ts
interface CodeGroupProps extends Base {}       // wraps multiple code blocks → tabs
                                               // (tab labels come from each block's title)
interface DynamicCodeBlockProps extends Base { // runtime-provided code
  code: string;
  lang?: string;
  title?: string;
}
```

## API reference *(components in v1; OpenAPI generation post-1.0 — 09-Q)*

```ts
interface TypeField {
  type: string;
  description?: React.ReactNode;
  default?: string;
  required?: boolean;
  deprecated?: boolean;
}
interface TypeTableProps extends Base {
  type: Record<string, TypeField>;   // field name → metadata
}
interface AutoTypeTableProps extends Base {
  path: string;                      // file to read the type from
  name: string;                      // exported type/interface name
  lang?: "ts";
}

interface ParamFieldProps extends Base {
  // location (exactly one): path | query | header | body
  path?: string; query?: string; header?: string; body?: string;
  type?: string;
  required?: boolean;
  default?: string;
  deprecated?: boolean;
}
interface ResponseFieldProps extends Base {
  name: string;
  type?: string;
  required?: boolean;
  default?: string;
}

interface RequestExampleProps extends Base {}  // right-rail example container
interface ResponseExampleProps extends Base {}
interface PanelProps extends Base {}           // generic right-rail panel
```

## Media & misc

```ts
interface MermaidProps extends Base { chart?: string; title?: string }  // or ```mermaid fence
interface ImageZoomProps extends Base {                                  // also default <img> behavior
  src: string; alt?: string; width?: number; height?: number;
}
interface TooltipProps extends Base { tip: React.ReactNode }
interface IconProps { name?: string; icon?: IconInput; size?: number; className?: string }
interface UpdateProps extends Base {            // changelog entry
  label: string;                                // version/date label
  description?: string;
  tags?: string[];
}
interface BannerProps extends Base {            // also a layout slot (config.banner)
  id?: string;                                  // remembers dismissal
  dismissible?: boolean;
}
interface InlineTOCProps extends Base { minDepth?: 2 | 3 | 4; maxDepth?: 2 | 3 | 4 }
interface GithubInfoProps { repo: string; className?: string }          // "owner/name"
interface SnippetProps { file: string }                                 // include a _partial
```

## Landing primitives *(resolved 09-U)*

```ts
interface HeroProps extends Base {
  title: string;
  subtitle?: React.ReactNode;
  actions?: { label: string; href: string; variant?: "primary" | "secondary" }[];
  image?: string;
}
interface FeatureGridProps extends Base { columns?: 2 | 3 | 4 }          // contains Cards
interface CTAProps extends Base {
  title?: string;
  action?: { label: string; href: string };
}
```

## Layout slots (props = Blume context)

`layout.*` components are structural and receive resolved data rather than authored
props; they all also have access to `useBlume()` ([12-internals.md](./12-internals.md)).
Representative contracts:

```ts
interface NavbarProps  { config: BlumeConfig; nav: NavState }
interface SidebarProps { nav: NavState }                 // tree + active trail
interface TocProps     { items: TocItem[] }
interface PagerProps   { prev?: NavLink; next?: NavLink }
interface PageMetaProps { lastUpdated?: string; editUrl?: string; contributors?: Contributor[] }
interface FeedbackProps { route: string }                // emits analytics events (09-AJ)
interface BlogListProps { posts: CollectionEntry[] }     // collection templates (15)
interface BlogPostProps { post: CollectionEntry }
interface ChangelogListProps { entries: CollectionEntry[] }
```

Full layout-slot list in [05-customization.md](./05-customization.md); these are the
shapes overrides receive.

## Override example

The props above are the contract an override must accept:

```tsx
import { defineComponents } from "blume";
export default defineComponents({
  mdx: {
    Callout: ({ type = "note", title, icon, children }) => (
      <aside data-callout={type}>{title && <strong>{title}</strong>}{children}</aside>
    ),
  },
});
```
