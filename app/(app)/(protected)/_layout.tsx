import { authClient } from "@/lib/auth-client";
import { Stack, Redirect } from "expo-router";

export default function AppLayout() {
  const { data: session, isPending: isLoading } = authClient.useSession();

  // ⏳ Wait for auth to load
  if (isLoading) return null;

  // 🔒 Not logged in → send to sign-in
  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  // ✅ Logged in → show ap/(app)/(root)/(tabs)/indexp
  return <Stack screenOptions={{ headerShown: false }} />;
}