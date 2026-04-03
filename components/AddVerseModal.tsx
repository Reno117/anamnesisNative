import React, { useState } from "react"
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

const TRANSLATIONS = ["ESV", "NIV", "KJV", "NASB", "NLT", "CSB"]

// api.bible Bible IDs for common translations
const BIBLE_IDS: Record<string, string> = {
  ESV: "06125adad2d5898a-01",
  KJV: "de4e12af7f28f599-02",
  NIV: "78a9f6124f344018-01",
}

interface Props {
  visible: boolean
  onClose: () => void
  userId: string
}

type Tab = "search" | "manual"

export function AddVerseModal({ visible, onClose, userId }: Props) {
  const addVerse = useMutation(api.verses.addVerse)

  const [tab, setTab] = useState<Tab>("search")
  const [translation, setTranslation] = useState("ESV")

  // Search tab state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedResult, setSelectedResult] = useState<any>(null)

  // Manual tab state
  const [manualBook, setManualBook] = useState("")
  const [manualChapter, setManualChapter] = useState("")
  const [manualVerseStart, setManualVerseStart] = useState("")
  const [manualVerseEnd, setManualVerseEnd] = useState("")
  const [manualText, setManualText] = useState("")

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const apiKey = process.env.EXPO_PUBLIC_BIBLE_API_KEY ?? ""

  async function handleSearch() {
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchResults([])
    setSelectedResult(null)
    setError("")
    try {
      const bibleId = BIBLE_IDS[translation] ?? BIBLE_IDS.ESV
      const res = await fetch(
        `https://api.scripture.api.bible/v1/bibles/${bibleId}/search?query=${encodeURIComponent(searchQuery)}&limit=8`,
        { headers: { "api-key": apiKey } }
      )
      const data = await res.json()
      setSearchResults(data?.data?.verses ?? [])
    } catch {
      setError("Search failed. Check your API key.")
    } finally {
      setSearching(false)
    }
  }

  // Parse a reference like "ROM.8.1" into { book, chapter, verseStart }
  function parseReference(ref: string) {
    const parts = ref.split(".")
    return {
      book: parts[0] ?? "",
      chapter: parseInt(parts[1] ?? "1"),
      verseStart: parseInt(parts[2] ?? "1"),
    }
  }

  async function handleSaveSearch() {
    if (!selectedResult) return
    setSaving(true)
    setError("")
    try {
      const { book, chapter, verseStart } = parseReference(selectedResult.id)
      // Strip HTML tags from text
      const text = selectedResult.text.replace(/<[^>]+>/g, "").trim()
      await addVerse({ userId, book, chapter, verseStart, translation, text })
      handleClose()
    } catch {
      setError("Failed to save verse.")
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveManual() {
    if (!manualBook || !manualChapter || !manualVerseStart || !manualText) {
      setError("Please fill in all required fields.")
      return
    }
    setSaving(true)
    setError("")
    try {
      await addVerse({
        userId,
        book: manualBook.trim(),
        chapter: parseInt(manualChapter),
        verseStart: parseInt(manualVerseStart),
        verseEnd: manualVerseEnd ? parseInt(manualVerseEnd) : undefined,
        translation,
        text: manualText.trim(),
      })
      handleClose()
    } catch {
      setError("Failed to save verse.")
    } finally {
      setSaving(false)
    }
  }

  function handleClose() {
    setSearchQuery("")
    setSearchResults([])
    setSelectedResult(null)
    setManualBook("")
    setManualChapter("")
    setManualVerseStart("")
    setManualVerseEnd("")
    setManualText("")
    setError("")
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Verse</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Translation picker */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.translationRow}>
            {TRANSLATIONS.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setTranslation(t)}
                style={[styles.translationChip, translation === t && styles.translationChipActive]}
              >
                <Text style={[styles.translationChipText, translation === t && styles.translationChipTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, tab === "search" && styles.tabActive]}
              onPress={() => setTab("search")}
            >
              <Text style={[styles.tabText, tab === "search" && styles.tabTextActive]}>Search</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === "manual" && styles.tabActive]}
              onPress={() => setTab("manual")}
            >
              <Text style={[styles.tabText, tab === "manual" && styles.tabTextActive]}>Manual</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {tab === "search" ? (
              <View>
                <View style={styles.searchRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder='e.g. "John 3:16" or "faith"'
                    placeholderTextColor="#aaa"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                  />
                  <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                    <Text style={styles.searchBtnText}>Go</Text>
                  </TouchableOpacity>
                </View>

                {searching && <ActivityIndicator style={{ marginTop: 20 }} color="#1a1a1a" />}

                {searchResults.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.resultItem, selectedResult?.id === r.id && styles.resultItemSelected]}
                    onPress={() => setSelectedResult(r)}
                  >
                    <Text style={styles.resultRef}>{r.reference}</Text>
                    <Text style={styles.resultText} numberOfLines={3}>
                      {r.text.replace(/<[^>]+>/g, "")}
                    </Text>
                  </TouchableOpacity>
                ))}

                {searchResults.length === 0 && !searching && searchQuery.length > 0 && (
                  <Text style={styles.emptyText}>No results. Try a different reference or keyword.</Text>
                )}
              </View>
            ) : (
              <View>
                <Text style={styles.label}>Book *</Text>
                <TextInput style={styles.input} placeholder="e.g. Romans" placeholderTextColor="#aaa"
                  value={manualBook} onChangeText={setManualBook} />

                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.label}>Chapter *</Text>
                    <TextInput style={styles.input} placeholder="8" placeholderTextColor="#aaa"
                      keyboardType="numeric" value={manualChapter} onChangeText={setManualChapter} />
                  </View>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.label}>Verse *</Text>
                    <TextInput style={styles.input} placeholder="1" placeholderTextColor="#aaa"
                      keyboardType="numeric" value={manualVerseStart} onChangeText={setManualVerseStart} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>To verse</Text>
                    <TextInput style={styles.input} placeholder="4" placeholderTextColor="#aaa"
                      keyboardType="numeric" value={manualVerseEnd} onChangeText={setManualVerseEnd} />
                  </View>
                </View>

                <Text style={styles.label}>Scripture text *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Paste or type the verse text here..."
                  placeholderTextColor="#aaa"
                  value={manualText}
                  onChangeText={setManualText}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={tab === "search" ? handleSaveSearch : handleSaveManual}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnText}>Save Verse</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  title: { fontSize: 20, fontWeight: "700", color: "#1a1a1a", letterSpacing: -0.5 },
  closeBtn: { padding: 4 },
  closeBtnText: { fontSize: 16, color: "#888" },
  translationRow: { paddingHorizontal: 20, paddingBottom: 12 },
  translationChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: "#e0e0e0",
    marginRight: 8, backgroundColor: "#fafafa",
  },
  translationChipActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  translationChipText: { fontSize: 13, color: "#555", fontWeight: "500" },
  translationChipTextActive: { color: "#fff" },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingHorizontal: 24,
  },
  tab: { paddingBottom: 12, marginRight: 24 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#1a1a1a" },
  tabText: { fontSize: 15, color: "#aaa", fontWeight: "600" },
  tabTextActive: { color: "#1a1a1a" },
  body: { paddingHorizontal: 24, paddingTop: 16, maxHeight: 420 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  input: {
    borderWidth: 1, borderColor: "#e8e8e8", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: "#1a1a1a", backgroundColor: "#fafafa",
    marginBottom: 12,
  },
  textArea: { height: 120, paddingTop: 12 },
  searchBtn: {
    backgroundColor: "#1a1a1a", borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 12,
  },
  searchBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  resultItem: {
    padding: 14, borderRadius: 10,
    borderWidth: 1, borderColor: "#efefef",
    marginBottom: 10, backgroundColor: "#fafafa",
  },
  resultItemSelected: { borderColor: "#1a1a1a", backgroundColor: "#f5f5f5" },
  resultRef: { fontSize: 13, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 },
  resultText: { fontSize: 14, color: "#555", lineHeight: 20 },
  emptyText: { textAlign: "center", color: "#aaa", marginTop: 20, fontSize: 14 },
  label: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6 },
  row: { flexDirection: "row" },
  errorText: { color: "#c0392b", fontSize: 13, marginTop: 8, textAlign: "center" },
  footer: {
    flexDirection: "row", gap: 12,
    padding: 24, paddingBottom: Platform.OS === "ios" ? 36 : 24,
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
  saveBtnText: { fontSize: 15, fontWeight: "600", color: "#fff" },
})