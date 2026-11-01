import { useEffect, useState } from "react";
import {
  Screen,
  Heading,
  Copy,
  Card,
  Button,
  Field,
  Row,
} from "../../components/ui";
import TrackMap from "../../components/TrackMap";
import type { TrackPoint } from "../../types/activity";
import { getValue, setValue } from "../../services/database";
import { distance } from "../../utils/tracking";
import { useAction } from "../../hooks/useAction";
type Route = { id: string; title: string; points: TrackPoint[] };
export default function Routes() {
  const [saved, setSaved] = useState<Route[]>([]),
    [points, setPoints] = useState<TrackPoint[]>([]),
    [title, setTitle] = useState("My route"),
    a = useAction();
  const { run } = a;
  useEffect(() => {
    void run(async () => setSaved((await getValue<Route[]>("routes")) ?? []));
  }, [run]);
  const meters = points.reduce(
    (total, p, i) => total + (i ? distance(points[i - 1], p) : 0),
    0,
  );
  return (
    <Screen>
      <Heading eyebrow="Choose your own way">Route studio</Heading>
      <Copy muted>
        Tap the map to add waypoints. This basic builder connects them with
        straight lines; roads and access restrictions are not checked.
      </Copy>
      <TrackMap
        points={points}
        onPress={(event) =>
          setPoints((current) => [
            ...current,
            {
              ...event.nativeEvent.coordinate,
              timestamp: Date.now(),
              accuracy: 0,
              altitude: null,
              altitudeAccuracy: null,
              segment: 0,
            },
          ])
        }
      />
      <Row>
        <Button
          secondary
          title="Undo point"
          onPress={() => setPoints((p) => p.slice(0, -1))}
        />
        <Button secondary title="Clear" onPress={() => setPoints([])} />
      </Row>
      <Field
        label="Route name"
        value={title}
        onChangeText={setTitle}
        maxLength={120}
      />
      <Copy>
        {(meters / 1000).toFixed(2)} km · {points.length} waypoints
      </Copy>
      <Button
        title="Save route offline"
        disabled={points.length < 2 || !title.trim() || a.busy}
        onPress={() =>
          void a.run(async () => {
            const next = [
              ...saved,
              { id: String(Date.now()), title: title.trim(), points },
            ];
            await setValue("routes", next);
            setSaved(next);
            setPoints([]);
          }, "Route geometry saved on this device. Base-map tiles still require internet.")
        }
      />
      {saved.map((r) => (
        <Card key={r.id}>
          <Copy>
            {r.title} · {r.points.length} waypoints
          </Copy>
          <Button
            secondary
            title="Open"
            onPress={() => {
              setPoints(r.points);
              setTitle(r.title);
            }}
          />
          <Button
            secondary
            title="Delete saved route"
            onPress={() =>
              void a.run(async () => {
                const next = saved.filter((x) => x.id !== r.id);
                await setValue("routes", next);
                setSaved(next);
              })
            }
          />
        </Card>
      ))}
      {a.message && <Copy>{a.message}</Copy>}
    </Screen>
  );
}
