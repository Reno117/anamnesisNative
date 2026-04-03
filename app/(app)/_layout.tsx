// All import statements remain the same except you need to import `useSession` from your `ctx.tsx` file.
import { authClient } from "@/lib/auth-client";
import { Stack } from "expo-router";

// All of the above code remains unchanged. Update the `RootNavigator` to protect routes based on your `SessionProvider` below.

export default function RootNavigator() {
  const { data: session } = authClient.useSession();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(protected)" />
      </Stack.Protected>

      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}
