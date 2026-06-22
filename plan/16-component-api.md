# Component API

## Goals

The component API should let users customize Blume without learning generated runtime internals.

It must support:

- Astro components
- React islands
- MDX component mapping
- layout slots
- typed props
- source registry installs

## Public entrypoint

```ts
import { defineComponents } from "blume";

export default defineComponents({
  mdx: {},
  layout: {},
  islands: {},
});
```

## Component references

Supported reference forms:

```ts
import Callout from "./components/callout.astro";
import Search from "./components/search.tsx";

export default defineComponents({
  mdx: {
    Callout,
  },
  layout: {
    Search: {
      component: Search,
      client: "load",
    },
  },
});
```

String paths may be supported for config-driven installs:

```ts
export default defineComponents({
  layout: {
    Footer: "./components/footer.astro",
  },
});
```

Imported references are preferred for type checking.

## Hydration descriptor

```ts
type ClientHydration =
  | "load"
  | "idle"
  | "visible"
  | "media"
  | "only";

type IslandDescriptor<TComponent> = {
  component: TComponent;
  client: ClientHydration;
  media?: string;
};
```

Blume generates Astro wrappers that apply the hydration directive.

## MDX components

Built-in names:

- `Callout`
- `Card`
- `CardGroup`
- `Steps`
- `Tabs`
- `Tab`
- `Accordion`
- `CodeGroup`
- `FileTree`
- `Badge`
- `Icon`
- `Endpoint`
- `ParameterTable`

MDX override keys should be stable public API.

## Layout slots

Layout slots:

- `Layout`
- `Header`
- `Logo`
- `Sidebar`
- `MobileNav`
- `Search`
- `TableOfContents`
- `Breadcrumbs`
- `PageHeader`
- `PageFooter`
- `Pagination`
- `Footer`

Slot props should be documented and versioned.

## Prop contracts

Prop contracts should be exported from `blume/components`.

Example:

```ts
import type { CalloutProps } from "blume/components";
```

The types should describe data, not force React-specific types into Astro components.

Prefer:

```ts
type CalloutProps = {
  type?: "info" | "warning" | "success" | "danger";
  title?: string;
};
```

Children/slots are framework-specific and should be documented per implementation style.

## Icon input

```ts
type IconInput =
  | string
  | {
      component: unknown;
      client?: ClientHydration;
    };
```

Frontmatter should use strings. Config can use component references.

## Versioning

Component prop contracts need semver discipline.

Breaking changes:

- renaming component keys
- removing props
- changing required props
- changing slot semantics

Non-breaking changes:

- adding optional props
- adding component keys
- adding layout slots

## Diagnostics

Component errors should identify:

- component key
- source file
- expected prop contract where possible
- hydration mismatch
- missing framework integration

Example:

```txt
Component override "layout.Search" points to a React component, but no hydration mode is configured.

Fix:
  Search: { component: Search, client: "load" }
```
