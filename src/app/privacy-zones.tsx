import { useState } from "react";
import {
  Screen,
  Heading,
  Copy,
  Field,
  Button,
  Card,
} from "../../components/ui";
import { backend } from "../../services/supabase";
import { useSession } from "../../hooks/useSession";
import { useAction } from "../../hooks/useAction";
export default function PrivacyZones() {
  const session = useSession(),
    a = useAction(),
    [lat, setLat] = useState(""),
    [lon, setLon] = useState(""),
    [radius, setRadius] = useState("300");
  return (
    <Screen>
      <Heading>Keep home, home.</Heading>
      <Copy muted>
        Raw cloud tracks are owner-only in this release, including public
        activities. Zones are stored for future shared-route redaction. Sharing
        a GPX export still includes the full route.
      </Copy>
      <Card>
        <Field
          label="Center latitude"
          value={lat}
          onChangeText={setLat}
          keyboardType="numbers-and-punctuation"
        />
        <Field
          label="Center longitude"
          value={lon}
          onChangeText={setLon}
          keyboardType="numbers-and-punctuation"
        />
        <Field
          label="Radius (100–5000 meters)"
          value={radius}
          onChangeText={setRadius}
          keyboardType="numeric"
        />
        <Button
          title="Save private zone"
          disabled={!session || a.busy}
          onPress={() =>
            void a.run(async () => {
              const latitude = Number(lat),
                longitude = Number(lon),
                radius_m = Number(radius);
              if (
                !lat.trim() ||
                !lon.trim() ||
                !Number.isFinite(latitude) ||
                Math.abs(latitude) > 90 ||
                !Number.isFinite(longitude) ||
                Math.abs(longitude) > 180 ||
                !Number.isFinite(radius_m) ||
                radius_m < 100 ||
                radius_m > 5000
              )
                throw new Error(
                  "Enter valid coordinates and a radius between 100 and 5000 meters.",
                );
              const r = await backend().from("privacy_zones").insert({
                user_id: session!.user.id,
                latitude,
                longitude,
                radius_m,
              });
              if (r.error) throw r.error;
            }, "Zone saved privately.")
          }
        />
      </Card>
      {a.message && <Copy>{a.message}</Copy>}
    </Screen>
  );
}
