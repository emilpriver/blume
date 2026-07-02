import { describe, expect, it } from "bun:test";

import { planComponentSlots } from "../src/astro/component-slots.ts";
import { analyzeComponentOverrides } from "../src/core/component-overrides.ts";

const FILE = "/project/components.ts";

const analyze = (source: string) => analyzeComponentOverrides(source, FILE);

describe("analyzeComponentOverrides", () => {
  it("returns empty groups when there is no default export object", () => {
    const result = analyze("export const x = 1;");
    expect(result.mdx).toEqual([]);
    expect(result.layout).toEqual([]);
    expect(result.islands).toEqual([]);
  });

  it("reads an islands-group shorthand as a hydrated framework component", () => {
    const result = analyze(`
      import Counter from "./islands/Counter.tsx";
      export default { islands: { Counter } };
    `);
    expect(result.islands).toHaveLength(1);
    const [island] = result.islands;
    expect(island?.key).toBe("Counter");
    expect(island?.client).toBe("visible");
    expect(island?.source?.path).toBe("/project/islands/Counter.tsx");
    expect(island?.source?.framework).toBe("react");
    expect(result.warnings).toEqual([]);
  });

  it("unwraps a defineComponents(...) call expression", () => {
    const result = analyze(`
      import { defineComponents } from "blume";
      import Counter from "./Counter.tsx";
      export default defineComponents({ islands: { Counter } });
    `);
    expect(result.islands).toHaveLength(1);
  });

  it("reads a hydrated layout descriptor with a client mode", () => {
    const result = analyze(`
      export default {
        layout: { Footer: { component: "./Footer.tsx", client: "load" } },
      };
    `);
    const [footer] = result.layout;
    expect(footer?.key).toBe("Footer");
    expect(footer?.client).toBe("load");
    expect(footer?.identifier).toBe(false);
    expect(footer?.source?.path).toBe("/project/Footer.tsx");
  });

  it("resolves a string-path override to an absolute path", () => {
    const result = analyze(`
      export default { layout: { Footer: "./components/footer.astro" } };
    `);
    const [footer] = result.layout;
    expect(footer?.source?.path).toBe("/project/components/footer.astro");
    expect(footer?.source?.framework).toBeNull();
    expect(footer?.client).toBeUndefined();
    expect(result.warnings).toEqual([]);
  });

  it("resolves a named import binding for a descriptor component", () => {
    const result = analyze(`
      import { Fancy as Header } from "./Header.tsx";
      export default { layout: { Header: { component: Header, client: "idle" } } };
    `);
    const [header] = result.layout;
    expect(header?.source?.name).toBe("Fancy");
    expect(header?.source?.path).toBe("/project/Header.tsx");
    expect(header?.client).toBe("idle");
  });

  it("keeps a bare .astro identifier on the runtime object with no warning", () => {
    const result = analyze(`
      import Footer from "./Footer.astro";
      export default { layout: { Footer } };
    `);
    const [footer] = result.layout;
    expect(footer?.identifier).toBe(true);
    expect(footer?.source?.framework).toBeNull();
    expect(result.warnings).toEqual([]);
  });

  it("warns when a framework component is used with no hydration mode", () => {
    const result = analyze(`
      import Chart from "./Chart.tsx";
      export default { mdx: { Chart } };
    `);
    expect(result.mdx[0]?.identifier).toBe(true);
    expect(result.warnings.join(" ")).toContain("no hydration mode");
  });

  it("warns and drops an island that is not a framework component", () => {
    const result = analyze(`
      export default { islands: { Thing: "./Thing.astro" } };
    `);
    expect(result.islands).toEqual([]);
    expect(result.warnings.join(" ")).toContain("not a React, Vue, or Svelte");
  });

  it("warns when client is set but the component can't be resolved", () => {
    const result = analyze(`
      const Local = () => null;
      export default { mdx: { Widget: { component: Local, client: "load" } } };
    `);
    expect(result.warnings.join(" ")).toContain("couldn't be resolved");
  });

  it("warns when client: media has no media query", () => {
    const result = analyze(`
      export default {
        mdx: { Panel: { component: "./Panel.tsx", client: "media" } },
      };
    `);
    expect(result.warnings.join(" ")).toContain('client: "media"');
  });

  it("infers vue and svelte frameworks from the extension", () => {
    const result = analyze(`
      export default {
        islands: { V: "./V.vue", S: "./S.svelte" },
      };
    `);
    expect(result.islands.map((i) => i.source?.framework)).toEqual([
      "vue",
      "svelte",
    ]);
  });
});

describe("planComponentSlots", () => {
  it("returns empty maps when there is no components file", () => {
    const plan = planComponentSlots(null, null);
    expect(plan.wrappers).toEqual([]);
    expect(plan.module).toContain("export const mdxComponents = {}");
  });

  it("falls back to raw re-exports when analysis is null", () => {
    const plan = planComponentSlots("../../components.ts", null);
    expect(plan.module).toContain("overrides.mdx ?? {}");
    expect(plan.module).toContain("overrides.layout ?? {}");
    expect(plan.wrappers).toEqual([]);
  });

  it("emits a hydration wrapper for an island and folds it into mdx", () => {
    const analysis = analyze(`
      import Counter from "./Counter.tsx";
      export default { islands: { Counter } };
    `);
    const plan = planComponentSlots(FILE, analysis);
    expect(plan.frameworks.has("react")).toBe(true);
    expect(plan.wrappers).toHaveLength(1);
    expect(plan.wrappers[0]?.name).toBe("mdx-Counter");
    expect(plan.wrappers[0]?.content).toContain("client:visible");
    expect(plan.wrappers[0]?.content).toContain("/project/Counter.tsx");
    expect(plan.module).toContain('"Counter":');
  });

  it("imports a static string-path override directly (no wrapper)", () => {
    const analysis = analyze(`
      export default { layout: { Footer: "./footer.astro" } };
    `);
    const plan = planComponentSlots(FILE, analysis);
    expect(plan.wrappers).toEqual([]);
    expect(plan.module).toContain(
      'import __blumeSlot0 from "/project/footer.astro"'
    );
    expect(plan.module).toContain('"Footer": __blumeSlot0');
  });

  it("leaves a bare identifier override on the runtime spread", () => {
    const analysis = analyze(`
      import Footer from "./Footer.astro";
      export default { layout: { Footer } };
    `);
    const plan = planComponentSlots(FILE, analysis);
    expect(plan.wrappers).toEqual([]);
    // No explicit entry — it rides through `...overrides.layout`.
    expect(plan.module).not.toContain("__blumeSlot");
  });

  it("applies client:media with the query and client:only with the framework", () => {
    const analysis = analyze(`
      export default {
        mdx: {
          Wide: { component: "./Wide.tsx", client: "media", media: "(min-width: 40rem)" },
          Solo: { component: "./Solo.tsx", client: "only" },
        },
      };
    `);
    const plan = planComponentSlots(FILE, analysis);
    const contents = plan.wrappers.map((w) => w.content).join("\n");
    expect(contents).toContain('client:media="(min-width: 40rem)"');
    expect(contents).toContain('client:only="react"');
  });
});
