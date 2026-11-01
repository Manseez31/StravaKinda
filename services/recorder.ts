import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { randomUUID } from "expo-crypto";
import { AppState } from "react-native";
import { addPoint, pause, resume } from "../utils/tracking";
import {
  getValue,
  readWorkouts,
  serial,
  setValue,
  writeWorkout,
  deleteWorkout,
} from "./database";
import { mutateWorkout, useApp } from "../store/app";
import type { Sport, TrackPoint, Workout } from "../types/activity";
export const BACKGROUND_TASK = "stravakinda-location-v1";
let watcher: Location.LocationSubscription | null = null;
let foregroundId: string | null = null;
let autoPaused = false;
let stationarySince: number | null = null;
export function fromLocation(l: Location.LocationObject): TrackPoint {
  return {
    latitude: l.coords.latitude,
    longitude: l.coords.longitude,
    timestamp: l.timestamp,
    accuracy: l.coords.accuracy ?? Infinity,
    altitude: Number.isFinite(l.coords.altitude) ? l.coords.altitude : null,
    altitudeAccuracy:
      l.coords.altitudeAccuracy !== null &&
      Number.isFinite(l.coords.altitudeAccuracy) &&
      l.coords.altitudeAccuracy >= 0
        ? l.coords.altitudeAccuracy
        : null,
    segment: 0,
  };
}
async function ingest(id: string, locations: Location.LocationObject[]) {
  await mutateWorkout(id, (w) =>
    locations
      .sort((a, b) => a.timestamp - b.timestamp)
      .reduce((current, l) => {
        if (
          useApp.getState().preferences.autoPause &&
          l.coords.speed !== null &&
          l.coords.speed >= 0 &&
          (l.coords.accuracy ?? 100) <= 20
        ) {
          if (l.coords.speed < 0.5) {
            stationarySince ??= l.timestamp;
            if (
              l.timestamp - stationarySince > 15000 &&
              current.state === "recording"
            ) {
              autoPaused = true;
              return pause(current, l.timestamp);
            }
          } else {
            stationarySince = null;
            if (autoPaused && current.state === "paused") {
              autoPaused = false;
              current = resume(current, l.timestamp);
            }
          }
        }
        return addPoint(current, fromLocation(l));
      }, w),
  );
}
TaskManager.defineTask<{ locations: Location.LocationObject[] }>(
  BACKGROUND_TASK,
  async ({ data, error }) => {
    if (error) {
      await setValue("backgroundError", error.message);
      return;
    }
    const id = await getValue<string>("backgroundWorkout");
    if (id && data?.locations) await ingest(id, data.locations);
  },
);
export async function attachForeground(id: string) {
  watcher?.remove();
  foregroundId = id;
  watcher = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 3000,
      distanceInterval: 3,
    },
    (location) => {
      void ingest(id, [location]).catch((e) =>
        useApp.setState({
          error: `Recording could not be saved: ${String(e)}`,
        }),
      );
    },
  );
}
export async function startWorkout(sport: Sport, ownerId?: string) {
  if ((await readWorkouts()).some((w) => w.state !== "finished"))
    throw new Error("Resume or discard your unfinished workout first.");
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted)
    throw new Error(
      "Location permission is needed to record your route. Enable it in your phone settings.",
    );
  if (!(await Location.hasServicesEnabledAsync()))
    throw new Error("Turn on your phone’s location services first.");
  const now = Date.now();
  const w: Workout = {
    id: randomUUID(),
    title: `${sport[0].toUpperCase()}${sport.slice(1)} workout`,
    description: "",
    sport,
    visibility: useApp.getState().preferences.defaultVisibility,
    startedAt: now,
    endedAt: null,
    state: "recording",
    activeMs: 0,
    resumedAt: now,
    segment: 0,
    points: [],
    rejected: 0,
    ownerId,
  };
  await serial(() => writeWorkout(w));
  await useApp.getState().refresh();
  try {
    await attachForeground(w.id);
  } catch (e) {
    await mutateWorkout(w.id, (x) => pause(x));
    throw e;
  }
  return w;
}
export async function pauseWorkout(id: string) {
  autoPaused = false;
  stationarySince = null;
  await mutateWorkout(id, (x) => pause(x));
}
export async function resumeWorkout(id: string) {
  autoPaused = false;
  stationarySince = null;
  await attachForeground(id);
  await mutateWorkout(id, (x) => resume(x));
}
export async function enableBackground(id: string) {
  if (!(await TaskManager.isAvailableAsync()))
    throw new Error(
      "Background recording needs an installed development build.",
    );
  const result = await Location.requestBackgroundPermissionsAsync();
  if (!result.granted)
    throw new Error(
      "Allow background location in system settings to use this option.",
    );
  await setValue("backgroundWorkout", id);
  try {
    await Location.startLocationUpdatesAsync(BACKGROUND_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 5,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "StravaKinda is recording",
        notificationBody: "Your route is being saved on this device.",
      },
    });
  } catch (e) {
    await setValue("backgroundWorkout", null);
    throw e;
  }
}
async function stop() {
  watcher?.remove();
  watcher = null;
  foregroundId = null;
  autoPaused = false;
  stationarySince = null;
  if (await Location.hasStartedLocationUpdatesAsync(BACKGROUND_TASK))
    await Location.stopLocationUpdatesAsync(BACKGROUND_TASK);
  await setValue("backgroundWorkout", null);
}
export async function finishWorkout(id: string) {
  await stop();
  await mutateWorkout(id, (w) => ({
    ...pause(w),
    state: "finished",
    endedAt: Date.now(),
  }));
}
export async function discardWorkout(id: string) {
  await stop();
  await deleteWorkout(id);
  await useApp.getState().refresh();
}
export async function recoverRecording() {
  const active = (await readWorkouts()).find((w) => w.state !== "finished");
  if (!active) return;
  if (await Location.hasStartedLocationUpdatesAsync(BACKGROUND_TASK)) {
    await attachForeground(active.id);
    return;
  }
  // No proof of movement after process interruption. Stop the timer at last evidence.
  await mutateWorkout(active.id, (w) =>
    pause(
      w,
      Math.max(
        w.resumedAt ?? w.startedAt,
        w.points.at(-1)?.timestamp ?? w.startedAt,
      ),
    ),
  );
}
let lifecycleInstalled = false;
export function installRecorderLifecycle() {
  if (lifecycleInstalled) return;
  lifecycleInstalled = true;
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      void useApp.getState().refresh();
      return;
    }
    if (state !== "background") return;
    if (foregroundId)
      void (async () => {
        if (!(await Location.hasStartedLocationUpdatesAsync(BACKGROUND_TASK))) {
          const id = foregroundId;
          watcher?.remove();
          watcher = null;
          foregroundId = null;
          if (id) await pauseWorkout(id);
        }
      })().catch((e) => useApp.setState({ error: String(e) }));
  });
}
