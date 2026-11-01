import type { Workout } from "../../types/activity";
import { stats } from "../../utils/tracking";
export function weeklyTotals(workouts: Workout[], now = Date.now()) {
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() - ((end.getDay() + 6) % 7));
  return Array.from({ length: 8 }, (_, i) => {
    const start = +end - (7 - i) * 7 * 86400000;
    const items = workouts.filter(
      (w) =>
        w.state === "finished" &&
        w.startedAt >= start &&
        w.startedAt < start + 7 * 86400000,
    );
    return {
      start,
      meters: items.reduce((sum, w) => sum + stats(w).meters, 0),
      count: items.length,
    };
  });
}
