import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Screen,
  Heading,
  Card,
  Copy,
  Button,
  Field,
  Empty,
  Loading,
} from "../../components/ui";
import { backend, supabase } from "../../services/supabase";
import { useSession } from "../../hooks/useSession";
import { useAction } from "../../hooks/useAction";
type Post = {
  id: string;
  title: string;
  sport: string;
  distance_m: number;
  started_at: string;
};
export default function Social() {
  const session = useSession(),
    a = useAction(),
    [comment, setComment] = useState("");
  const feed = useQuery({
    queryKey: ["feed", session?.user.id],
    enabled: !!supabase && !!session,
    queryFn: async () => {
      const r = await backend()
        .from("activities")
        .select("id,title,sport,distance_m,started_at")
        .order("started_at", { ascending: false })
        .limit(30);
      if (r.error) throw r.error;
      return r.data as Post[];
    },
  });
  return (
    <Screen>
      <Heading eyebrow="Shared miles">Better together.</Heading>
      {!session && (
        <Empty
          title="Your community is waiting"
          detail="Connect Supabase and sign in to see shared activity summaries. Raw GPS coordinates are never returned in this feed."
        />
      )}
      {feed.isLoading && <Loading />}
      {feed.error && <Copy>{feed.error.message}</Copy>}
      {feed.data?.length === 0 && (
        <Empty
          title="A quiet moment"
          detail="Public activities and activities shared by people you follow will appear here."
        />
      )}
      {feed.data?.map((post) => (
        <Card key={post.id}>
          <Copy>{post.title}</Copy>
          <Copy muted>
            {post.sport} · {(post.distance_m / 1000).toFixed(2)} km ·{" "}
            {new Date(post.started_at).toLocaleDateString()}
          </Copy>
          <Button
            secondary
            title="Give kudos"
            onPress={() =>
              void a.run(async () => {
                const r = await backend()
                  .from("activity_reactions")
                  .upsert(
                    { activity_id: post.id, user_id: session!.user.id },
                    { ignoreDuplicates: true },
                  );
                if (r.error) throw r.error;
              }, "Kudos sent.")
            }
          />
          <Field
            label="Comment"
            value={comment}
            onChangeText={setComment}
            maxLength={500}
          />
          <Button
            secondary
            title="Post comment"
            disabled={!comment.trim() || a.busy}
            onPress={() =>
              void a.run(async () => {
                const r = await backend().from("comments").insert({
                  activity_id: post.id,
                  user_id: session!.user.id,
                  body: comment.trim(),
                });
                if (r.error) throw r.error;
                setComment("");
              }, "Comment posted.")
            }
          />
        </Card>
      ))}
      {a.message && <Copy>{a.message}</Copy>}
    </Screen>
  );
}
