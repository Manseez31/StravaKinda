import { useState } from "react";
import {
  Screen,
  Heading,
  Field,
  Card,
  Copy,
  Button,
} from "../../components/ui";
import { backend } from "../../services/supabase";
import { useAction } from "../../hooks/useAction";
import { useSession } from "../../hooks/useSession";
type Athlete = { id: string; name: string; username: string | null };
export default function Search() {
  const [term, setTerm] = useState(""),
    [results, setResults] = useState<Athlete[]>([]),
    a = useAction(),
    session = useSession();
  return (
    <Screen>
      <Heading>Find your people.</Heading>
      <Field
        label="Username"
        value={term}
        onChangeText={setTerm}
        autoCapitalize="none"
        maxLength={30}
      />
      <Button
        title="Search athletes"
        disabled={a.busy || term.trim().length < 2}
        onPress={() =>
          void a.run(async () => {
            const { data, error } = await backend()
              .from("profiles")
              .select("id,name,username")
              .ilike("username", `${term.replace(/[^a-z0-9_]/gi, "")}%`)
              .limit(20);
            if (error) throw error;
            setResults(data ?? []);
            if (!data?.length) a.setMessage("No matching public profiles.");
          })
        }
      />
      {results.map((p) => (
        <Card key={p.id}>
          <Copy>{p.name || p.username}</Copy>
          <Copy muted>@{p.username}</Copy>
          {session && session.user.id !== p.id && (
            <>
              <Button
                secondary
                title="Follow"
                onPress={() =>
                  void a.run(async () => {
                    const r = await backend().from("follows").upsert(
                      {
                        follower_id: session.user.id,
                        following_id: p.id,
                      },
                      { ignoreDuplicates: true },
                    );
                    if (r.error) throw r.error;
                  }, "Following.")
                }
              />
              <Button
                secondary
                title="Unfollow"
                onPress={() =>
                  void a.run(async () => {
                    const r = await backend()
                      .from("follows")
                      .delete()
                      .eq("follower_id", session.user.id)
                      .eq("following_id", p.id);
                    if (r.error) throw r.error;
                  }, "Unfollowed.")
                }
              />
              <Button
                secondary
                title="Block athlete"
                onPress={() =>
                  void a.run(async () => {
                    const r = await backend().from("blocks").upsert(
                      {
                        blocker_id: session.user.id,
                        blocked_id: p.id,
                      },
                      { ignoreDuplicates: true },
                    );
                    if (r.error) throw r.error;
                  }, "Blocked. Their content is hidden from you.")
                }
              />
              <Button
                secondary
                title="Report athlete"
                onPress={() =>
                  void a.run(async () => {
                    const r = await backend().from("reports").insert({
                      reporter_id: session.user.id,
                      reported_id: p.id,
                      reason: "Athlete report submitted for moderator review",
                    });
                    if (r.error) throw r.error;
                  }, "Report submitted for review.")
                }
              />
            </>
          )}
        </Card>
      ))}
      {a.message && <Copy>{a.message}</Copy>}
    </Screen>
  );
}
