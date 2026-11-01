import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useApp } from "../../store/app";
import { useColors } from "../../components/ui";
import { useSync } from "../../hooks/useSync";
import {
  installRecorderLifecycle,
  recoverRecording,
} from "../../services/recorder";
const client = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});
export default function Layout() {
  useSync();
  const c = useColors(),
    theme = useApp((s) => s.preferences.theme);
  useEffect(() => {
    installRecorderLifecycle();
    void useApp
      .getState()
      .refresh()
      .then(recoverRecording)
      .catch((e) => useApp.setState({ error: String(e) }));
  }, []);
  return (
    <QueryClientProvider client={client}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.bg },
          headerTintColor: c.text,
          contentStyle: { backgroundColor: c.bg },
          headerBackTitle: "Back",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="activity/[id]"
          options={{ title: "Your activity" }}
        />
        <Stack.Screen name="auth" options={{ title: "Your account" }} />
      </Stack>
    </QueryClientProvider>
  );
}
