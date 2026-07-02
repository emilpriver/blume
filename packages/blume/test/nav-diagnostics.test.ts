import { describe, expect, it } from "bun:test";

import { validateNavIcons } from "../src/core/nav-diagnostics.ts";
import type { Navigation } from "../src/core/types.ts";

const nav = (over: Partial<Navigation> = {}): Navigation => ({
  chromeVariants: [],
  selectors: [],
  sidebar: [],
  sidebarVariants: [],
  tabs: [],
  ...over,
});

describe("validateNavIcons", () => {
  it("warns about an unknown icon name", () => {
    const result = validateNavIcons(
      nav({ tabs: [{ icon: "not-a-real-icon", label: "Home", path: "/" }] })
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.code).toBe("BLUME_UNKNOWN_ICON");
    expect(result[0]?.message).toContain("not-a-real-icon");
  });

  it("accepts a known built-in icon", () => {
    expect(
      validateNavIcons(
        nav({ tabs: [{ icon: "book-open", label: "Docs", path: "/docs" }] })
      )
    ).toEqual([]);
  });

  it("skips image and inline-SVG icons", () => {
    const result = validateNavIcons(
      nav({
        sidebar: [
          {
            icon: "/logo.svg",
            kind: "page",
            label: "A",
            pageId: "a",
            route: "/a",
          },
          {
            icon: "<svg></svg>",
            kind: "page",
            label: "B",
            pageId: "b",
            route: "/b",
          },
          {
            icon: "https://x.dev/i.png",
            kind: "page",
            label: "C",
            pageId: "c",
            route: "/c",
          },
        ],
      })
    );
    expect(result).toEqual([]);
  });

  it("recurses into groups and dedupes repeated unknown icons", () => {
    const result = validateNavIcons(
      nav({
        sidebar: [
          {
            children: [
              {
                icon: "bogus",
                kind: "page",
                label: "A",
                pageId: "a",
                route: "/a",
              },
              {
                icon: "bogus",
                kind: "page",
                label: "B",
                pageId: "b",
                route: "/b",
              },
            ],
            icon: "bogus",
            kind: "group",
            label: "Group",
          },
        ],
      })
    );
    expect(result).toHaveLength(1);
  });
});
