import { authClient } from "@/lib/auth-client";
import { Stack, Redirect, SplashScreen } from "expo-router";

export default function AppLayout() {
  const { data: session, isPending: isLoading } = authClient.useSession();

  if (!isLoading) {
    SplashScreen.hide();
  }

  if (isLoading) return null;

  if (!session) return <Redirect href="/sign-in" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}