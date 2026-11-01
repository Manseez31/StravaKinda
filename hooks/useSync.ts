import { useEffect } from "react";
import { AppState } from "react-native";
import { useSession } from "./useSession";
import { syncIfEnabled } from "../services/sync";
import { useApp } from "../store/app";
export function useSync() {
  const session = useSession(),
    userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    const run = () => {
      if (AppState.currentState === "active")
        void syncIfEnabled(userId).catch((e) =>
          useApp.setState({
            error: `Cloud sync will retry: ${e instanceof Error ? e.message : String(e)}`,
          }),
        );
    };
    run();
    const timer = setInterval(run, 60000);
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active") run();
    });
    return () => {
      clearInterval(timer);
      listener.remove();
    };
  }, [userId]);
}
