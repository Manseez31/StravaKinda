import { useCallback, useState } from "react";
export function useAction() {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const run = useCallback(
    async (action: () => Promise<unknown>, success = "") => {
      setBusy(true);
      setMessage("");
      try {
        await action();
        setMessage(success);
      } catch (e) {
        setMessage(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [],
  );
  return { busy, message, run, setMessage };
}
