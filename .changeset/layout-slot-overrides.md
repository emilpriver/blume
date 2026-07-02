---
"blume": minor
---

Expose the full set of overridable **layout slots**. Alongside the existing
`Header`, `Sidebar`, `Breadcrumbs`, `TableOfContents`, and `Pagination`, you can
now replace `Layout` (the whole page shell), `Logo`, `Search`, `MobileNav`, and
the three content-injection slots `PageHeader`, `PageFooter`, and `Footer` — the
last three have no built-in and render nothing until you set them. Each override
receives the same props as the built-in it replaces. Register them the same way
as before:

```ts
import { defineComponents } from "blume";
import Footer from "./components/Footer.astro";

export default defineComponents({ layout: { Footer } });
```
