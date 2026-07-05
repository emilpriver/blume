---
"blume": patch
---

Make `pollInterval` hot-reload actually observe remote changes: the poller now fetches fresh instead of re-reading the dev snapshot cache, and seeds its baseline from what the dev server served so the first remote change is never swallowed. Applies to the GitHub-releases, Notion, Sanity, and remote-MDX sources.
