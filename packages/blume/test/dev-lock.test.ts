import { afterAll, describe, expect, it } from "bun:test";
import { existsSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";

import { join } from "pathe";

import { acquireDevLock, isDevLocked } from "../src/cli/dev-lock.ts";

const dirs: string[] = [];
const outDir = async (): Promise<string> => {
  const dir = await mkdtemp(join(tmpdir(), "blume-lock-"));
  dirs.push(dir);
  return join(dir, ".blume");
};

afterAll(async () => {
  await Promise.all(
    dirs.map((dir) => rm(dir, { force: true, recursive: true }))
  );
});

describe("dev lock", () => {
  it("reports unlocked when no lock file exists", async () => {
    expect(isDevLocked(await outDir())).toBe(false);
  });

  it("holds the lock while this process is alive, then releases it", async () => {
    const dir = await outDir();
    const release = acquireDevLock(dir);
    // Our own PID is alive, so the lock reads as held.
    expect(isDevLocked(dir)).toBe(true);
    expect(existsSync(join(dir, "dev.lock"))).toBe(true);
    release();
    expect(existsSync(join(dir, "dev.lock"))).toBe(false);
    expect(isDevLocked(dir)).toBe(false);
  });

  it("treats a lock from a dead process as stale", async () => {
    const dir = await outDir();
    // Acquire-and-release just to create the dir, then plant a dead PID.
    acquireDevLock(dir)();
    // PID 2147483647 (2^31-1) is never a live process.
    writeFileSync(join(dir, "dev.lock"), "2147483647");
    expect(isDevLocked(dir)).toBe(false);
  });

  it("only removes its own lock on release", async () => {
    const dir = await outDir();
    const release = acquireDevLock(dir);
    // A newer dev server overwrites the lock with its own PID.
    writeFileSync(join(dir, "dev.lock"), "2147483647");
    release();
    // Release must not clobber the other process's lock.
    expect(existsSync(join(dir, "dev.lock"))).toBe(true);
  });
});
