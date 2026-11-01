import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Screen,
  Heading,
  Card,
  Copy,
  Field,
  Button,
} from "../../components/ui";
import { backend } from "../../services/supabase";
import { useAction } from "../../hooks/useAction";
const schema = z.object({
  email: z.email(),
  password: z.string().min(10, "Use at least 10 characters."),
});
export default function Auth() {
  const [signup, setSignup] = useState(false),
    a = useAction();
  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });
  return (
    <Screen>
      <Heading eyebrow="Welcome to your next chapter">
        {signup ? "Find your rhythm." : "Welcome back."}
      </Heading>
      <Copy muted>Keep moving, wherever you are.</Copy>
      <Card>
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <Field
              label="Email"
              value={field.value}
              onChangeText={field.onChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          )}
        />
        {errors.email && <Copy>{errors.email.message}</Copy>}
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <Field
              label="Password"
              value={field.value}
              onChangeText={field.onChange}
              secureTextEntry
              autoCapitalize="none"
              autoComplete={signup ? "new-password" : "current-password"}
            />
          )}
        />
        {errors.password && <Copy>{errors.password.message}</Copy>}
        <Button
          disabled={a.busy}
          title={signup ? "Create account" : "Sign in"}
          onPress={handleSubmit(
            (data) =>
              void a.run(
                async () => {
                  const result = signup
                    ? await backend().auth.signUp({
                        ...data,
                        options: {
                          emailRedirectTo: "stravakinda://auth/callback",
                        },
                      })
                    : await backend().auth.signInWithPassword(data);
                  if (result.error) throw result.error;
                },
                signup
                  ? "Check your inbox to verify your email."
                  : "Signed in. You can return to Profile.",
              ),
          )}
        />
        <Button
          secondary
          title={signup ? "Already have an account" : "Create an account"}
          onPress={() => setSignup(!signup)}
        />
        <Button
          secondary
          disabled={a.busy}
          title="Reset password"
          onPress={() =>
            void a.run(async () => {
              const email = z.email().parse(getValues("email"));
              const result = await backend().auth.resetPasswordForEmail(email, {
                redirectTo: "stravakinda://auth/callback",
              });
              if (result.error) throw result.error;
            }, "If an account exists, a reset link is on its way.")
          }
        />
      </Card>
      {a.message && <Copy>{a.message}</Copy>}
    </Screen>
  );
}
