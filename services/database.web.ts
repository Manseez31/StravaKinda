import type { Workout } from "../types/activity";
// Browser is a layout preview only. Native builds use the SQLite implementation.
const memory = new Map<string, string>();
let pending: Promise<unknown> = Promise.resolve();
export function serial<T>(fn: () => Promise<T>): Promise<T> {
  const next = pending.then(fn);
  pending = next.catch(() => undefined);
  return next;
}
export async function readWorkouts(): Promise<Workout[]> {
  return [];
}
export async function writeWorkout(_w: Workout) {
  throw new Error("Recording requires the Android or iOS app.");
}
export async function deleteWorkout(_id: string) {
  /* No recorded workouts in browser preview. */
}
export async function getValue<T>(key: string): Promise<T | null> {
  return memory.has(key) ? (JSON.parse(memory.get(key)!) as T) : null;
}
export async function setValue(key: string, value: unknown) {
  memory.set(key, JSON.stringify(value));
}
export async function pendingDeletionIds(): Promise<string[]> {
  return [];
}
