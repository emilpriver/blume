---
"blume": minor
---

Complete the **component override API**. `defineComponents` now supports:

- **An `islands` group** — register interactive framework components for use in
  every MDX page (the config-file equivalent of the `islands/` folder), hydrated
  by default (`client: "visible"`).
- **Hydration on overrides** — any `mdx` or `layout` override can take a
  descriptor `{ component, client, media }` and hydrate with a real Astro
  `client:*` directive (`load`/`idle`/`visible`/`media`/`only`).
- **Path-string references** — reference a component by path
  (`Footer: "./components/footer.astro"`) instead of importing it.
- **A friendly diagnostic** — Blume warns at build time when an override points
  to a React/Vue/Svelte component with no hydration mode (so it would silently
  render as dead static HTML).

Overrides are read by statically analyzing `components.ts` (never executing it),
so Blume can emit the static imports and hydration wrappers Astro needs. Imported
components still work as before; the new forms are additive.
