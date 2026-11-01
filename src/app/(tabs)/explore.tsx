import { router } from "expo-router";
import { Screen, Heading, Card, Copy, Button } from "../../../components/ui";
import TrackMap from "../../../components/TrackMap";
export default function Explore() {
  return (
    <Screen>
      <Heading eyebrow="A little further">Find your next{"\n"}way out.</Heading>
      <TrackMap points={[]} />
      <Card>
        <Copy>Take the scenic route</Copy>
        <Copy muted>
          Create a route with map waypoints and keep it on this device.
          Distances are straight lines between waypoints, not turn-by-turn
          directions.
        </Copy>
        <Button
          title="My routes & route builder"
          onPress={() => router.push("/routes")}
        />
      </Card>
      <Button
        secondary
        title="Find athletes"
        onPress={() => router.push("/search")}
      />
      <Button
        secondary
        title="Clubs & challenges"
        onPress={() => router.push("/community")}
      />
      <Copy muted>
        Nearby route search needs a licensed route provider; none is configured.
        Offline route geometry is available locally; offline base-map tiles are
        not downloaded.
      </Copy>
    </Screen>
  );
}
