import type { ResolvedConfig } from "../core/schema.ts";

/**
 * Platform redirect files for a static build. Astro already emits redirect HTML
 * (meta-refresh) pages for `deployment.output: "static"`, but that's a soft
 * client redirect. These give the host a real HTTP 3xx: Netlify/Cloudflare read
 * `_redirects`, Vercel reads `vercel.json`, and `blume-redirects.json` is a
 * structured manifest for anything else (Apache/nginx rules, an edge worker).
 */

type Redirect = ResolvedConfig["redirects"][number];

/** `_redirects` text (Netlify + Cloudflare Pages): `from to status` per line. */
export const buildNetlifyRedirects = (redirects: Redirect[]): string =>
  `${redirects
    .map((redirect) => `${redirect.from} ${redirect.to} ${redirect.status}`)
    .join("\n")}\n`;

/** `vercel.json` contents with a `redirects` array (permanent = 301/308). */
export const buildVercelConfig = (redirects: Redirect[]): string =>
  `${JSON.stringify(
    {
      redirects: redirects.map((redirect) => ({
        destination: redirect.to,
        permanent: redirect.status === 301 || redirect.status === 308,
        source: redirect.from,
      })),
    },
    null,
    2
  )}\n`;

/** Structured manifest for hosts that need manual wiring. */
export const buildRedirectManifest = (redirects: Redirect[]): string =>
  `${JSON.stringify(
    redirects.map((redirect) => ({
      from: redirect.from,
      status: redirect.status,
      to: redirect.to,
    })),
    null,
    2
  )}\n`;
