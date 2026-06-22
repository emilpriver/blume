# Quality

## Quality goals

Blume should feel reliable despite generating a hidden runtime.

Quality areas:

- correctness
- diagnostics
- performance
- accessibility
- compatibility
- migration safety
- deploy predictability

## Test strategy

### Unit tests

Cover:

- config loading and merging
- schema validation
- route normalization
- nav graph generation
- link extraction
- diagnostics formatting
- manifest generation

### Integration tests

Each fixture should run:

```bash
blume build
```

Then assert:

- `.blume/` generated as expected
- Astro build succeeds or fails with expected diagnostics
- output routes exist
- search index exists when enabled
- assets are copied or processed

### Browser tests

Use Playwright for:

- navigation
- mobile sidebar
- search modal
- tabs/accordions
- theme toggle
- code copy
- Ask AI UI shell
- custom page rendering

### Visual tests

Cover:

- docs homepage
- content page
- API reference page
- dark mode
- mobile layout
- component gallery

## Performance budgets

Default static docs should target:

- minimal client JavaScript
- no hydration for static content pages
- fast first load
- fast Vite HMR
- bounded search payload

Budgets should be measured against fixture sites.

## Accessibility checks

Automate:

- axe checks
- keyboard navigation
- focus trap behavior
- contrast checks where practical
- reduced motion snapshots

Manual review still needed for complex interactions.

## Compatibility matrix

Track:

- Node versions
- Astro versions
- Vite versions
- package managers
- Vercel static/server deploys
- Node adapter deploy
- common monorepo layouts

## Migration quality

Migration tools should:

- never silently discard content
- produce a diff
- preserve frontmatter where possible
- annotate unsupported syntax
- provide a checklist

## Diagnostics quality

Every error should answer:

- what happened
- where it happened
- why it happened
- how to fix it

Generated runtime stack traces should be remapped to user files whenever possible.

## Release gates

Before beta:

- core fixtures pass
- component gallery passes visual tests
- migration fixtures pass
- static Vercel deploy works
- server Vercel deploy works for Ask AI
- docs site builds with Blume itself
