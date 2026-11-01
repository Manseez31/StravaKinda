import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../services/supabase";
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, current) =>
      setSession(current),
    );
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return session;
}
