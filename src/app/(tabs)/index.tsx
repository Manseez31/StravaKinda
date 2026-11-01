import { View } from "react-native";
import { router } from "expo-router";
import {
  Screen,
  Heading,
  Card,
  Copy,
  Row,
  Metric,
  Button,
  Empty,
  Loading,
  useColors,
} from "../../../components/ui";
import { useApp } from "../../../store/app";
import { stats } from "../../../utils/tracking";
import { length } from "../../../utils/format";
import ActivityCard from "../../../components/ActivityCard";
export default function Home() {
  const { workouts, preferences: p, ready, error } = useApp(),
    c = useColors();
  const finished = workouts.filter((w) => w.state === "finished");
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const week = finished.filter((w) => w.startedAt >= +start),
    meters = week.reduce((sum, w) => sum + stats(w).meters, 0);
  const month = finished.filter(
    (w) =>
      new Date(w.startedAt).getMonth() === new Date().getMonth() &&
      new Date(w.startedAt).getFullYear() === new Date().getFullYear(),
  );
  return (
    <Screen>
      <Heading eyebrow="Your next chapter">
        Make room{"\n"}for movement.
      </Heading>
      <Copy muted>Every outing adds up. Find your rhythm.</Copy>
      {!ready && <Loading />}
      {error && <Copy>{error}</Copy>}
      <Card>
        <Copy muted>THIS WEEK</Copy>
        <Row>
          <Metric
            label={`${p.units} covered`}
            value={length(meters, p.units)}
          />
          <Metric label="Activities" value={String(week.length)} />
        </Row>
        <View
          accessibilityLabel={`${Math.round(meters / (p.weeklyGoalKm * 10))}% of weekly goal`}
          style={{ height: 6, backgroundColor: c.raised, borderRadius: 8 }}
        >
          <View
            style={{
              height: 6,
              width: `${Math.min(100, meters / (p.weeklyGoalKm * 10))}%`,
              backgroundColor: c.accent,
              borderRadius: 8,
            }}
          />
        </View>
        <Copy muted>
          {length(p.weeklyGoalKm * 1000, p.units)} {p.units} weekly goal · set
          your own pace
        </Copy>
        <Button
          title="Record an activity ↗"
          onPress={() => router.push("/record")}
        />
      </Card>
      <Row>
        <Button
          secondary
          title="Training trends"
          onPress={() => router.push("/analytics")}
        />
        <Button
          secondary
          title="AI coach"
          onPress={() => router.push("/coach")}
        />
      </Row>
      <Card>
        <Copy>This month</Copy>
        <Row>
          <Metric
            label={p.units}
            value={length(
              month.reduce((s, w) => s + stats(w).meters, 0),
              p.units,
            )}
          />
          <Metric label="Outings" value={String(month.length)} />
        </Row>
      </Card>
      <Heading eyebrow="Your journal">Recent movement</Heading>
      {finished.length ? (
        finished.slice(0, 3).map((w) => <ActivityCard key={w.id} workout={w} />)
      ) : (
        <Empty
          title="Your story starts outside"
          detail="Record your first walk, run, ride, or hike. Your activities stay on this device until you choose to sync."
        />
      )}
      <Button
        secondary
        title="Community feed"
        onPress={() => router.push("/social")}
      />
    </Screen>
  );
}
