import { describe, expect, it } from "bun:test";

import {
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

  it("maps status to Vercel's permanent flag", () => {
    const parsed = JSON.parse(buildVercelConfig(redirects));
    expect(parsed.redirects[0]).toStrictEqual({
      destination: "/new",
      permanent: true,
      source: "/old",
    });
    expect(parsed.redirects[1].permanent).toBe(false);
  });

  it("emits a structured manifest", () => {
    expect(JSON.parse(buildRedirectManifest(redirects))).toStrictEqual([
      { from: "/old", status: 301, to: "/new" },
      { from: "/tmp", status: 302, to: "/temp" },
    ]);
  });
});
