import { useState } from "react";
import {
  Screen,
  Heading,
  Row,
  Button,
  Empty,
  Loading,
  Copy,
} from "../../../components/ui";
import ActivityCard from "../../../components/ActivityCard";
import { useApp } from "../../../store/app";
import type { Sport } from "../../../types/activity";
export default function Activities() {
  const { workouts, ready } = useApp();
  const [filter, setFilter] = useState<Sport | "all">("all");
  const items = workouts.filter(
    (w) => w.state === "finished" && (filter === "all" || w.sport === filter),
  );
  return (
    <Screen>
      <Heading eyebrow="The work you put in">Your activity journal</Heading>
      <Copy muted>Small steps. A bigger picture.</Copy>
      <Row>
        {(["all", "running", "walking", "cycling", "hiking"] as const).map(
          (s) => (
            <Button
              key={s}
              title={s}
              secondary={filter !== s}
              onPress={() => setFilter(s)}
            />
          ),
        )}
      </Row>
      {!ready ? (
        <Loading />
      ) : !items.length ? (
        <Empty
          title="A clean slate"
          detail="Saved activities will appear here. Try a different filter or head to Record."
        />
      ) : (
        items.map((w) => <ActivityCard key={w.id} workout={w} />)
      )}
    </Screen>
  );
}
