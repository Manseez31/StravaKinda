import type { Sport, TrackPoint, Workout } from "../types/activity";
const radians = (n: number) => (n * Math.PI) / 180;
export function distance(
  a: Pick<TrackPoint, "latitude" | "longitude">,
  b: Pick<TrackPoint, "latitude" | "longitude">,
): number {
  const dLat = radians(b.latitude - a.latitude),
    dLon = radians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a.latitude)) *
      Math.cos(radians(b.latitude)) *
      Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}
export function validPoint(p: TrackPoint) {
  return (
    [p.latitude, p.longitude, p.timestamp, p.accuracy].every(Number.isFinite) &&
    Math.abs(p.latitude) <= 90 &&
    Math.abs(p.longitude) <= 180 &&
    p.accuracy >= 0 &&
    p.accuracy <= 35
  );
}
const maxSpeed: Record<Sport, number> = {
  walking: 4,
  running: 12,
  hiking: 5,
  cycling: 35,
};
export function addPoint(w: Workout, point: TrackPoint): Workout {
  if (w.state !== "recording") return w;
  const p = { ...point, segment: w.segment },
    last = w.points.at(-1);
  const dt = last ? (p.timestamp - last.timestamp) / 1000 : 0;
  if (
    !validPoint(p) ||
    p.timestamp < w.startedAt ||
    (last &&
      (dt <= 0 ||
        (last.segment === p.segment &&
          distance(last, p) / dt > maxSpeed[w.sport])))
  )
    return { ...w, rejected: w.rejected + 1 };
  // Ignore stationary jitter; retain a baseline for slow movement over time.
  if (
    last &&
    last.segment === p.segment &&
    dt < 30 &&
    distance(last, p) < Math.max(3, Math.min(last.accuracy, p.accuracy) * 0.4)
  )
    return w;
  return { ...w, points: [...w.points, p] };
}
export function activeTime(w: Workout, now = Date.now()) {
  return (
    w.activeMs + (w.resumedAt === null ? 0 : Math.max(0, now - w.resumedAt))
  );
}
export function pause(w: Workout, now = Date.now()): Workout {
  return w.state !== "recording"
    ? w
    : { ...w, activeMs: activeTime(w, now), resumedAt: null, state: "paused" };
}
export function resume(w: Workout, now = Date.now()): Workout {
  return w.state !== "paused"
    ? w
    : { ...w, resumedAt: now, state: "recording", segment: w.segment + 1 };
}
export function stats(w: Workout, now = Date.now()) {
  let meters = 0,
    elevation = 0,
    movingMs = 0;
  const splits: { km: number; seconds: number }[] = [];
  let splitStart = 0;
  for (let i = 1; i < w.points.length; i++) {
    const a = w.points[i - 1],
      b = w.points[i];
    if (a.segment !== b.segment) continue;
    const d = distance(a, b),
      dt = b.timestamp - a.timestamp;
    // Gaps are not evidence of motion and must not become straight-line routes.
    if (dt > 60000) continue;
    const before = meters;
    meters += d;
    const move = d / (dt / 1000) >= 0.5 ? dt : 0;
    const priorMoving = movingMs;
    movingMs += move;
    while (meters >= (splits.length + 1) * 1000) {
      const crossing =
        priorMoving + move * (((splits.length + 1) * 1000 - before) / d);
      splits.push({
        km: splits.length + 1,
        seconds: (crossing - splitStart) / 1000,
      });
      splitStart = crossing;
    }
    if (
      a.altitude !== null &&
      b.altitude !== null &&
      a.altitudeAccuracy !== null &&
      b.altitudeAccuracy !== null &&
      a.altitudeAccuracy <= 10 &&
      b.altitudeAccuracy <= 10
    ) {
      const gain = b.altitude - a.altitude;
      if (gain >= 3 && gain <= d * 0.5) elevation += gain;
    }
  }
  const activeMs = activeTime(w, w.endedAt ?? now);
  return {
    meters,
    elevation,
    movingMs,
    activeMs,
    elapsedMs: (w.endedAt ?? now) - w.startedAt,
    pace: meters > 0 ? movingMs / meters : null,
    splits,
  };
}
export function trackSegments(points: TrackPoint[]) {
  const result: TrackPoint[][] = [];
  for (const p of points) {
    const group = result.at(-1),
      last = group?.at(-1);
    if (
      !last ||
      last.segment !== p.segment ||
      p.timestamp - last.timestamp > 60000
    )
      result.push([p]);
    else group!.push(p);
  }
  return result;
}
export function gpx(w: Workout): string {
  const escape = (s: string) =>
    s.replace(
      /[<>&"']/g,
      (c) =>
        ({
          "<": "&lt;",
          ">": "&gt;",
          "&": "&amp;",
          '"': "&quot;",
          "'": "&apos;",
        })[c]!,
    );
  return `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="StravaKinda" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>${escape(w.title)}</name>${trackSegments(
    w.points,
  )
    .map(
      (group) =>
        `<trkseg>${group.map((p) => `<trkpt lat="${p.latitude}" lon="${p.longitude}">${p.altitude !== null ? `<ele>${p.altitude}</ele>` : ""}<time>${new Date(p.timestamp).toISOString()}</time></trkpt>`).join("")}</trkseg>`,
    )
    .join("")}</trk></gpx>`;
}
