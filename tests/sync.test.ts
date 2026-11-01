import { beforeEach, expect, it, vi } from "vitest";
import type { Workout } from "../types/activity";
import { syncWorkouts } from "../services/sync";
const fixture = vi.hoisted(() => ({
  workouts: [] as Workout[],
  rpc: vi.fn(),
  createClient: vi.fn(),
  remote: [] as Record<string, unknown>[],
  points: [] as Record<string, unknown>[],
  values: new Map<string, unknown>(),
  deleted: [] as string[],
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: fixture.createClient,
}));
vi.mock("../services/supabase", () => ({
  backend: () => ({
    auth: {
      getSession: async () => ({
        data: { session: { access_token: "original-user-token" } },
      }),
      getUser: async (token: string) => {
        if (token !== "original-user-token") throw new Error("Wrong token");
        return { data: { user: { id: "owner-1" } }, error: null };
      },
    },
  }),
}));
vi.mock("../store/app", () => ({
  useApp: {
    getState: () => ({
      workouts: fixture.workouts,
      refresh: async () => undefined,
    }),
  },
  mutateWorkout: async (id: string, change: (w: Workout) => Workout) => {
    fixture.workouts = fixture.workouts.map((w) =>
      w.id === id ? change(w) : w,
    );
  },
}));
vi.mock("../services/database", () => ({
  pendingDeletionIds: async () =>
    [...fixture.values.entries()]
      .filter(([key, value]) => key.startsWith("deleted:") && value === true)
      .map(([key]) => key.slice(8)),
  getValue: async (key: string) => fixture.values.get(key) ?? null,
  setValue: async (key: string, value: unknown) => {
    fixture.values.set(key, value);
  },
  readWorkouts: async () => fixture.workouts,
  serial: async (fn: () => Promise<unknown>) => fn(),
  writeWorkout: async (w: Workout) => {
    fixture.workouts.push(w);
  },
}));
const workout = (): Workout => ({
  id: "workout-1",
  ownerId: "owner-1",
  title: "My walk",
  description: "",
  sport: "walking",
  visibility: "private",
  startedAt: 1000,
  endedAt: 11000,
  activeMs: 10000,
  resumedAt: null,
  state: "finished",
  segment: 0,
  points: [],
  rejected: 0,
});
beforeEach(() => {
  fixture.workouts = [workout()];
  fixture.remote = [];
  fixture.points = [];
  fixture.values.clear();
  fixture.deleted = [];
  fixture.rpc.mockReset().mockResolvedValue({ error: null });
  fixture.createClient.mockReset().mockReturnValue({
    rpc: fixture.rpc,
    from: (table: string) => {
      let deleting = false;
      const query = {
        delete: () => {
          deleting = true;
          return query;
        },
        select: () => query,
        eq: (field: string, value: string) => {
          if (deleting && field === "id") fixture.deleted.push(value);
          return query;
        },
        order: () => query,
        range: async () => ({
          data: table === "activities" ? fixture.remote : fixture.points,
          error: null,
        }),
      };
      return query;
    },
  });
});
it("retries queued cloud deletions and never uploads a tombstoned workout", async () => {
  fixture.values.set("deleted:workout-1", true);
  fixture.values.set("deleted-owner:workout-1", "owner-1");
  await syncWorkouts();
  expect(fixture.rpc).not.toHaveBeenCalled();
  expect(fixture.deleted).toContain("workout-1");
  expect(fixture.values.get("deleted:workout-1")).toBe("confirmed");
});
it("removes an upload that finishes after the user requests deletion", async () => {
  fixture.rpc.mockImplementationOnce(async () => {
    fixture.values.set("deleted:workout-1", true);
    return { error: null };
  });
  await syncWorkouts();
  expect(fixture.deleted).toContain("workout-1");
  expect(fixture.workouts[0].syncedAt).toBeUndefined();
});
it("uploads only finished workouts linked to the authenticated account and pins its JWT", async () => {
  fixture.workouts.push(
    { ...workout(), id: "another", ownerId: "owner-2" },
    { ...workout(), id: "anonymous", ownerId: undefined },
    { ...workout(), id: "draft", state: "paused" },
  );
  await syncWorkouts();
  expect(fixture.rpc).toHaveBeenCalledTimes(1);
  expect(fixture.workouts[0].syncedAt).toBeGreaterThan(0);
  expect(fixture.workouts.slice(1).every((w) => !w.syncedAt)).toBe(true);
  expect(
    fixture.createClient.mock.calls[0][2].global.headers.Authorization,
  ).toBe("Bearer original-user-token");
});
it("keeps failed uploads queued and successfully retries", async () => {
  fixture.rpc.mockResolvedValueOnce({ error: new Error("offline") });
  await expect(syncWorkouts()).rejects.toThrow("offline");
  expect(fixture.workouts[0].syncedAt).toBeUndefined();
  await syncWorkouts();
  expect(fixture.workouts[0].syncedAt).toBeGreaterThan(0);
});
it("does not mark an edit made during an upload as synchronized", async () => {
  fixture.rpc.mockImplementationOnce(async () => {
    fixture.workouts[0] = {
      ...fixture.workouts[0],
      title: "Edited while uploading",
    };
    return { error: null };
  });
  await syncWorkouts();
  expect(fixture.workouts[0].title).toBe("Edited while uploading");
  expect(fixture.workouts[0].syncedAt).toBeUndefined();
});
it("restores missing private cloud activities and their raw points for the owner", async () => {
  fixture.workouts = [];
  fixture.remote = [
    {
      id: "restored",
      user_id: "owner-1",
      title: "Cloud walk",
      description: "",
      sport: "walking",
      visibility: "private",
      started_at: "2026-01-01T00:00:00Z",
      ended_at: "2026-01-01T00:01:00Z",
      active_seconds: 40,
    },
  ];
  fixture.points = [
    {
      latitude: 27,
      longitude: 85,
      recorded_at: "2026-01-01T00:00:00Z",
      accuracy: 5,
      altitude: null,
      altitude_accuracy: null,
      segment: 0,
    },
  ];
  await syncWorkouts();
  expect(fixture.workouts).toHaveLength(1);
  expect(fixture.workouts[0].points[0].latitude).toBe(27);
  expect(fixture.workouts[0].activeMs).toBe(40000);
  await syncWorkouts();
  expect(fixture.workouts).toHaveLength(1);
});
