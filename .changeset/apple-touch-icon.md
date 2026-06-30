---
"blume": patch
---

Auto-detect an Apple touch icon by filename, the way favicons already work. Drop an `apple-icon.png` (or `.jpg`/`.jpeg`, or `apple-touch-icon.png`) in your project root or `public/` directory and Blume wires up `<link rel="apple-touch-icon">` for you — no config required. A file in `public/` is referenced by URL (the reliable path for iOS); there's no default, so no tag is emitted when the project ships none.
