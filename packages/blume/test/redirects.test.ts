import { describe, expect, it } from "bun:test";

import {
  applyBaseToRedirects,
  buildNetlifyRedirects,
  buildRedirectManifest,
  buildVercelConfig,
} from "../src/deploy/redirects.ts";

const redirects = [
  { from: "/old", status: 301 as const, to: "/new" },
  { from: "/tmp", status: 302 as const, to: "/temp" },
];

describe("redirect emitters", () => {
  it("writes Netlify `_redirects` lines (from to status)", () => {
    expect(buildNetlifyRedirects(redirects)).toBe(
      "/old /new 301\n/tmp /temp 302\n"
    );
  });

  it("preserves exact status codes in vercel.json via statusCode", () => {
    const parsed = JSON.parse(buildVercelConfig(redirects));
    expect(parsed.redirects[0]).toStrictEqual({
      destination: "/new",
      source: "/old",
      statusCode: 301,
    });
    // A 302 must ship as 302 — the boolean `permanent` would coerce it to 307.
    expect(parsed.redirects[1].statusCode).toBe(302);
    expect(parsed.redirects[1]).not.toHaveProperty("permanent");
  });

  it("prepends the base path to internal from/to routes", () => {
    expect(applyBaseToRedirects(redirects, "/docs")).toStrictEqual([
      { from: "/docs/old", status: 301, to: "/docs/new" },
      { from: "/docs/tmp", status: 302, to: "/docs/temp" },
    ]);
    // No base path: the redirects pass through untouched.
    expect(applyBaseToRedirects(redirects, "")).toBe(redirects);
  });

  it("emits a structured manifest", () => {
    expect(JSON.parse(buildRedirectManifest(redirects))).toStrictEqual([
      { from: "/old", status: 301, to: "/new" },
      { from: "/tmp", status: 302, to: "/temp" },
    ]);
  });
});
