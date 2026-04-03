import { AddVerseModal } from "@/components/AddVerseModal";
import { ThemedText } from "@/components/themed-text";
import { VerseList } from "@/components/VerseList";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { useMutation, useQuery } from "convex/react";
import { Link } from "expo-router";
import { useRef, useState } from "react";
import { Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const ref = useRef<TextInput>(null);
  const { data: session, isPending } = authClient.useSession();
  const userId = session?.user.id;
  if (!userId) return (

    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >

      <Text>You sir, are not logged in!</Text>

    </SafeAreaView>

  )// or a loading/login screen


  return (
  <SafeAreaView style={{ flex: 1 }}>
  <VerseList userId={userId} />

  <View
    style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: [{ translateX: -50 }, { translateY: -50 }],
    }}
  >
  </View>

<Link href='/modal'>
click me!
</Link>

</SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
