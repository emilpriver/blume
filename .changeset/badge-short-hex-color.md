---
"blume": patch
---

`<Badge color>` with a 3- or 4-digit hex (e.g. `#f00`) now renders a valid background: the alpha is applied with `color-mix` instead of appending a hex alpha byte.
