---
"blume": patch
---

Ensure the search index exists before the Algolia sync replaces its records. A copy operation queued from a missing index never publishes — its task status stays `notPublished` forever — so `replaceAllObjects` polled it up to 800 retries (about an hour) with no error, and a build whose app lacked the configured index hung in the `astro:build:done` hook until the CI platform's own timeout killed it. The sync now creates a missing index first and bounds task polling to about two minutes, so a stuck replace fails the build with `BLUME_SEARCH_SYNC_FAILED` instead of hanging it.
