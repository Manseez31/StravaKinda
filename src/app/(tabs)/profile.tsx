import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Switch } from "react-native";
import {
  Screen,
  Heading,
  Card,
  Copy,
  Button,
  Field,
  Row,
} from "../../../components/ui";
import { useSession } from "../../../hooks/useSession";
import { useAction } from "../../../hooks/useAction";
import { backend } from "../../../services/supabase";
import { syncWorkouts } from "../../../services/sync";
import { logoutPurchases } from "../../../services/purchases";
export default function Profile() {
  const session = useSession(),
    a = useAction();
  const [name, setName] = useState(""),
    [username, setUsername] = useState(""),
    [bio, setBio] = useState(""),
    [isPrivate, setIsPrivate] = useState(false);
  const userId = session?.user.id;
  const { setMessage } = a;
  useEffect(() => {
    if (!userId) return;
    let active = true;
    void backend()
      .from("profiles")
      .select("name,username,bio,is_private")
      .eq("id", userId)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        if (data) {
          setName(data.name);
          setUsername(data.username ?? "");
          setBio(data.bio);
          setIsPrivate(data.is_private);
        }
        if (error) setMessage(error.message);
      });
    return () => {
      active = false;
    };
  }, [userId, setMessage]);
  return (
    <Screen>
      <Heading eyebrow="The athlete is you">Your space.</Heading>
      {session ? (
        <>
          <Copy muted>{session.user.email}</Copy>
          <Card>
            <Field
              label="Name"
              value={name}
              onChangeText={setName}
              maxLength={80}
            />
            <Field
              label="Username"
              value={username}
              autoCapitalize="none"
              onChangeText={setUsername}
              maxLength={30}
            />
            <Field
              label="Bio"
              value={bio}
              onChangeText={setBio}
              maxLength={500}
              multiline
            />
            <Button
              title="Save profile"
              disabled={a.busy}
              onPress={() =>
                void a.run(async () => {
                  if (!/^[a-z0-9_]{3,30}$/.test(username))
                    throw new Error(
                      "Use 3–30 lowercase letters, numbers, or underscores for your username.",
                    );
                  const result = await backend()
                    .from("profiles")
                    .update({ name, username, bio, is_private: isPrivate })
                    .eq("id", session.user.id);
                  if (result.error) throw result.error;
                }, "Profile saved.")
              }
            />
            <Row>
              <Copy>Private profile</Copy>
              <Switch
                accessibilityLabel="Private profile"
                value={isPrivate}
                onValueChange={setIsPrivate}
              />
            </Row>
            <Copy muted>
              A private profile hides you from athlete search and public
              discovery. Existing followers may still see activities shared with
              followers; new follow requests are not available yet.
            </Copy>
          </Card>
          <Button
            title="Sync & restore my workouts"
            disabled={a.busy}
            onPress={() =>
              void a.run(
                syncWorkouts,
                "Linked workouts synced and missing cloud workouts restored. Sync will retry while the app is open. Unlinked local activities stay on this device.",
              )
            }
          />
          <Copy muted>
            Syncing enables automatic retries while the app is open. You can
            stop them in Settings. Workouts recorded without an account must be
            linked individually before upload.
          </Copy>
          <Button
            title="Sign out"
            secondary
            onPress={() =>
              void a.run(async () => {
                const result = await backend().auth.signOut();
                if (result.error) throw result.error;
                await logoutPurchases().catch(() => undefined);
              })
            }
          />
        </>
      ) : (
        <Card>
          <Copy>Local first. Yours always.</Copy>
          <Copy muted>
            Record without an account. Sign in to sync workouts and connect with
            other athletes.
          </Copy>
          <Button
            title="Sign in or create account"
            onPress={() => router.push("/auth")}
          />
        </Card>
      )}
      <Button
        secondary
        title="Settings & privacy"
        onPress={() => router.push("/settings")}
      />
      <Button
        secondary
        title="StravaKinda Plus"
        onPress={() => router.push("/subscription")}
      />
      <Button
        secondary
        title="Training analytics"
        onPress={() => router.push("/analytics")}
      />
      <Button
        secondary
        title="Clubs & challenges"
        onPress={() => router.push("/community")}
      />
      {a.message && <Copy>{a.message}</Copy>}
    </Screen>
  );
}
