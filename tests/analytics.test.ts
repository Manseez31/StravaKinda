import { expect, it } from "vitest";
import { weeklyTotals } from "../features/analytics/metrics";
it("returns eight zero weeks with no invented activity", () => {
  const weeks = weeklyTotals([], Date.UTC(2026, 9, 25));
  expect(weeks).toHaveLength(8);
  expect(weeks.every((w) => w.meters === 0 && w.count === 0)).toBe(true);
});
