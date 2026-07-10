---
"blume": patch
---

`<Tabs>` triggers and panels now get stable generated ids and are wired both ways with `aria-controls`/`aria-labelledby`, so screen readers announce which panel each tab controls without requiring an explicit `id` prop.
