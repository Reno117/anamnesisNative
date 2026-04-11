import { useState } from "react"
import {
  View,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { ThemedView } from "@/components/themed-view"
import { ThemedText } from "@/components/themed-text"
import { ThemedButton } from "@/components/themed-button"

export default function JoinCollection() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const userId = session?.user?.id

  const [code, setCode] = useState("")
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState("")

  const joinGroup = useMutation(api.groups.joinGroupByCode)

  async function handleJoin() {
    if (!code.trim() || !userId) return
    setJoining(true)
    setError("")
    try {
      const result = await joinGroup({
        userId,
        inviteCode: code.trim().toUpperCase(),
      })
      if ("error" in result) {
        setError(
          result.error === "Invalid invite code"
            ? "That code doesn't match any collection. Double-check and try again."
            : result.error === "Already a member"
            ? "You're already in this collection."
            : result.error ?? "Something went wrong."
        )
      } else {
        router.back()
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setJoining(false)
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"} // try "height" for Android too
          style={{ flex: 1 }}
        >
        <View style={styles.content}>
          <ThemedText type="title" style={styles.title}>Join a Collection</ThemedText>
          <ThemedText style={styles.subtitle}>
            Enter the invite code shared by the collection admin.
          </ThemedText>

          <TextInput
            style={styles.input}
            value={code}
            onChangeText={(val) => setCode(val.toUpperCase())}
            placeholder="e.g. ROM8-XK2"
            placeholderTextColor="#bbb"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
          />

          {error ? (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          ) : null}

          <View style={styles.btnRow}>
            <ThemedButton variant="outline" onPress={() => router.back()}>
              Cancel
            </ThemedButton>
            <ThemedButton
              onPress={handleJoin}
              disabled={joining || !code.trim()}
            >
              {joining ? <ActivityIndicator color="#fff" /> : "Join"}
            </ThemedButton>
          </View>
        </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: "center" },
  title: { marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#888", marginBottom: 32, lineHeight: 22 },
  input: {
    borderWidth: 1.5, borderColor: "#e0e0e0", borderRadius: 14,
    paddingHorizontal: 20, paddingVertical: 18,
    fontSize: 28, fontWeight: "700", letterSpacing: 6,
    textAlign: "center", backgroundColor: "#fafafa",
    marginBottom: 12,
  },
  errorText: { color: "#c0392b", fontSize: 14, textAlign: "center", marginBottom: 16 },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 8 },
})