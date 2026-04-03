import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { ThemedView } from "@/components/themed-view"
import { ThemedText } from "@/components/themed-text"
import * as Haptics from "expo-haptics"


const TRANSLATIONS = ["ESV", "NIV", "KJV", "NASB", "NLT", "CSB"]

export default function EditVerseModal() {
  const router = useRouter()
  const { verseId } = useLocalSearchParams<{ verseId: string }>()

  const verse = useQuery(api.verses.getVerse, {
    verseId: verseId as Id<"verses">,
  })

  const updateVerse = useMutation(api.verses.updateVerse)
  const removeVerse = useMutation(api.verses.removeVerse)
  const toggleMemorized = useMutation(api.verses.toggleMemorized)

  const [translation, setTranslation] = useState("ESV")
  const [chapter, setChapter] = useState("")
  const [verseStart, setVerseStart] = useState("")
  const [verseEnd, setVerseEnd] = useState("")
  const [text, setText] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (verse && !initialized) {
      setTranslation(verse.translation)
      setChapter(String(verse.chapter))
      setVerseStart(String(verse.verseStart))
      setVerseEnd(verse.verseEnd ? String(verse.verseEnd) : "")
      setText(verse.text)
      setInitialized(true)
    }
  }, [verse, initialized])

  async function handleSave() {
    if (!verseId || !chapter || !verseStart || !text) {
      setSaveError("Please fill in all required fields.")
      return
    }
    setSaving(true)
    setSaveError("")
    try {
      await updateVerse({
        verseId: verseId as Id<"verses">,
        book: verse!.book,
        chapter: parseInt(chapter),
        verseStart: parseInt(verseStart),
        verseEnd: verseEnd ? parseInt(verseEnd) : undefined,
        translation,
        text: text.trim(),
      })
      router.dismiss()
    } catch {
      setSaveError("Failed to save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  function confirmDelete() {
    Alert.alert(
      "Delete verse?",
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await removeVerse({ verseId: verseId as Id<"verses"> })
              router.dismiss()
            } catch {
              setSaveError("Failed to delete.")
            }
          },
        },
      ]
    )
  }

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

async function successPulse() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  await delay(40)
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  await delay(40)
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  await delay(30)
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
}


async function handleToggleMemorized() {
  if (!verseId) return
  const wasMemorized = verse?.isMemorized
  await toggleMemorized({ verseId: verseId as Id<"verses"> })
  // Only pulse when marking AS memorized, not when unmarking
  if (!wasMemorized) {
    await successPulse()
  }
}
  if (!verse) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator color="#1a1a1a" />
      </ThemedView>
    )
  }

  const ref = `${verse.book} ${verse.chapter}:${verse.verseStart}${verse.verseEnd ? `–${verse.verseEnd}` : ""}`

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Reference display */}
        <Text style={styles.refDisplay}>{ref}</Text>

        {/* Memorized toggle */}
        <TouchableOpacity
          style={[styles.memorizedBtn, verse.isMemorized && styles.memorizedBtnActive]}
          onPress={handleToggleMemorized}
        >
          <Text style={[styles.memorizedBtnText, verse.isMemorized && styles.memorizedBtnTextActive]}>
            {verse.isMemorized ? "✓ Memorized" : "Mark as Memorized"}
          </Text>
        </TouchableOpacity>

        {/* Translation */}
        <ThemedText type="defaultSemiBold" style={styles.label}>Translation</ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.translationRow}
        >
          {TRANSLATIONS.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTranslation(t)}
              style={[styles.chip, translation === t && styles.chipActive]}
            >
              <Text style={[styles.chipText, translation === t && styles.chipTextActive]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Chapter / Verse */}
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <ThemedText type="defaultSemiBold" style={styles.label}>Chapter</ThemedText>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={chapter}
              onChangeText={setChapter}
            />
          </View>
          <View style={styles.rowItem}>
            <ThemedText type="defaultSemiBold" style={styles.label}>Verse</ThemedText>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={verseStart}
              onChangeText={setVerseStart}
            />
          </View>
          <View style={styles.rowItem}>
            <ThemedText type="defaultSemiBold" style={styles.label}>To verse</ThemedText>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="—"
              placeholderTextColor="#ccc"
              value={verseEnd}
              onChangeText={setVerseEnd}
            />
          </View>
        </View>

        {/* Text */}
        <ThemedText type="defaultSemiBold" style={styles.label}>Verse Text</ThemedText>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={text}
          onChangeText={setText}
          multiline
          textAlignVertical="top"
        />

        {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}

        {/* Delete */}
        <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
          <Text style={styles.deleteBtnText}>Delete Verse</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer */}
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
            : <Text style={styles.saveBtnText}>Save Changes</Text>
          }
        </TouchableOpacity>
      </View>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 24, paddingBottom: 8 },

  refDisplay: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  memorizedBtn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 24,
  },
  memorizedBtnActive: {
    backgroundColor: "#e8f5e9",
    borderColor: "#a5d6a7",
  },
  memorizedBtnText: { fontSize: 13, color: "#666", fontWeight: "600" },
  memorizedBtnTextActive: { color: "#388e3c" },

  label: { fontSize: 13, marginBottom: 6, color: "#555" },
  translationRow: { marginBottom: 20 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: "#e0e0e0",
    marginRight: 8, backgroundColor: "#fafafa",
  },
  chipActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  chipText: { fontSize: 13, color: "#555", fontWeight: "500" },
  chipTextActive: { color: "#fff" },

  input: {
    borderWidth: 1, borderColor: "#e8e8e8", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: "#1a1a1a", backgroundColor: "#fafafa",
    marginBottom: 12,
  },
  textArea: { height: 160, paddingTop: 12 },
  row: { flexDirection: "row", gap: 8 },
  rowItem: { flex: 1 },

  deleteBtn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffcdd2",
    alignItems: "center",
    backgroundColor: "#fff5f5",
  },
  deleteBtnText: { color: "#c62828", fontWeight: "600", fontSize: 15 },

  errorText: { color: "#c0392b", fontSize: 13, marginBottom: 8 },

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
  saveBtnDisabled: { opacity: 0.5 },
  btnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 15, fontWeight: "600", color: "#fff" },
})