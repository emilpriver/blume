import { describe, expect, it } from "bun:test";
import { setTimeout as sleep } from "node:timers/promises";

import { coalescedRunner } from "../src/cli/coalesce.ts";

/** A task whose settlement each call is controlled by the test. */
const controllable = () => {
  const resolvers: (() => void)[] = [];
  let starts = 0;
  const task = (): Promise<void> => {
    starts += 1;
    // oxlint-disable-next-line promise/avoid-new -- deferred settled by the test
    return new Promise<void>((resolve) => {
      resolvers.push(resolve);
    });
  };
  return {
    /** Settle the oldest in-flight run. */
    finishNext: () => resolvers.shift()?.(),
    starts: () => starts,
    task,
  };
};

describe("coalescedRunner", () => {
  it("runs immediately when idle", async () => {
    const c = controllable();
    const run = coalescedRunner(c.task);

    run();
    expect(c.starts()).toBe(1);

    c.finishNext();
    await sleep(0);
    expect(c.starts()).toBe(1);
  });

  it("never runs concurrently and coalesces a burst into one trailing run", async () => {
    const c = controllable();
    const run = coalescedRunner(c.task);

    // Start run #1.
    run();
    expect(c.starts()).toBe(1);

    // Three more triggers while #1 is in flight collapse to a single follow-up.
    run();
    run();
    run();
    expect(c.starts()).toBe(1);

    // #1 settles -> exactly one trailing run fires.
    c.finishNext();
    await sleep(0);
    expect(c.starts()).toBe(2);

    // Trailing run settles -> nothing pending.
    c.finishNext();
    await sleep(0);
    expect(c.starts()).toBe(2);
  });

  it("allows a fresh run after the previous fully settles", async () => {
    const c = controllable();
    const run = coalescedRunner(c.task);

    run();
    c.finishNext();
    await sleep(0);
    expect(c.starts()).toBe(1);

    // Idle again -> runs immediately.
    run();
    expect(c.starts()).toBe(2);
    c.finishNext();
    await sleep(0);
  });
});
