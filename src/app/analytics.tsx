import { View } from "react-native";
import {
  Screen,
  Heading,
  Card,
  Copy,
  Metric,
  Row,
  useColors,
} from "../../components/ui";
import { useApp } from "../../store/app";
import { weeklyTotals } from "../../features/analytics/metrics";
import { stats } from "../../utils/tracking";
import { length, duration } from "../../utils/format";
export default function Analytics() {
  const { workouts, preferences: p } = useApp(),
    c = useColors(),
    weeks = weeklyTotals(workouts),
    max = Math.max(1, ...weeks.map((w) => w.meters)),
    finished = workouts.filter((w) => w.state === "finished"),
    best = Math.max(0, ...finished.map((w) => stats(w).meters)),
    year = finished.filter(
      (w) => new Date(w.startedAt).getFullYear() === new Date().getFullYear(),
    );
  return (
    <Screen>
      <Heading eyebrow="See the bigger picture">Built over time.</Heading>
      <Card>
        <Copy>Eight weeks of movement</Copy>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            height: 140,
            gap: 8,
          }}
        >
          {weeks.map((w) => (
            <View
              key={w.start}
              style={{ flex: 1, gap: 8, alignItems: "center" }}
            >
              <View
                accessibilityLabel={`${new Date(w.start).toLocaleDateString()}: ${length(w.meters, p.units)} ${p.units}`}
                style={{
                  backgroundColor: c.accent,
                  height: Math.max(3, (w.meters / max) * 105),
                  width: "100%",
                  borderRadius: 5,
                }}
              />
              <Copy muted>{new Date(w.start).getDate()}</Copy>
            </View>
          ))}
        </View>
        {weeks.map((w) => (
          <Copy muted key={w.start}>
            {new Date(w.start).toLocaleDateString()}:{" "}
            {length(w.meters, p.units)} {p.units} · {w.count} activities
          </Copy>
        ))}
      </Card>
      <Card>
        <Copy>Your longest recorded outing</Copy>
        <Metric label={p.units} value={length(best, p.units)} />
      </Card>
      <Card>
        <Copy>This year</Copy>
        <Row>
          <Metric
            label={p.units}
            value={length(
              year.reduce((sum, w) => sum + stats(w).meters, 0),
              p.units,
            )}
          />
          <Metric
            label="Moving time"
            value={duration(
              year.reduce((sum, w) => sum + stats(w).movingMs, 0),
            )}
          />
        </Row>
      </Card>
      <Copy muted>
        These are descriptive totals from your local recordings. Fitness,
        fatigue, injury risk, and physiological readiness cannot be inferred
        reliably from distance alone. Wearable heart rate and cycling power
        models are reserved in the backend but no wearable source is connected.
      </Copy>
    </Screen>
  );
}
