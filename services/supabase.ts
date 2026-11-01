import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { AppState, Platform } from "react-native";
const memory = new Map<string, string>();
// Split long sessions to avoid platform SecureStore value limits. Tokens never enter SQLite.
const storage = {
  async getItem(key: string) {
    if (Platform.OS === "web") return memory.get(key) ?? null;
    const count = Number((await SecureStore.getItemAsync(`${key}.count`)) ?? 0);
    if (!count) return null;
    const chunks = await Promise.all(
      Array.from({ length: count }, (_, i) =>
        SecureStore.getItemAsync(`${key}.${i}`),
      ),
    );
    return chunks.every((c) => c !== null) ? chunks.join("") : null;
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === "web") {
      memory.set(key, value);
      return;
    }
    await storage.removeItem(key);
    const chunks = value.match(/[\s\S]{1,1500}/g) ?? [];
    for (let i = 0; i < chunks.length; i++)
      await SecureStore.setItemAsync(`${key}.${i}`, chunks[i]);
    await SecureStore.setItemAsync(`${key}.count`, String(chunks.length));
  },
  async removeItem(key: string) {
    if (Platform.OS === "web") {
      memory.delete(key);
      return;
    }
    const count = Number((await SecureStore.getItemAsync(`${key}.count`)) ?? 0);
    await SecureStore.deleteItemAsync(`${key}.count`);
    await Promise.all(
      Array.from({ length: count }, (_, i) =>
        SecureStore.deleteItemAsync(`${key}.${i}`),
      ),
    );
  },
};
const url = process.env.EXPO_PUBLIC_SUPABASE_URL,
  key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: {
          storage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          flowType: "pkce",
        },
      })
    : null;
if (supabase)
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
export function backend() {
  if (!supabase)
    throw new Error(
      "Connect Supabase using .env to use your account and community features. Local recording works without it.",
    );
  return supabase;
}
