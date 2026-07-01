---
"blume": minor
---

Add a built-in `github-releases` content source that turns a repository's GitHub
Releases into `type: changelog` entries, so your release notes become your
changelog with no files to maintain. The generated `/changelog` timeline now
also reads staged (non-filesystem) sources, and the CLI loads `.env`/`.env.local`
(cascading to the repo root) before the content scan so remote sources can read
tokens like `GITHUB_TOKEN`. Because a changelog is supplementary, a fetch failure
with no cache (e.g. a CI build without a token) degrades to an empty timeline with
a warning instead of failing the build, and the `/changelog` page is still
generated so its nav tab resolves.
