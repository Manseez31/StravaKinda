import { useState } from "react";
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
export default function Coach() {
  const [prompt, setPrompt] = useState(
      "Summarize my recent training and suggest a gentle next workout.",
    ),
    [messages, setMessages] = useState<{ role: string; text: string }[]>([]),
    [consent, setConsent] = useState(false),
    a = useAction();
  return (
    <Screen>
      <Heading eyebrow="A thoughtful training companion">
        A little guidance.
      </Heading>
      <Copy muted>
        Ask about consistency, pacing, or your next easy session. Suggestions
        can be wrong; adapt them to how you feel. This is not medical care.
      </Copy>
      <Card>
        <Copy>Private by design</Copy>
        <Copy muted>
          With your consent, the server sends up to 30 days of workout summaries
          and your question to OpenAI. No GPS coordinates, email, or profile
          name are sent. Premium and usage limits are checked on the server.
          Sync your activities first.
        </Copy>
        <Button
          secondary
          title={
            consent
              ? "Summary sharing allowed · tap to revoke"
              : "Allow training summary sharing"
          }
          onPress={() => setConsent(!consent)}
        />
      </Card>
      {messages.map((m, i) => (
        <Card key={i}>
          <Copy muted>{m.role}</Copy>
          <Copy>{m.text}</Copy>
        </Card>
      ))}
      <Field
        label="Ask your coach"
        multiline
        value={prompt}
        onChangeText={setPrompt}
        maxLength={1000}
      />
      <Button
        title={a.busy ? "Thinking…" : "Ask coach"}
        disabled={!consent || a.busy || !prompt.trim()}
        onPress={() =>
          void a.run(async () => {
            const question = prompt.trim();
            const result = await backend().functions.invoke("ai-coach", {
              body: { question, consent: true },
            });
            if (result.error) throw result.error;
            if (typeof result.data?.answer !== "string")
              throw new Error("Coach returned an invalid response.");
            setMessages((m) => [
              ...m,
              { role: "You", text: question },
              { role: "AI coach", text: result.data.answer },
            ]);
            setPrompt("");
          })
        }
      />
      {a.message && <Copy>{a.message}</Copy>}
    </Screen>
  );
}
