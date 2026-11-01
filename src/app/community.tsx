import { useQuery } from "@tanstack/react-query";
import {
  Screen,
  Heading,
  Card,
  Copy,
  Button,
  Empty,
  Loading,
} from "../../components/ui";
import { backend, supabase } from "../../services/supabase";
import { useSession } from "../../hooks/useSession";
import { useAction } from "../../hooks/useAction";
export default function Community() {
  const session = useSession(),
    a = useAction();
  const query = useQuery({
    queryKey: ["community", session?.user.id],
    enabled: !!supabase && !!session,
    queryFn: async () => {
      const [clubs, challenges] = await Promise.all([
        backend().from("clubs").select("id,name,description").limit(30),
        backend()
          .from("challenges")
          .select("id,title,target_m,ends_at")
          .gt("ends_at", new Date().toISOString())
          .limit(30),
      ]);
      if (clubs.error) throw clubs.error;
      if (challenges.error) throw challenges.error;
      return { clubs: clubs.data, challenges: challenges.data };
    },
  });
  return (
    <Screen>
      <Heading eyebrow="A shared purpose">Find your crew.</Heading>
      {!session && (
        <Empty
          title="Connect to your community"
          detail="Sign in with a configured Supabase backend to discover clubs and challenges."
        />
      )}
      {query.isLoading && <Loading />}
      {query.error && <Copy>{query.error.message}</Copy>}
      {query.data?.clubs.map((club) => (
        <Card key={club.id}>
          <Copy>{club.name}</Copy>
          <Copy muted>{club.description}</Copy>
          <Button
            title="Join club"
            onPress={() =>
              void a.run(async () => {
                const r = await backend()
                  .from("club_members")
                  .upsert(
                    { club_id: club.id, user_id: session!.user.id },
                    { ignoreDuplicates: true },
                  );
                if (r.error) throw r.error;
              }, "Joined club.")
            }
          />
        </Card>
      ))}
      {query.data?.challenges.map((challenge) => (
        <Card key={challenge.id}>
          <Copy>{challenge.title}</Copy>
          <Copy muted>
            {challenge.target_m / 1000} km by{" "}
            {new Date(challenge.ends_at).toLocaleDateString()}
          </Copy>
          <Button
            title="Join challenge"
            onPress={() =>
              void a.run(async () => {
                const r = await backend().from("challenge_entries").upsert(
                  {
                    challenge_id: challenge.id,
                    user_id: session!.user.id,
                  },
                  { ignoreDuplicates: true },
                );
                if (r.error) throw r.error;
              }, "Challenge joined.")
            }
          />
        </Card>
      ))}
      {query.data &&
        !query.data.clubs.length &&
        !query.data.challenges.length && (
          <Empty
            title="Room for a new community"
            detail="No clubs or open challenges have been created on this backend yet."
          />
        )}
      <Copy muted>
        Challenge rankings, club feeds, segment matching, and moderator
        operations still need implementation and server validation.
      </Copy>
      {a.message && <Copy>{a.message}</Copy>}
    </Screen>
  );
}
