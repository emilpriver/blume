---
"blume": minor
---

Add `navigation.featured` — pinned links rendered above the sidebar sections. Each takes a `label`, an `href` (external URL or internal route), and an optional `icon`, and appears on every route and breakpoint, outside the tab-scoped sidebar tree. External links open in a new tab with an indicator; internal targets are validated against your pages at build time, and unknown icons warn like anywhere else.

```ts
export default defineConfig({
  navigation: {
    featured: [
      { label: "Blog", href: "https://example.com/blog", icon: "newspaper" },
      { label: "Contact", href: "/contact", icon: "headphones" },
    ],
  },
});
```

This restores a common Mintlify layout where standalone destinations (blog, changelog, support) sit at the top of the sidebar rather than folding into the generated content tree.
