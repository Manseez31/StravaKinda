import { useEffect, useRef } from "react";
import MapView, {
  Marker,
  Polyline,
  type MapPressEvent,
} from "react-native-maps";
import type { TrackPoint } from "../types/activity";
import { trackSegments } from "../utils/tracking";
import { View, Platform } from "react-native";
import { Card, Copy } from "./ui";
export default function TrackMap({
  points,
  onPress,
  current = false,
  cursor,
}: {
  points: TrackPoint[];
  onPress?: (event: MapPressEvent) => void;
  current?: boolean;
  cursor?: TrackPoint;
}) {
  const map = useRef<MapView>(null),
    last = points.at(-1);
  useEffect(() => {
    if (!last) return;
    if (current)
      map.current?.animateToRegion({
        ...last,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      });
    else
      map.current?.fitToCoordinates(points, {
        edgePadding: { top: 35, bottom: 35, left: 35, right: 35 },
        animated: false,
      });
  }, [points, current, last]);
  if (Platform.OS === "android" && !process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY)
    return (
      <Card>
        <Copy>Map not configured</Copy>
        <Copy muted>
          Your GPS recording still works. A map will appear after the app’s
          Android map service is configured.
        </Copy>
      </Card>
    );
  return (
    <View style={{ borderRadius: 20, overflow: "hidden", height: 290 }}>
      <MapView
        ref={map}
        style={{ flex: 1 }}
        showsUserLocation={current}
        onPress={onPress}
        initialRegion={
          last
            ? { ...last, latitudeDelta: 0.02, longitudeDelta: 0.02 }
            : undefined
        }
      >
        {trackSegments(points).map((group, i) => (
          <Polyline
            key={i}
            coordinates={group}
            strokeWidth={5}
            strokeColor="#ff784b"
          />
        ))}
        {cursor && <Marker coordinate={cursor} title="Replay position" />}
      </MapView>
      {!last && !onPress && (
        <View
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            right: 12,
            padding: 12,
            borderRadius: 10,
            backgroundColor: "#1a2023",
          }}
        >
          <Copy muted>Waiting for an accurate GPS fix</Copy>
        </View>
      )}
    </View>
  );
}
