---
"blume": patch
---

Emit X (Twitter) card tags, and add `seo.x` for account attribution:

```ts
seo: {
  x: { handle: "@acme", creator: "@jane" },
}
```

`handle` becomes `twitter:site` and `creator` becomes `twitter:creator` — the one piece of X card metadata with no Open Graph equivalent to fall back to. A page can credit its own author with `seo.x.creator` frontmatter, which is what a guest post wants. The `@` is optional in both places.

Every page also now emits `twitter:card`, `twitter:title`, `twitter:description`, and `twitter:image:alt` on the generated card. `twitter:card` previously rendered only when a page had an image; a page without one now gets the compact `summary` card instead of sharing as a bare link.
