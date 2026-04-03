import { useState, useRef } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native"
import { Link, useRouter, useLocalSearchParams } from "expo-router"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { ThemedView } from "@/components/themed-view"
import { ThemedText } from "@/components/themed-text"
import { authClient } from "@/lib/auth-client"

const TRANSLATIONS = ["ESV", "NIV", "KJV", "NASB", "NLT", "CSB"]

const BIBLE_IDS: Record<string, string> = {
  ESV: "06125adad2d5898a-01",
}

const BOOK_ID_MAP: Record<string, string> = {
  "Genesis": "GEN", "Exodus": "EXO", "Leviticus": "LEV", "Numbers": "NUM",
  "Deuteronomy": "DEU", "Joshua": "JOS", "Judges": "JDG", "Ruth": "RUT",
  "1 Samuel": "1SA", "2 Samuel": "2SA", "1 Kings": "1KI", "2 Kings": "2KI",
  "1 Chronicles": "1CH", "2 Chronicles": "2CH", "Ezra": "EZR", "Nehemiah": "NEH",
  "Esther": "EST", "Job": "JOB", "Psalms": "PSA", "Proverbs": "PRO",
  "Ecclesiastes": "ECC", "Song of Solomon": "SNG", "Isaiah": "ISA",
  "Jeremiah": "JER", "Lamentations": "LAM", "Ezekiel": "EZK", "Daniel": "DAN",
  "Hosea": "HOS", "Joel": "JOL", "Amos": "AMO", "Obadiah": "OBA",
  "Jonah": "JON", "Micah": "MIC", "Nahum": "NAM", "Habakkuk": "HAB",
  "Zephaniah": "ZEP", "Haggai": "HAG", "Zechariah": "ZEC", "Malachi": "MAL",
  "Matthew": "MAT", "Mark": "MRK", "Luke": "LUK", "John": "JHN",
  "Acts": "ACT", "Romans": "ROM", "1 Corinthians": "1CO", "2 Corinthians": "2CO",
  "Galatians": "GAL", "Ephesians": "EPH", "Philippians": "PHP",
  "Colossians": "COL", "1 Thessalonians": "1TH", "2 Thessalonians": "2TH",
  "1 Timothy": "1TI", "2 Timothy": "2TI", "Titus": "TIT", "Philemon": "PHM",
  "Hebrews": "HEB", "James": "JAS", "1 Peter": "1PE", "2 Peter": "2PE",
  "1 John": "1JN", "2 John": "2JN", "3 John": "3JN", "Jude": "JUD",
  "Revelation": "REV",
}

const BOOKS_OF_THE_BIBLE = Object.keys(BOOK_ID_MAP)

export default function AddVerseModal() {
  const router = useRouter()
  const { book: bookParam } = useLocalSearchParams<{ book: string }>()
  const book = bookParam ?? "Genesis"

  const { data: session } = authClient.useSession()
  const userId = session?.user?.id

  const addVerse = useMutation(api.verses.addVerse)

  const [translation, setTranslation] = useState("ESV")
  const [chapter, setChapter] = useState("")
  const [verseStart, setVerseStart] = useState("")
  const [verseEnd, setVerseEnd] = useState("")
  const [text, setText] = useState("")

  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState("")
  const [saveError, setSaveError] = useState("")

  // Clear fetched text when book changes
  const prevBookRef = useRef(book)
  if (prevBookRef.current !== book) {
    prevBookRef.current = book
    setText("")
    setFetchError("")
  }

  const apiKey = process.env.EXPO_PUBLIC_BIBLE_API_KEY ?? ""
  const canFetch = translation === "ESV"

  async function handleFetch() {
    if (!chapter || !verseStart) {
      setFetchError("Enter chapter and verse first.")
      return
    }
    setFetching(true)
    setFetchError("")
    setText("")
    try {
      const bibleId = BIBLE_IDS.ESV
      const bookCode = BOOK_ID_MAP[book]
      const passageId = verseEnd
        ? `${bookCode}.${chapter}.${verseStart}-${bookCode}.${chapter}.${verseEnd}`
        : `${bookCode}.${chapter}.${verseStart}`
      const res = await fetch(
        `https://api.scripture.api.bible/v1/bibles/${bibleId}/passages/${passageId}?content-type=text&include-verse-numbers=false`,
        { headers: { "api-key": apiKey } }
      )
      const data = await res.json()
      const fetched = data?.data?.content?.trim()
      if (!fetched) {
        setFetchError("Verse not found. Check the reference and try again.")
      } else {
        setText(fetched)
      }
    } catch {
      setFetchError("Fetch failed. Check your API key and connection.")
    } finally {
      setFetching(false)
    }
  }

  async function handleSave() {
    if (!userId) {
      setSaveError("Not logged in.")
      return
    }
    if (!chapter || !verseStart || !text) {
      setSaveError("Please fill in chapter, verse, and text.")
      return
    }
    setSaving(true)
    setSaveError("")
    try {
      await addVerse({
        userId,
        book,
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

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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

        {/* Book */}
        <ThemedText type="defaultSemiBold" style={styles.label}>Book</ThemedText>
        {Platform.OS === "web" ? (
          <View style={styles.comboWrapper}>
            <TextInput
              style={styles.input}
              value={book === "Genesis" && !bookParam ? "" : book}
              onChangeText={(val) => router.setParams({ book: val })}
              placeholder="Search book..."
              placeholderTextColor="#aaa"
              // @ts-ignore
              list="books-list"
            />
            {/* @ts-ignore */}
            <datalist id="books-list">
              {BOOKS_OF_THE_BIBLE.map((b) => (
                // @ts-ignore
                <option key={b} value={b} />
              ))}
            </datalist>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => router.push({ pathname: "/book-picker", params: { current: book } })}
          >
            <Text style={styles.bookBtnText}>{book}</Text>
            <Text style={styles.bookBtnChevron}>›</Text>
          </TouchableOpacity>
        )}

        {/* Chapter / Verse */}
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <ThemedText type="defaultSemiBold" style={styles.label}>Chapter</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="8"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              value={chapter}
              onChangeText={setChapter}
            />
          </View>
          <View style={styles.rowItem}>
            <ThemedText type="defaultSemiBold" style={styles.label}>Verse</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="1"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              value={verseStart}
              onChangeText={setVerseStart}
            />
          </View>
          <View style={styles.rowItem}>
            <ThemedText type="defaultSemiBold" style={styles.label}>To verse</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="4"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              value={verseEnd}
              onChangeText={setVerseEnd}
            />
          </View>
        </View>

        {/* Fetch — ESV only */}
        {canFetch && (
          <>
            <TouchableOpacity
              style={[styles.fetchBtn, fetching && styles.btnDisabled]}
              onPress={handleFetch}
              disabled={fetching}
            >
              {fetching
                ? <ActivityIndicator color="#1a1a1a" />
                : <Text style={styles.fetchBtnText}>Fetch Verse</Text>
              }
            </TouchableOpacity>
            {fetchError ? <Text style={styles.errorText}>{fetchError}</Text> : null}
          </>
        )}

        {/* Verse text */}
        <ThemedText type="defaultSemiBold" style={[styles.label, { marginTop: 20 }]}>
          Verse Text
        </ThemedText>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={
            canFetch
              ? "Tap 'Fetch Verse' to auto-fill, or type manually."
              : "Type or paste the verse text here."
          }
          placeholderTextColor="#aaa"
          value={text}
          onChangeText={setText}
          multiline
          textAlignVertical="top"
        />

        {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Link href="/" dismissTo style={styles.cancelBtn}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Link>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Save Verse</Text>
          }
        </TouchableOpacity>
      </View>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 8 },
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
  bookBtn: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderWidth: 1, borderColor: "#e8e8e8", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: "#fafafa", marginBottom: 16,
  },
  bookBtnText: { fontSize: 15, color: "#1a1a1a" },
  bookBtnChevron: { fontSize: 20, color: "#aaa" },
  comboWrapper: { marginBottom: 16 },
  input: {
    borderWidth: 1, borderColor: "#e8e8e8", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: "#1a1a1a", backgroundColor: "#fafafa",
    marginBottom: 12,
  },
  textArea: { height: 140, paddingTop: 12 },
  row: { flexDirection: "row", gap: 8 },
  rowItem: { flex: 1 },
  fetchBtn: {
    borderWidth: 1, borderColor: "#1a1a1a", borderRadius: 10,
    paddingVertical: 12, alignItems: "center", marginBottom: 4,
  },
  fetchBtnText: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  btnDisabled: { opacity: 0.4 },
  errorText: { color: "#c0392b", fontSize: 13, marginTop: 4, marginBottom: 8 },
  footer: {
    flexDirection: "row", gap: 12, padding: 24,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    borderTopWidth: 1, borderTopColor: "#f0f0f0",
  },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: "#e0e0e0",
    alignItems: "center", justifyContent: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: "#555" },
  saveBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 12,
    backgroundColor: "#1a1a1a", alignItems: "center",
  },
  saveBtnText: { fontSize: 15, fontWeight: "600", color: "#fff" },
})