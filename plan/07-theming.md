# 07 — Theming

## Foundation: shadcn/ui + Tailwind v4

Blume's default components are built on **shadcn/ui** (Radix primitives + Tailwind
v4). This is a natural fit for our existing decisions:

- shadcn/ui is **already CSS-variable-driven** (`--background`, `--foreground`,
  `--primary`, `--radius`, …), which is exactly the token model we want for the
  `theme.css` rung. We adopt shadcn's variable contract as the base layer and
  expose `--blume-*` aliases for Blume-specific tokens (layout widths, prose).
- shadcn/ui is **copy-owned, not a black-box dependency** — the same "you own it"
  ethos as Blume. This makes the eject story coherent: a Blume component *is* a
  shadcn-style component you can take with you.
- It's the de-facto standard for modern React UI, so overrides feel familiar and
  users can pull any shadcn component into their `components.tsx`.

How shadcn ships inside a framework that hides the app is **resolved (09-P)**: Blume
exposes a **shadcn registry** so `blume add <name>` copies an editable component into
the user's project, on top of reference-based overrides. The token/theming model
below is independent of that and holds either way.

Theming has three rungs, escalating only as needed:

1. **`blume.config.ts` `theme`** — accent color, mode, radius, fonts. Covers most
   brand needs with zero CSS. (Maps onto shadcn's base CSS variables.)
2. **`theme.css`** — override design tokens (CSS variables) directly; restyle
   without writing React.
3. **`components.tsx`** — replace components outright ([05](./05-customization.md)).

## Default look: docs.x.ai aesthetic (resolved 09-V)

The default theme targets the **docs.x.ai** aesthetic: minimal, high-contrast,
monochrome-leaning, developer-focused. Concretely:

- **Mood:** restrained and technical — content-forward, almost no decorative color.
- **Color:** near-monochrome (true-black/near-white surfaces), a single subtle
  accent, dark mode as a first-class peer (likely default). Borders over shadows.
- **Shape:** sharp — small radius, crisp 1px borders, flat surfaces (minimal
  elevation/shadow).
- **Type:** clean grotesk/sans for UI and prose, monospace for code and inline
  technical tokens; tight-but-readable rhythm.
- **Density:** generous whitespace around a focused content column, three-pane
  layout (sidebar · content · TOC).

> Exact hex/font values are pulled from docs.x.ai as the reference during M2; the
> token set below is where they live.

## How the default theme styles shadcn — **without forking it** (resolved 09-V)

Per Hayden's direction, the docs.x.ai look is applied as a **className/CSS override
layer on top of pristine shadcn components** — we never edit shadcn source. This is
the crux of the approach:

- shadcn/ui v4 emits a stable **`data-slot`** attribute on every primitive part
  (e.g. `[data-slot="alert"]`, `[data-slot="tabs-list"]`). Blume's theme is a CSS
  layer that targets these slots + the CSS variables to achieve the look — **zero
  edits to the components**.
- Where a default needs structural classes, the Blume *default component* (which
  composes the shadcn primitive) passes them via `className`/`cn()` — the shadcn
  file it imports stays untouched.
- Result: shadcn primitives remain **pristine and upgradeable**, and `blume add`
  ([05](./05-customization.md)) hands users clean, standard shadcn source that the
  theme layer still styles via `data-slot` — so added components match the theme
  automatically, and users restyle by overriding the same layer.

```css
/* default theme layer (illustrative) — targets shadcn slots, edits no source */
[data-slot="alert"]      { border-radius: var(--radius); border-color: var(--border); }
[data-slot="tabs-list"]  { background: transparent; border-bottom: 1px solid var(--border); }
```

This keeps three things true at once: the look is **fully Blume's**, the components
are **unmodified shadcn**, and users get **clean source on eject/add**.

## Design tokens

The default theme is driven by CSS custom properties so rungs 1 and 2 work without
touching component code. Two layers:

- **shadcn base contract** — the standard shadcn variables the components consume:
  `--background`, `--foreground`, `--primary`, `--primary-foreground`, `--muted`,
  `--border`, `--card`, `--accent`, `--ring`, `--radius`, etc. (light values on
  `:root`, dark on `.dark`).
- **Blume tokens** — framework-specific additions layered on top:
  - **Typography** — `--blume-font-sans`, `--blume-font-mono`, prose sizing/leading.
  - **Spacing & layout** — `--blume-content-width`, `--blume-sidebar-width`,
    `--blume-toc-width`, gutters.
  - **Shadow/extras** — `--blume-shadow-*`.

`config.theme.colors.primary` sets shadcn's `--primary` and derives a scale at
build. `theme.css` can override any variable from either layer:

`config.theme.colors.primary` sets the primary and derives the scale at build.
`theme.css` can override any token:

```css
/* theme.css */
:root {
  --primary: #6d28d9;            /* shadcn base contract */
  --radius: 0.5rem;
  --blume-content-width: 720px;  /* Blume layout token */
}
.dark {
  --background: #0a0a0a;
}
```

## Dark mode

- Class-based (`.dark` on `<html>`), system-default-aware, with a toggle
  (`ThemeToggle`, client component).
- No flash: a tiny inline script sets the class before paint (standard pattern).
- Shiki **dual-theme** so code blocks match the mode; the light/dark Shiki theme
  ids are set in `config.theme.code.themes` (see [04](./04-configuration.md)).
- `config.theme.defaultMode`: `light` | `dark` | `system`.

## Styling strategy

> **RESOLVED (was 09-F):** the default theme is built with **Tailwind CSS v4**
> internally — CSS-first config via `@theme`, design tokens mapping cleanly to the
> CSS variables above, and excellent DX for us.
>
> **Hard constraint:** user `components.tsx` overrides need **no** Tailwind. They
> get tokens via CSS variables and stable class hooks, and may bring any styling
> approach (vanilla CSS, CSS Modules, their own Tailwind, etc.). Blume must not
> impose a CSS framework on the user's overrides.
>
> Implementation notes:
> - Blume's Tailwind config/preset is internal to the default theme package; it is
>   not required in (or leaked into) the user's project.
> - Every default component exposes semantic class hooks (`data-*` / `.blume-*`)
>   so users can restyle with plain CSS, no Tailwind needed.
> - The generated app wires up Tailwind for the bundled default theme only.

## Prose / typography

Markdown body styling (the "prose") is delivered through the default markdown
component overrides (`h1`–`h6`, `p`, `a`, lists, `blockquote`, `table`, `code`…),
each reading tokens. Because these are just registry entries, users restyle prose
either via tokens (`theme.css`) or by overriding the specific element in
`components.tsx`. No opaque `.prose` blob the user can't reach into.

## Fonts

- **Defaults (resolved 09-AD): Geist Sans + Geist Mono**, self-hosted via
  `next/font` for zero-CLS loading inside the generated app — they pair with the
  minimal docs.x.ai look and shadcn's defaults.
- `config.theme.font` accepts a Google font name or a self-hosted reference to swap
  either family.
- Users can override font tokens in `theme.css` or supply their own `@font-face`.

## Default values summary (resolved 09-AD)

The out-of-the-box look, all overridable via `config.theme`:
- **Mode:** `system` (follow OS), with a toggle.
- **Fonts:** Geist Sans (UI/prose) + Geist Mono (code).
- **Code themes:** minimal/near-mono Shiki pair — `min-light` / `min-dark` — chosen
  to match the high-contrast, monochrome docs.x.ai aesthetic (a bespoke near-mono
  theme may replace these later).
- **Sidebar:** multi-expand, state persisted.

## Theming surface summary

| Want to… | Use |
| --- | --- |
| Change accent color, mode, radius, fonts | `blume.config.ts` → `theme` |
| Adjust spacing, widths, any token, per-mode | `theme.css` |
| Replace how a heading/callout/sidebar looks | `components.tsx` |
