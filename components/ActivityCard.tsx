import { router } from "expo-router";
import { Card, Copy, Button, Row, Metric } from "./ui";
import type { Workout } from "../types/activity";
import { stats } from "../utils/tracking";
import { length, duration } from "../utils/format";
import { useApp } from "../store/app";
export default function ActivityCard({ workout: w }: { workout: Workout }) {
  const units = useApp((s) => s.preferences.units),
    s = stats(w);
  return (
    <Card>
      <Copy muted>
        {w.sport.toUpperCase()} · {new Date(w.startedAt).toLocaleDateString()} ·{" "}
        {w.visibility}
      </Copy>
      <Copy>{w.title}</Copy>
      <Row>
        <Metric label={units} value={length(s.meters, units)} />
        <Metric label="Moving time" value={duration(s.movingMs)} />
      </Row>
      <Button
        secondary
        title="View activity →"
        onPress={() => router.push(`/activity/${w.id}`)}
      />
    </Card>
  );
}
