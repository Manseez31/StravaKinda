import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  Screen,
  Heading,
  Card,
  Copy,
  Button,
  Row,
  Metric,
  Field,
  Empty,
} from "../../../components/ui";
import TrackMap from "../../../components/TrackMap";
import { mutateWorkout, useApp } from "../../../store/app";
import { stats, gpx } from "../../../utils/tracking";
import { duration, length, pace } from "../../../utils/format";
import { useAction } from "../../../hooks/useAction";
import { shareFile } from "../../../services/export";
import { deleteWorkout, setValue } from "../../../services/database";
import { backend } from "../../../services/supabase";
import { useSession } from "../../../hooks/useSession";
import type { Sport, Visibility } from "../../../types/activity";
export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    { workouts, preferences: p } = useApp(),
    w = workouts.find((x) => x.id === id),
    action = useAction(),
    session = useSession();
  const [title, setTitle] = useState(w?.title ?? ""),
    [description, setDescription] = useState(w?.description ?? ""),
    [replay, setReplay] = useState(0),
    [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing || !w) return;
    const timer = setInterval(
      () =>
        setReplay((i) => {
          if (i >= w.points.length - 1) {
            setPlaying(false);
            return 0;
          }
          return i + 1;
        }),
      150,
    );
    return () => clearInterval(timer);
  }, [playing, w]);
  if (!w)
    return (
      <Screen>
        <Empty
          title="Activity unavailable"
          detail="This activity may have been deleted."
        />
      </Screen>
    );
  const s = stats(w);
  return (
    <Screen>
      <Heading
        eyebrow={`${w.sport} · ${new Date(w.startedAt).toLocaleDateString()}`}
      >
        {w.title}
      </Heading>
      <TrackMap points={w.points} cursor={w.points[replay]} />
      <Button
        secondary
        title={playing ? "Stop replay" : "Replay route"}
        disabled={!w.points.length}
        onPress={() => {
          setReplay(0);
          setPlaying(!playing);
        }}
      />
      <Card>
        <Row>
          <Metric label={p.units} value={length(s.meters, p.units)} />
          <Metric label={`Pace /${p.units}`} value={pace(s.pace, p.units)} />
        </Row>
        <Row>
          <Metric label="Moving time" value={duration(s.movingMs)} />
          <Metric label="Elapsed" value={duration(s.elapsedMs)} />
        </Row>
        <Copy muted>
          Elevation gain: {s.elevation.toFixed(0)} m (reliable altitude only)
        </Copy>
        <Copy muted>
          Average speed:{" "}
          {s.movingMs > 0
            ? (
                ((s.meters / s.movingMs) * 3600) /
                (p.units === "mi" ? 1.609344 : 1)
              ).toFixed(1)
            : "—"}{" "}
          {p.units}/h
        </Copy>
      </Card>
      <Card>
        <Copy>Kilometer splits</Copy>
        {s.splits.length ? (
          s.splits.map((split) => (
            <Copy key={split.km}>
              {split.km} km · {pace(split.seconds, "km")} /km
            </Copy>
          ))
        ) : (
          <Copy muted>Complete a kilometer to see your splits.</Copy>
        )}
      </Card>
      <Card>
        <Field
          label="Title"
          value={title}
          onChangeText={setTitle}
          maxLength={120}
        />
        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={2000}
        />
        <Button
          title="Save changes"
          disabled={action.busy || !title.trim()}
          onPress={() =>
            void action.run(
              () =>
                mutateWorkout(w.id, (current) => ({
                  ...current,
                  title: title.trim(),
                  description,
                  syncedAt: undefined,
                })),
              "Changes saved locally. Sync to update your cloud copy.",
            )
          }
        />
        <Copy>Visibility</Copy>
        <Row>
          {(["private", "followers", "public"] as Visibility[]).map((v) => (
            <Button
              key={v}
              title={v}
              secondary={w.visibility !== v}
              onPress={() =>
                void action.run(() =>
                  mutateWorkout(w.id, (x) => ({
                    ...x,
                    visibility: v,
                    syncedAt: undefined,
                  })),
                )
              }
            />
          ))}
        </Row>
        <Copy>Activity type</Copy>
        <Row>
          {(["running", "walking", "cycling", "hiking"] as Sport[]).map(
            (sport) => (
              <Button
                key={sport}
                title={sport}
                secondary={w.sport !== sport}
                onPress={() =>
                  void action.run(() =>
                    mutateWorkout(w.id, (x) => ({
                      ...x,
                      sport,
                      syncedAt: undefined,
                    })),
                  )
                }
              />
            ),
          )}
        </Row>
      </Card>
      <Button
        title="Export GPX"
        secondary
        onPress={() =>
          void action.run(() =>
            shareFile(`${w.id}.gpx`, gpx(w), "application/gpx+xml"),
          )
        }
      />
      <Copy muted>
        GPX includes the complete private route. Share only with people you
        trust.
      </Copy>
      {!w.ownerId && session && (
        <Button
          secondary
          title="Link this local activity to my account"
          onPress={() =>
            void action.run(
              () =>
                mutateWorkout(w.id, (x) => ({
                  ...x,
                  ownerId: session.user.id,
                  syncedAt: undefined,
                })),
              "Linked. Use Profile → Sync to upload.",
            )
          }
        />
      )}
      <Button
        title="Delete activity"
        secondary
        onPress={() =>
          Alert.alert(
            "Delete activity?",
            "This removes the local activity and its synced copy if one exists.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () =>
                  void action.run(async () => {
                    if (w.ownerId) {
                      if (session?.user.id !== w.ownerId)
                        throw new Error(
                          "Sign in as the activity owner before deleting a linked workout.",
                        );
                      await setValue(`deleted-owner:${w.id}`, w.ownerId);
                      await setValue(`deleted:${w.id}`, true);
                      try {
                        const result = await backend()
                          .from("activities")
                          .delete()
                          .eq("id", w.id);
                        if (result.error) throw result.error;
                      } catch (e) {
                        await setValue(`deleted:${w.id}`, null);
                        throw e;
                      }
                    }
                    await deleteWorkout(w.id);
                    await useApp.getState().refresh();
                    router.back();
                  }),
              },
            ],
          )
        }
      />
      {action.message && <Copy>{action.message}</Copy>}
    </Screen>
  );
}
