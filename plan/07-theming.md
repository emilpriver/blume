# Theming

## Goals

Blume's default theme should feel production-ready without requiring user design work.

It should be:

- fast
- accessible
- responsive
- neutral enough for many brands
- easy to customize with tokens
- source-customizable through the registry
- independent of a user Tailwind setup

## Stack

Default theme stack:

- Astro components
- CSS variables
- Tailwind v4 for Blume's internal source styles
- small React islands only where interactivity benefits from React
- Lucide icons
- system fonts by default

The user should not need Tailwind configured in their project unless they opt into source-level theme editing.

## Tokens

Core tokens:

```css
:root {
  --blume-background: white;
  --blume-foreground: oklch(0.2 0 0);
  --blume-muted: oklch(0.96 0 0);
  --blume-muted-foreground: oklch(0.48 0 0);
  --blume-border: oklch(0.9 0 0);
  --blume-accent: oklch(0.62 0.16 190);
  --blume-accent-foreground: white;
  --blume-radius: 0.5rem;
  --blume-code-background: oklch(0.97 0 0);
}
```

Dark mode:

```css
:root[data-theme="dark"] {
  --blume-background: oklch(0.16 0 0);
  --blume-foreground: oklch(0.96 0 0);
}
```

## Theme config

```ts
theme: {
  accent: "teal",
  radius: "md",
  mode: "system",
  layout: "sidebar",
}
```

Config should compile to CSS variables where possible.

## CSS layering

Order:

1. Blume reset/base
2. Blume component styles
3. Blume theme preset
4. user `theme.css`
5. component-local styles

Generated Astro runtime should import this order deterministically.

## Fonts

Default:

- system UI stack
- monospace system stack for code

Optional:

- local font files through assets
- configured remote CSS import
- Vercel/font-like helpers can be explored later, but avoid a Next-specific dependency

## Dark mode

Support:

- `system`
- `light`
- `dark`
- user toggle

The toggle should be an island only if it needs persisted client state. The static fallback should render correctly before hydration.

## Source themes

`blume add theme-<name>` should install source files:

```txt
theme.css
components/
  layout.astro
  sidebar.astro
  search-button.tsx
components.ts
```

Themes should be additive and inspectable.

## Accessibility

Theme requirements:

- visible focus states
- keyboard navigation for sidebar/search/tabs
- no color-only status states
- good contrast in light and dark modes
- reduced motion support
- skip link
- semantic landmarks

## Performance

The default theme should:

- ship minimal JavaScript
- hydrate only interactive islands
- avoid layout shift
- inline or preload critical CSS as appropriate
- keep search payload bounded
- avoid large icon bundles
