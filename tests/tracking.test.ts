import { describe, expect, it } from "vitest";
import {
  addPoint,
  distance,
  gpx,
  pause,
  resume,
  stats,
  trackSegments,
} from "../utils/tracking";
import type { TrackPoint, Workout } from "../types/activity";
const point = (
  latitude: number,
  timestamp: number,
  extra: Partial<TrackPoint> = {},
): TrackPoint => ({
  latitude,
  longitude: 0,
  timestamp,
  accuracy: 5,
  altitude: null,
  altitudeAccuracy: null,
  segment: 0,
  ...extra,
});
const workout = (): Workout => ({
  id: "test",
  title: "<Morning & run>",
  description: "",
  sport: "running",
  visibility: "private",
  startedAt: 1000,
  endedAt: null,
  state: "recording",
  resumedAt: 1000,
  activeMs: 0,
  segment: 0,
  points: [],
  rejected: 0,
});
describe("GPS geometry and quality", () => {
  it("measures known spherical distances and the date line", () => {
    expect(distance(point(0, 1), point(1, 2))).toBeCloseTo(111194.93, 1);
    expect(
      distance(
        { latitude: 0, longitude: 179.9 },
        { latitude: 0, longitude: -179.9 },
      ),
    ).toBeCloseTo(22238.99, 1);
  });
  it("rejects inaccurate, invalid, stale, and implausibly fast fixes", () => {
    let w = addPoint(workout(), point(0, 1000));
    for (const p of [
      point(0, 2000, { accuracy: 100 }),
      point(91, 3000),
      point(0, 1000),
      point(1, 2000),
      point(NaN, 5000),
    ])
      w = addPoint(w, p);
    expect(w.points).toHaveLength(1);
    expect(w.rejected).toBe(5);
  });
  it("does not inflate distance from stationary jitter", () => {
    let w = addPoint(workout(), point(0, 1000));
    w = addPoint(w, point(0.000001, 5000));
    expect(w.points).toHaveLength(1);
    expect(stats(w).meters).toBe(0);
  });
  it("uses sport-specific speed bounds", () => {
    const w = { ...workout(), sport: "cycling" as const };
    const first = addPoint(w, point(0, 1000));
    expect(addPoint(first, point(0.002, 11000)).points).toHaveLength(2);
    expect(
      addPoint(addPoint(workout(), point(0, 1000)), point(0.002, 11000))
        .rejected,
    ).toBe(1);
  });
});
describe("workout state and statistics", () => {
  it("freezes paused time and ignores duplicate pause/resume", () => {
    let w = pause(workout(), 11000);
    expect(stats(w, 90000).activeMs).toBe(10000);
    w = pause(w, 12000);
    w = resume(w, 21000);
    w = resume(w, 22000);
    expect(stats(w, 31000).activeMs).toBe(20000);
    expect(w.segment).toBe(1);
  });
  it("never joins a paused route or missing GPS gap", () => {
    let w = addPoint(workout(), point(0, 1000));
    w = resume(pause(w, 5000), 100000);
    w = addPoint(w, point(1, 100001));
    expect(stats(w).meters).toBe(0);
    expect(trackSegments(w.points)).toHaveLength(2);
    const gap = {
      ...workout(),
      points: [point(0, 1000), point(0.0005, 70000)],
    };
    expect(stats(gap).meters).toBe(0);
    expect(trackSegments(gap.points)).toHaveLength(2);
  });
  it("interpolates kilometer splits and pace", () => {
    const points = Array.from({ length: 121 }, (_, i) =>
      point(i * 0.0001, 1000 + i * 5000),
    );
    const w = { ...workout(), points };
    const s = stats(w, 601000);
    expect(s.meters).toBeCloseTo(1334.34, 1);
    expect(s.splits).toHaveLength(1);
    expect(s.splits[0].seconds).toBeCloseTo(449.66, 1);
    expect(s.pace).toBeCloseTo(449.66, 1);
  });
  it("uses only reliable altitude and handles absent elevation", () => {
    expect(stats(workout()).elevation).toBe(0);
    const w = {
      ...workout(),
      points: [
        point(0, 1000, { altitude: 100, altitudeAccuracy: 3 }),
        point(0.001, 21000, { altitude: 110, altitudeAccuracy: 3 }),
        point(0.002, 41000, { altitude: 500, altitudeAccuracy: 50 }),
      ],
    };
    expect(stats(w).elevation).toBe(10);
  });
  it("exports valid escaped GPX and pause segments", () => {
    const w = {
      ...workout(),
      points: [point(0, 1000), point(1, 100000, { segment: 1 })],
    };
    const xml = gpx(w);
    expect(xml).toContain("&lt;Morning &amp; run&gt;");
    expect(xml.match(/<trkseg>/g)).toHaveLength(2);
    expect(xml).not.toContain("<ele>");
  });
});
