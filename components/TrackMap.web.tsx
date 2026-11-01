import type { TrackPoint } from "../types/activity";
import { Card, Copy } from "./ui";
export default function TrackMap(_props: {
  points: TrackPoint[];
  onPress?: unknown;
  current?: boolean;
  cursor?: TrackPoint;
}) {
  return (
    <Card>
      <Copy>Native map</Copy>
      <Copy muted>
        Use the Android or iOS app for interactive maps and GPS recording. Web
        is a layout preview.
      </Copy>
    </Card>
  );
}
