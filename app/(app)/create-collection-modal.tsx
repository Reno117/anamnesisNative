import { useState } from "react"
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Platform, useColorScheme,
} from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { Id } from "@/convex/_generated/dataModel"
import { ThemedText } from "@/components/themed-text"
import { SafeAreaView } from "react-native-safe-area-context"
import { useThemeColor } from "@/hooks/use-theme-color"

export default function CreateCollectionModal() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const userId = session?.user?.id
  const scheme = useColorScheme()

  // ── Theme tokens ──────────────────────────────────────────────
  const bg          = useThemeColor({}, "background")
  const textPrimary = useThemeColor({}, "text")
  const textSub     = useThemeColor({ light: "#555555", dark: "#8e8e93" }, "tabIconDefault")
  const inputBg     = useThemeColor({ light: "#fafafa",  dark: "#1c1c1e" }, "background")
  const inputBorder = useThemeColor({ light: "#e8e8e8",  dark: "#3a3a3c" }, "border")
  const footerBorder= useThemeColor({ light: "#f0f0f0",  dark: "#2c2c2e" }, "border")
  const cancelBorder= useThemeColor({ light: "#e0e0e0",  dark: "#3a3a3c" }, "border")
  const placeholder = scheme === "dark" ? "#636366" : "#aaaaaa"
  const saveBg      = useThemeColor({ light: "#1a1a1a",  dark: "#f2f2f7" }, "text")
  const saveText    = useThemeColor({ light: "#ffffff",  dark: "#1a1a1a" }, "background")

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
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={["top"]}>
      <View style={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: textPrimary }]}>‹ Back</Text>
        </TouchableOpacity>

        <ThemedText type="defaultSemiBold" style={[styles.label, { color: textSub }]}>
          Collection Name *
        </ThemedText>
        <TextInput
          style={[styles.input, { borderColor: inputBorder, backgroundColor: inputBg, color: textPrimary }]}
          placeholder="e.g. Romans 8, Anxiety verses, Small Group S25..."
          placeholderTextColor={placeholder}
          value={name}
          onChangeText={setName}
          autoFocus
          maxLength={60}
        />

        <ThemedText type="defaultSemiBold" style={[styles.label, { color: textSub }]}>
          Description
        </ThemedText>
        <TextInput
          style={[styles.input, styles.textArea, { borderColor: inputBorder, backgroundColor: inputBg, color: textPrimary }]}
          placeholder="Optional — what is this collection for?"
          placeholderTextColor={placeholder}
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
          maxLength={200}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <View style={[styles.footer, { borderTopColor: footerBorder }]}>
        <TouchableOpacity
          style={[styles.cancelBtn, { borderColor: cancelBorder }]}
          onPress={() => router.dismiss()}
        >
          <Text style={[styles.cancelBtnText, { color: textSub }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: saveBg }, saving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color={saveText} />
            : <Text style={[styles.saveBtnText, { color: saveText }]}>{isEditing ? "Save Changes" : "Create"}</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1, padding: 24 },
  label: { fontSize: 13, marginBottom: 6 },
  input: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, marginBottom: 20,
  },
  textArea: { height: 100, paddingTop: 12 },
  errorText: { color: "#c0392b", fontSize: 13 },
  footer: {
    flexDirection: "row", gap: 12, padding: 24,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600" },
  saveBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: "center",
  },
  backBtn: { padding: 4, marginBottom: 28 },
  backBtnText: { fontSize: 17, fontWeight: "500" },
  btnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 15, fontWeight: "600" },
})