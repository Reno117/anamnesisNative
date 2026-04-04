import { useState, useEffect } from "react"
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Platform,
} from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { Id } from "@/convex/_generated/dataModel"
import { ThemedView } from "@/components/themed-view"
import { ThemedText } from "@/components/themed-text"
import { SafeAreaView } from "react-native-safe-area-context"

export default function CreateCollectionModal() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const userId = session?.user?.id

  const { collectionId, name: existingName, description: existingDescription } =
    useLocalSearchParams<{ collectionId?: string; name?: string; description?: string }>()

  const isEditing = !!collectionId

  const [name, setName] = useState(existingName ?? "")
  const [description, setDescription] = useState(existingDescription ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const createCollection = useMutation(api.collections.createCollection)
  const updateCollection = useMutation(api.collections.updateCollection)

  async function handleSave() {
    if (!name.trim()) {
      setError("Please enter a collection name.")
      return
    }
    if (!userId) return
    setSaving(true)
    setError("")
    try {
      if (isEditing) {
        await updateCollection({
          collectionId: collectionId as Id<"collections">,
          name,
          description: description || undefined,
        })
      } else {
        await createCollection({
          userId,
          name,
          description: description || undefined,
        })
      }
      router.dismiss()
    } catch {
      setError("Failed to save. Please try again.")
    } finally {
      setSaving(false)
    }
  }
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <ThemedText type="defaultSemiBold" style={styles.label}>
          Collection Name *
        </ThemedText>
        <TextInput
          style={styles.input}
          placeholder="e.g. Romans 8, Anxiety verses, Small Group S25..."
          placeholderTextColor="#aaa"
          value={name}
          onChangeText={setName}
          autoFocus
          maxLength={60}
        />

        <ThemedText type="defaultSemiBold" style={styles.label}>
          Description
        </ThemedText>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Optional — what is this collection for?"
          placeholderTextColor="#aaa"
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
          maxLength={200}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.dismiss()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>{isEditing ? "Save Changes" : "Create"}</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1, padding: 24 },
  label: { fontSize: 13, marginBottom: 6, color: "#555" },
  input: {
    borderWidth: 1, borderColor: "#e8e8e8", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: "#1a1a1a", backgroundColor: "#fafafa", marginBottom: 20,
  },
  textArea: { height: 100, paddingTop: 12 },
  errorText: { color: "#c0392b", fontSize: 13 },
  footer: {
    flexDirection: "row", gap: 12, padding: 24,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    borderTopWidth: 1, borderTopColor: "#f0f0f0",
  },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: "#e0e0e0", alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: "#555" },
  saveBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 12,
    backgroundColor: "#1a1a1a", alignItems: "center",
  },
  backBtnText: { fontSize: 17, color: "#1a1a1a", fontWeight: "500" },
  btnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 15, fontWeight: "600", color: "#fff" },
  backBtn: { padding: 4 },
})