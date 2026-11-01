import { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import {
  Screen,
  Heading,
  Card,
  Copy,
  Button,
  Row,
  Metric,
} from "../../../components/ui";
import TrackMap from "../../../components/TrackMap";
import { useApp } from "../../../store/app";
import { useSession } from "../../../hooks/useSession";
import { useAction } from "../../../hooks/useAction";
import {
  startWorkout,
  pauseWorkout,
  resumeWorkout,
  finishWorkout,
  discardWorkout,
  enableBackground,
} from "../../../services/recorder";
import { stats } from "../../../utils/tracking";
import { duration, length, pace } from "../../../utils/format";
import type { Sport } from "../../../types/activity";
export default function Record() {
  const { workouts, preferences: p, error } = useApp(),
    session = useSession(),
    action = useAction();
  const [sport, setSport] = useState<Sport>("running"),
    [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const w = workouts.find((w) => w.state !== "finished"),
    s = w ? stats(w, now) : null;
  return (
    <Screen>
      <Heading eyebrow={w ? w.state : "Go at your pace"}>
        {w ? "You’re out there." : "A fresh start."}
      </Heading>
      {!w ? (
        <>
          <Copy muted>
            Location is used to measure your workout and save your route.
            Foreground mode pauses when you leave the app. No account required.
          </Copy>
          <Row>
            {(["running", "walking", "cycling", "hiking"] as Sport[]).map(
              (type) => (
                <Button
                  key={type}
                  title={`${sport === type ? "● " : ""}${type}`}
                  secondary={sport !== type}
                  onPress={() => setSport(type)}
                />
              ),
            )}
          </Row>
          <Card>
            <Copy>GPS, with your permission</Copy>
            <Copy muted>
              Wait for an accurate fix before moving. Routes are private by
              default. Background mode is optional and needs an installed
              development build.
            </Copy>
            <Button
              title="Start activity"
              disabled={action.busy || Platform.OS === "web"}
              onPress={() =>
                void action.run(() => startWorkout(sport, session?.user.id))
              }
            />
          </Card>
        </>
      ) : (
        <>
          <TrackMap points={w.points} current />
          <Card>
            <Metric
              label={`${p.units} distance`}
              value={length(s!.meters, p.units)}
            />
            <Row>
              <Metric label="Active time" value={duration(s!.activeMs)} />
              <Metric
                label={`Average /${p.units}`}
                value={pace(s!.pace, p.units)}
              />
            </Row>
            <Copy muted>
              Moving {duration(s!.movingMs)} · elapsed {duration(s!.elapsedMs)}
            </Copy>
            <Copy muted>
              {w.points.length} fixes saved · {w.rejected} rejected
            </Copy>
            <Button
              disabled={action.busy}
              title={w.state === "recording" ? "Pause" : "Resume"}
              onPress={() =>
                void action.run(() =>
                  w.state === "recording"
                    ? pauseWorkout(w.id)
                    : resumeWorkout(w.id),
                )
              }
            />
            <Button
              disabled={action.busy}
              title="Finish & save locally"
              secondary
              onPress={() =>
                void action.run(
                  () => finishWorkout(w.id),
                  "Activity saved. Find it in Activities.",
                )
              }
            />
          </Card>
          <Button
            secondary
            title="Enable background recording"
            disabled={action.busy}
            onPress={() =>
              void action.run(
                () => enableBackground(w.id),
                "Background tracking enabled. OS battery limits still apply; force termination may stop recording.",
              )
            }
          />
          <Copy muted>
            Background tracking can use more battery. iOS and Android may stop
            location updates. Never rely on this app for navigation or safety.
          </Copy>
          <Button
            secondary
            title="Discard workout"
            disabled={action.busy}
            onPress={() =>
              Alert.alert(
                "Discard workout?",
                "This deletes the unfinished recording from this device.",
                [
                  { text: "Keep", style: "cancel" },
                  {
                    text: "Discard",
                    style: "destructive",
                    onPress: () => void action.run(() => discardWorkout(w.id)),
                  },
                ],
              )
            }
          />
        </>
      )}
      {(action.message || error) && <Copy>{action.message || error}</Copy>}
    </Screen>
  );
}
