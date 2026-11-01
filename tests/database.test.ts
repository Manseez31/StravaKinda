import { afterEach, expect, it, vi } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Workout } from "../types/activity";
const context = vi.hoisted(() => ({
  path: "",
  connections: [] as { close: () => void }[],
}));
vi.mock("expo-sqlite", () => ({
  openDatabaseAsync: async () => {
    const db = new DatabaseSync(context.path);
    context.connections.push(db);
    return {
      execAsync: async (sql: string) => db.exec(sql),
      runAsync: async (sql: string, ...params: (string | number)[]) =>
        db.prepare(sql).run(...params),
      getAllAsync: async (sql: string, ...params: string[]) =>
        db.prepare(sql).all(...params),
      getFirstAsync: async (sql: string, ...params: string[]) =>
        db.prepare(sql).get(...params),
    };
  },
}));
let directory = "";
afterEach(() => {
  for (const db of context.connections) db.close();
  context.connections = [];
  if (directory) rmSync(directory, { recursive: true, force: true });
  vi.resetModules();
});
it("persists workouts and preferences across connection restarts, then deletes", async () => {
  directory = mkdtempSync(join(tmpdir(), "stravakinda-test-"));
  context.path = join(directory, "test.db");
  let repository = await import("../services/database");
  const w: Workout = {
    id: "persistent",
    title: "Real persistence test",
    description: "",
    sport: "walking",
    visibility: "private",
    startedAt: 1000,
    endedAt: null,
    state: "paused",
    activeMs: 5000,
    resumedAt: null,
    segment: 0,
    rejected: 0,
    points: [
      {
        latitude: 0,
        longitude: 0,
        accuracy: 3,
        altitude: null,
        altitudeAccuracy: null,
        timestamp: 1000,
        segment: 0,
      },
    ],
  };
  await repository.serial(() => repository.writeWorkout(w));
  await repository.setValue("units", "mi");
  vi.resetModules();
  repository = await import("../services/database");
  expect(await repository.readWorkouts()).toEqual([w]);
  expect(await repository.getValue("units")).toBe("mi");
  await repository.setValue('deleted:pending', true);
  await repository.setValue('deleted:finished', 'confirmed');
  expect(await repository.pendingDeletionIds()).toEqual(['pending']);
  await repository.deleteWorkout(w.id);
  expect(await repository.readWorkouts()).toEqual([]);
});
it("serializes overlapping writes and recovers the queue after failure", async () => {
  const { serial } = await import("../services/database");
  const order: number[] = [];
  await Promise.all([
    serial(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      order.push(1);
    }),
    serial(async () => {
      order.push(2);
    }),
  ]);
  await expect(
    serial(async () => {
      throw new Error("disk unavailable");
    }),
  ).rejects.toThrow("disk unavailable");
  await serial(async () => {
    order.push(3);
  });
  expect(order).toEqual([1, 2, 3]);
});
