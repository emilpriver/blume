# 14 — Quality, Process & Constraints

The non-feature concerns that keep Blume trustworthy: how we test it, our
accessibility bar, how we release it, and the technical constraints we've
acknowledged. These are committed approaches (resolved 09-AC), not open questions —
the few genuinely-loose bits are flagged.

## Testing

Test runner is **vitest** (already enabled via the ultracite `vitest` oxlint
preset — see [13-tooling.md](./13-tooling.md)).

- **Unit** — content source (discovery/routing/frontmatter), TOC + nav-tree
  assembly, manifest generation, registry merge, each Blume remark/rehype plugin,
  variable/snippet substitution.
- **Integration** — generate `.blume/` for fixture projects in `examples/` and
  snapshot the manifest + key generated files; render pages and assert output
  (components resolve, overrides win, frontmatter applied).
- **E2E** — **Playwright** against a built site: navigation, ⌘K search, dark mode,
  links, landing page, server-mode Ask AI, llms.txt / raw `.md` endpoints.
- **Visual regression** — snapshot the default theme (the docs.x.ai look) across
  representative pages/components in light + dark to catch unintended drift.
- **Fixtures = dogfood** — the `examples/` projects double as test fixtures and as
  real docs we look at; Blume's own `docs/` site is the ultimate fixture.

## Accessibility — WCAG 2.2 AA

A hard bar for the default theme and component library:

- Built on Radix/shadcn primitives, which provide accessible roles, focus
  management, and keyboard behavior; overrides docs stress preserving it.
- **Keyboard:** full keyboard navigation, visible focus (`:focus-visible`), focus
  trapping in dialogs (search, Ask AI, mobile nav), a **skip-to-content** link.
- **Motion & contrast:** honor `prefers-reduced-motion`; verify contrast in the
  **dark-first** docs.x.ai palette (high-contrast monochrome helps here, but it's
  checked, not assumed).
- **CI gate:** automated a11y checks (axe via Playwright) run in the test suite.

## Release & publishing

- **changesets** for versioning the monorepo.
- **`blume` + `@blume/*` released together** (fixed/synced versioning) so the CLI
  and its packages never drift out of compatibility.
- **npm provenance**; publish from CI on a tagged release.
- Changelog generated from changesets, which cut **GitHub Releases** — and those can
  auto-populate a docs changelog collection via `source: { type: "github" }`
  (resolved 09-AM, [15](./15-content-types.md)). Blume dogfoods this on its own docs;
  users can opt out and write changelog MD by hand.

## Technical constraints (acknowledged)

### Static export + images
`next/image` optimization needs a server or a loader; under `output: "export"`
images are unoptimized by default. **Direction:** Blume runs a build-time image
step (precompute dimensions, optionally emit responsive sizes) so `img` / `Frame` /
`ImageZoom` look right on static hosts, with a documented opt-in custom loader for
teams that have one. Final mechanism settled in M2/M7. (This is the static-export
image strategy referenced from [03-content-pipeline.md](./03-content-pipeline.md).)

### Build performance at scale
Per-page MDX bundling + a content map could get heavy for thousand-page sites.
Levers: bundler + Next incremental caching, Turborepo cache, and an **incremental
manifest** (only re-process changed files on watch/rebuild). Track build time as an
explicit budget; revisit if large-site builds regress.

### MDX trust model
MDX executes arbitrary JS at build/render. This is safe under the normal model —
**the docs author is trusted** (it's their repo). For untrusted/community-submitted
content it's a code-execution vector; that's a documented caveat, and sandboxing is
out of scope for v1.

### Private / authenticated docs
v1 leaves auth to the **host** (Vercel password, Cloudflare Access, a reverse
proxy) — it conflicts with static-first. Built-in auth (password or SSO) is
**post-1.0** and would imply server output. Noted, not built.

## Still loose (small)
- Exact static-export image mechanism (build-time pipeline vs unoptimized + loader)
  — decided in M2/M7.
- Whether visual-regression runs on every PR or nightly (cost vs coverage).
