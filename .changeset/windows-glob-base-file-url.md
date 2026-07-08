---
"blume": patch
---

Fix `blume dev`/`build` crashing on Windows with "The URL must be of scheme file" while generating the content config. The generated `content.config.ts` embedded each collection's glob `base` as a raw absolute path, and Astro's glob loader resolves it with `new URL(base, config.root)` — on Windows the drive letter (`C:\…`) is parsed as a URL scheme, so the result isn't a `file:` URL and Astro's subsequent `fileURLToPath` throws. Absolute bases are now emitted as `file://` URLs (via `pathToFileURL`) so the drive letter can't be mistaken for a scheme; relative bases (e.g. an ejected `blume-staged`) pass through unchanged.
