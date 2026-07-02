---
"blume": minor
---

Add `blume/runtime` data helpers for custom pages. `getBlumeCollection(data,
query?)` selects content routes from `blume:data` — filtered by collection,
locale, or path prefix, with drafts/hidden pages excluded and sorted by path — so
building a custom index or listing is a one-liner. The new `<BlumePage>`
component (`blume/components/BlumePage.astro`) renders a content entry's body
inside a custom page with Blume's built-in MDX components already wired in, with
`components` and `collection` props for the rest. The runtime data types
(`BlumeData`, `BlumeRoute`, …) are re-exported from `blume/runtime` too.
