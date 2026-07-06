import { describe, expect, it } from "bun:test";

import { resolveSlot } from "../src/components/layout/overrides.ts";

const builtin = () => "builtin";
const override = () => "override";

describe("resolveSlot", () => {
  it("falls back to the built-in when no override is configured", () => {
    expect(resolveSlot(undefined, builtin)).toBe(builtin);
  });

  it("uses an imported component override directly", () => {
    expect(resolveSlot(override, builtin)).toBe(override);
  });

  it("unwraps an IslandDescriptor to its component", () => {
    expect(resolveSlot({ client: "load", component: override }, builtin)).toBe(
      override
    );
  });

  it("ignores string-path overrides for now and keeps the built-in", () => {
    expect(resolveSlot("./header.astro", builtin)).toBe(builtin);
  });
});
