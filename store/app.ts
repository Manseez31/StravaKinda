import { create } from "zustand";
import type { Preferences, Workout } from "../types/activity";
import {
  getValue,
  readWorkouts,
  serial,
  setValue,
  writeWorkout,
} from "../services/database";
type State = {
  ready: boolean;
  workouts: Workout[];
  preferences: Preferences;
  error: string | null;
  refresh: () => Promise<void>;
  configure: (p: Partial<Preferences>) => Promise<void>;
};
export const useApp = create<State>((set, get) => ({
  ready: false,
  workouts: [],
  error: null,
  preferences: {
    units: "km",
    theme: "dark",
    weeklyGoalKm: 20,
    defaultVisibility: "private",
    autoPause: false,
  },
  refresh: async () => {
    try {
      const [workouts, prefs] = await Promise.all([
        readWorkouts(),
        getValue<Preferences>("preferences"),
      ]);
      set({
        workouts,
        preferences: prefs ?? get().preferences,
        ready: true,
        error: null,
      });
    } catch (e) {
      set({ ready: true, error: String(e) });
    }
  },
  configure: async (p) => {
    const preferences = { ...get().preferences, ...p };
    await setValue("preferences", preferences);
    set({ preferences });
  },
}));
export async function mutateWorkout(
  id: string,
  change: (w: Workout) => Workout,
) {
  return serial(async () => {
    const w = (await readWorkouts()).find((x) => x.id === id);
    if (!w) throw new Error("Workout no longer exists.");
    const next = change(w);
    await writeWorkout(next);
    await useApp.getState().refresh();
    return next;
  });
}
