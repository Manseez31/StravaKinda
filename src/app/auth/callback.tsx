import { useEffect, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { Screen, Heading, Copy, Field, Button } from "../../../components/ui";
import { backend } from "../../../services/supabase";
import { useAction } from "../../../hooks/useAction";
export default function Callback() {
  const { code, error_description } = useLocalSearchParams<{
      code?: string;
      error_description?: string;
    }>(),
    [password, setPassword] = useState(""),
    a = useAction();
  const { run } = a;
  useEffect(() => {
    if (code)
      void run(async () => {
        const result = await backend().auth.exchangeCodeForSession(code);
        if (result.error) throw result.error;
      }, "Email link confirmed. Continue to Profile or set a new password below.");
  }, [code, run]);
  return (
    <Screen>
      <Heading>Account confirmation</Heading>
      <Copy>
        {error_description ||
          a.message ||
          "Open the link from your email on the device where you requested it."}
      </Copy>
      <Field
        label="New password (for resets)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        title="Set password"
        disabled={a.busy || password.length < 10}
        onPress={() =>
          void a.run(async () => {
            const result = await backend().auth.updateUser({ password });
            if (result.error) throw result.error;
            router.replace("/profile");
          })
        }
      />
      <Button
        title="Continue to Profile"
        secondary
        onPress={() => router.replace("/profile")}
      />
    </Screen>
  );
}
