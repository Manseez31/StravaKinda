import { router } from "expo-router";
import { Screen, Heading, Copy, Button } from "../../components/ui";
export default function NotFound() {
  return (
    <Screen>
      <Heading>A different path.</Heading>
      <Copy muted>This screen is unavailable. Head back to your journal.</Copy>
      <Button title="Go home" onPress={() => router.replace("/")} />
    </Screen>
  );
}
