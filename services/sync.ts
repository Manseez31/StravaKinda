import { backend } from "./supabase";
import { useApp, mutateWorkout } from "../store/app";
import { stats } from "../utils/tracking";
import { createClient } from "@supabase/supabase-js";
import {
  getValue,
  readWorkouts,
  serial,
  setValue,
  writeWorkout,
  pendingDeletionIds,
} from "./database";
import type { TrackPoint, Workout, Sport, Visibility } from "../types/activity";
let syncing = false;
export async function syncWorkouts(enableAutomatic = true) {
  if (syncing) return;
  syncing = true;
  try {
    const root = backend();
    const session = (await root.auth.getSession()).data.session;
    if (!session) throw new Error("Sign in to sync your workouts.");
    // Pin the JWT for this job so switching accounts cannot reassign an upload.
    const db = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL!,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
      },
    );
    const { data, error } = await root.auth.getUser(session.access_token);
    if (error || !data.user) throw new Error("Sign in to sync your workouts.");
    const userId = data.user.id;
    if (enableAutomatic) await setValue(`sync-enabled:${userId}`, true);
    for (const id of await pendingDeletionIds()) {
      const removed = await db
        .from("activities")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (removed.error) throw removed.error;
      // Retain other accounts' pending markers for the appropriate sign-in.
      const owned =
        (await getValue<string>(`deleted-owner:${id}`)) ??
        (await readWorkouts()).find((w) => w.id === id)?.ownerId;
      if (owned === userId) await setValue(`deleted:${id}`, "confirmed");
    }
    for (const w of useApp
      .getState()
      .workouts.filter(
        (w) => w.state === "finished" && w.ownerId === userId && !w.syncedAt,
      )) {
      if (await getValue<boolean>(`deleted:${w.id}`)) continue;
      const s = stats(w);
      // Transactional RPC makes retries idempotent and keeps raw coordinates private.
      const result = await db.rpc("save_workout", {
        payload: {
          id: w.id,
          title: w.title,
          description: w.description,
          sport: w.sport,
          visibility: w.visibility,
          started_at: new Date(w.startedAt).toISOString(),
          ended_at: new Date(w.endedAt!).toISOString(),
          distance_m: s.meters,
          moving_seconds: s.movingMs / 1000,
          active_seconds: s.activeMs / 1000,
          elapsed_seconds: s.elapsedMs / 1000,
          elevation_m: s.elevation,
          points: w.points,
        },
      });
      if (result.error) throw result.error;
      if (await getValue<boolean>(`deleted:${w.id}`)) {
        const removed = await db.from("activities").delete().eq("id", w.id);
        if (removed.error) {
          await setValue(`deleted:${w.id}`, true);
          throw removed.error;
        }
        await setValue(`deleted:${w.id}`, "confirmed");
        continue;
      }
      await mutateWorkout(w.id, (current) => ({
        ...current,
        // An edit made while uploading must remain queued for another attempt.
        syncedAt:
          JSON.stringify(current) === JSON.stringify(w)
            ? Date.now()
            : current.syncedAt,
      }));
    }
    // Restore missing owner workouts. Existing local edits are never overwritten.
    const known = new Set((await readWorkouts()).map((w) => w.id));
    for (let offset = 0; ; offset += 50) {
      const result = await db
        .from("activities")
        .select(
          "id,user_id,title,description,sport,visibility,started_at,ended_at,active_seconds",
        )
        .eq("user_id", userId)
        .order("started_at", { ascending: false })
        .order("id")
        .range(offset, offset + 49);
      if (result.error) throw result.error;
      for (const activity of result.data ?? []) {
        if (
          known.has(activity.id) ||
          (await getValue<boolean>(`deleted:${activity.id}`))
        )
          continue;
        const points: TrackPoint[] = [];
        for (let pointOffset = 0; ; pointOffset += 1000) {
          const batch = await db
            .from("activity_points")
            .select(
              "latitude,longitude,recorded_at,accuracy,altitude,altitude_accuracy,segment",
            )
            .eq("activity_id", activity.id)
            .order("seq")
            .range(pointOffset, pointOffset + 999);
          if (batch.error) throw batch.error;
          points.push(
            ...(batch.data ?? []).map((p) => ({
              latitude: p.latitude,
              longitude: p.longitude,
              timestamp: new Date(p.recorded_at).getTime(),
              accuracy: p.accuracy,
              altitude: p.altitude,
              altitudeAccuracy: p.altitude_accuracy,
              segment: p.segment,
            })),
          );
          if ((batch.data?.length ?? 0) < 1000) break;
          if (points.length > 50000)
            throw new Error("Cloud track is too large to restore safely.");
        }
        const w: Workout = {
          id: activity.id,
          ownerId: userId,
          title: activity.title,
          description: activity.description,
          sport: activity.sport as Sport,
          visibility: activity.visibility as Visibility,
          startedAt: new Date(activity.started_at).getTime(),
          endedAt: new Date(activity.ended_at).getTime(),
          activeMs: activity.active_seconds * 1000,
          resumedAt: null,
          state: "finished",
          segment: points.at(-1)?.segment ?? 0,
          points,
          rejected: 0,
          syncedAt: Date.now(),
        };
        // Double-check inside the write queue to avoid a concurrent local overwrite.
        await serial(async () => {
          if (
            !(await getValue<boolean>(`deleted:${w.id}`)) &&
            !(await readWorkouts()).some((x) => x.id === w.id)
          )
            await writeWorkout(w);
        });
      }
      if ((result.data?.length ?? 0) < 50) break;
    }
    await useApp.getState().refresh();
  } finally {
    syncing = false;
  }
}
export async function syncIfEnabled(userId: string) {
  if (await getValue<boolean>(`sync-enabled:${userId}`))
    await syncWorkouts(false);
}
