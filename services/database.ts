import * as SQLite from "expo-sqlite";
import type { Workout } from "../types/activity";
let connection: Promise<SQLite.SQLiteDatabase> | undefined;
export function database() {
  return (connection ??= (async () => {
    const db = await SQLite.openDatabaseAsync("stravakinda.db");
    await db.execAsync(
      "PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS workouts (id TEXT PRIMARY KEY, body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, body TEXT NOT NULL);",
    );
    return db;
  })());
}
let pending: Promise<unknown> = Promise.resolve();
export function serial<T>(fn: () => Promise<T>): Promise<T> {
  const next = pending.then(fn);
  pending = next.catch(() => undefined);
  return next;
}
export async function readWorkouts(): Promise<Workout[]> {
  const db = await database();
  const rows = await db.getAllAsync<{ body: string }>(
    "SELECT body FROM workouts",
  );
  return rows
    .map((r) => JSON.parse(r.body) as Workout)
    .sort((a, b) => b.startedAt - a.startedAt);
}
export async function writeWorkout(w: Workout) {
  await (
    await database()
  ).runAsync(
    "INSERT OR REPLACE INTO workouts(id, body) VALUES (?, ?)",
    w.id,
    JSON.stringify(w),
  );
}
export async function deleteWorkout(id: string) {
  await serial(async () => {
    await (await database()).runAsync("DELETE FROM workouts WHERE id = ?", id);
  });
}
export async function getValue<T>(key: string): Promise<T | null> {
  const row = await (
    await database()
  ).getFirstAsync<{ body: string }>("SELECT body FROM kv WHERE key = ?", key);
  return row ? (JSON.parse(row.body) as T) : null;
}
export async function setValue(key: string, value: unknown) {
  await (
    await database()
  ).runAsync(
    "INSERT OR REPLACE INTO kv(key, body) VALUES (?, ?)",
    key,
    JSON.stringify(value),
  );
}
export async function pendingDeletionIds(): Promise<string[]> {
  const rows = await (
    await database()
  ).getAllAsync<{ key: string }>(
    "SELECT key FROM kv WHERE key LIKE ? AND body = ?",
    "deleted:%",
    "true",
  );
  return rows.map((row) => row.key.slice("deleted:".length));
}
