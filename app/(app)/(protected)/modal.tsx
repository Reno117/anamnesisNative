import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useThemeColor } from "@/hooks/use-theme-color";
import { authClient } from "@/lib/auth-client";
import { useMutation, useQuery } from "convex/react";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TRANSLATIONS = ["ESV", "NIV", "KJV", "NASB", "NLT", "CSB"];

const BIBLE_IDS: Record<string, string> = {
  ESV: "06125adad2d5898a-01",
};

const BOOK_ID_MAP: Record<string, string> = {
  Genesis: "GEN",
  Exodus: "EXO",
  Leviticus: "LEV",
  Numbers: "NUM",
  Deuteronomy: "DEU",
  Joshua: "JOS",
  Judges: "JDG",
  Ruth: "RUT",
  "1 Samuel": "1SA",
  "2 Samuel": "2SA",
  "1 Kings": "1KI",
  "2 Kings": "2KI",
  "1 Chronicles": "1CH",
  "2 Chronicles": "2CH",
  Ezra: "EZR",
  Nehemiah: "NEH",
  Esther: "EST",
  Job: "JOB",
  Psalms: "PSA",
  Proverbs: "PRO",
  Ecclesiastes: "ECC",
  "Song of Solomon": "SNG",
  Isaiah: "ISA",
  Jeremiah: "JER",
  Lamentations: "LAM",
  Ezekiel: "EZK",
  Daniel: "DAN",
  Hosea: "HOS",
  Joel: "JOL",
  Amos: "AMO",
  Obadiah: "OBA",
  Jonah: "JON",
  Micah: "MIC",
  Nahum: "NAM",
  Habakkuk: "HAB",
  Zephaniah: "ZEP",
  Haggai: "HAG",
  Zechariah: "ZEC",
  Malachi: "MAL",
  Matthew: "MAT",
  Mark: "MRK",
  Luke: "LUK",
  John: "JHN",
  Acts: "ACT",
  Romans: "ROM",
  "1 Corinthians": "1CO",
  "2 Corinthians": "2CO",
  Galatians: "GAL",
  Ephesians: "EPH",
  Philippians: "PHP",
  Colossians: "COL",
  "1 Thessalonians": "1TH",
  "2 Thessalonians": "2TH",
  "1 Timothy": "1TI",
  "2 Timothy": "2TI",
  Titus: "TIT",
  Philemon: "PHM",
  Hebrews: "HEB",
  James: "JAS",
  "1 Peter": "1PE",
  "2 Peter": "2PE",
  "1 John": "1JN",
  "2 John": "2JN",
  "3 John": "3JN",
  Jude: "JUD",
  Revelation: "REV",
};

const BOOKS_OF_THE_BIBLE = Object.keys(BOOK_ID_MAP);

export default function AddVerseModal() {
  const router = useRouter();
  const { book: bookParam } = useLocalSearchParams<{ book: string }>();
  const book = bookParam ?? "Genesis";

  const bg = useThemeColor({}, "background");
  const card = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const muted = useThemeColor({}, "icon");

  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const addVerse = useMutation(api.verses.addVerse);

  const allCollections = useQuery(
    api.collections.listCollections,
    userId ? { userId } : "skip",
  );
  const addToCollection = useMutation(
    api.collectionVerses.addVerseToCollection,
  );

  // Update handleSave to also assign collections after inserting
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);

  const [translation, setTranslation] = useState("ESV");
  const [chapter, setChapter] = useState("");
  const [verseStart, setVerseStart] = useState("");
  const [verseEnd, setVerseEnd] = useState("");
  const [text, setText] = useState("");

  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [saveError, setSaveError] = useState("");

  // Clear fetched text when book changes
  const prevBookRef = useRef(book);
  if (prevBookRef.current !== book) {
    prevBookRef.current = book;
    setText("");
    setFetchError("");
  }

  const apiKey = process.env.EXPO_PUBLIC_BIBLE_API_KEY ?? "";
  const canFetch = translation === "ESV";

  function toggleCollection(collectionId: string) {
    setSelectedCollections((prev) =>
      prev.includes(collectionId)
        ? prev.filter((id) => id !== collectionId)
        : [...prev, collectionId],
    );
  }

  async function handleFetch() {
    if (!chapter || !verseStart) {
      setFetchError("Enter chapter and verse first.");
      return;
    }
    setFetching(true);
    setFetchError("");
    setText("");
    try {
      const passage = verseEnd
        ? `${book} ${chapter}:${verseStart}-${verseEnd}`
        : `${book} ${chapter}:${verseStart}`;

      const res = await fetch(
        `https://api.esv.org/v3/passage/text/?q=${encodeURIComponent(passage)}&include-headings=false&include-footnotes=false&include-verse-numbers=false&include-short-copyright=false&include-passage-references=false`,
        {
          headers: {
            Authorization: `Token ${apiKey}`,
          },
        },
      );
      const data = await res.json();
      const fetched = data?.passages?.[0]?.trim();
      if (!fetched) {
        setFetchError("Verse not found. Check the reference and try again.");
      } else {
        setText(fetched);
      }
    } catch {
      setFetchError("Fetch failed. Check your API key and connection.");
    } finally {
      setFetching(false);
    }
  }

  async function handleSave() {
    if (!userId) {
      setSaveError("Not logged in.");
      return;
    }
    if (!chapter || !verseStart || !text) {
      setSaveError("Please fill in chapter, verse, and text.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const verseId = await addVerse({
        userId,
        book,
        chapter: parseInt(chapter),
        verseStart: parseInt(verseStart),
        verseEnd: verseEnd ? parseInt(verseEnd) : undefined,
        translation,
        text: text.trim(),
      });

      // Add to any selected collections (beyond Uncategorized which is automatic)
      await Promise.all(
        selectedCollections.map((collectionId) =>
          addToCollection({
            collectionId: collectionId as Id<"collections">,
            verseId: verseId as Id<"verses">,
            userId,
          }),
        ),
      );

      router.dismiss();
    } catch {
      setSaveError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Translation */}
        <ThemedText type="defaultSemiBold" style={styles.label}>
          Translation
        </ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.translationRow}
        >
          {TRANSLATIONS.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTranslation(t)}
              style={[
                styles.chip,
                { backgroundColor: card, borderColor: muted },
                translation === t && styles.chipActive,
              ]}
            >
              <ThemedText
                style={[
                  styles.chipText,
                  translation === t && styles.chipTextActive,
                ]}
              >
                {t}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Book */}
        <ThemedText type="defaultSemiBold" style={styles.label}>
          Book
        </ThemedText>
        {Platform.OS === "web" ? (
          <View style={styles.comboWrapper}>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: card, color: textColor, borderColor: muted },
              ]}
              value={book === "Genesis" && !bookParam ? "" : book}
              onChangeText={(val) => router.setParams({ book: val })}
              placeholder="Search book..."
              placeholderTextColor={muted}
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
            style={[
              styles.bookBtn,
              { backgroundColor: card, borderColor: muted },
            ]}
            onPress={() =>
              router.push({
                pathname: "/book-picker",
                params: { current: book },
              })
            }
          >
            <ThemedText style={styles.bookBtnText}>{book}</ThemedText>
            <ThemedText style={[styles.bookBtnChevron, { color: muted }]}>
              ›
            </ThemedText>
          </TouchableOpacity>
        )}

        {/* Chapter / Verse */}
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              Chapter
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: card, color: textColor, borderColor: muted },
              ]}
              placeholder="8"
              placeholderTextColor={muted}
              keyboardType="numeric"
              value={chapter}
              onChangeText={setChapter}
            />
          </View>
          <View style={styles.rowItem}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              Verse
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: card, color: textColor, borderColor: muted },
              ]}
              placeholder="1"
              placeholderTextColor={muted}
              keyboardType="numeric"
              value={verseStart}
              onChangeText={setVerseStart}
            />
          </View>
          <View style={styles.rowItem}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              To verse
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: card, color: textColor, borderColor: muted },
              ]}
              placeholder="4"
              placeholderTextColor={muted}
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
              style={[
                styles.fetchBtn,
                { borderColor: textColor },
                fetching && styles.btnDisabled,
              ]}
              onPress={handleFetch}
              disabled={fetching}
            >
              {fetching ? (
                <ActivityIndicator color={textColor} />
              ) : (
                <ThemedText style={styles.fetchBtnText}>Fetch Verse</ThemedText>
              )}
            </TouchableOpacity>
            {fetchError ? (
              <ThemedText style={styles.errorText}>{fetchError}</ThemedText>
            ) : null}
          </>
        )}

        {/* Verse text */}
        <ThemedText
          type="defaultSemiBold"
          style={[styles.label, { marginTop: 20 }]}
        >
          Verse Text
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            { backgroundColor: card, color: textColor, borderColor: muted },
          ]}
          placeholder={
            canFetch
              ? "Tap 'Fetch Verse' to auto-fill, or type manually."
              : "Type or paste the verse text here."
          }
          placeholderTextColor={muted}
          value={text}
          onChangeText={setText}
          multiline
          textAlignVertical="top"
        />

        {/* Collections */}
        {allCollections &&
          allCollections.filter((c) => c.name !== "Uncategorized").length >
            0 && (
            <View style={{ marginTop: 8, marginBottom: 12 }}>
              <ThemedText type="defaultSemiBold" style={styles.label}>
                Add to Collection
              </ThemedText>
              <View style={{ gap: 8 }}>
                {allCollections
                  .filter((c) => c.name !== "Uncategorized")
                  .map((col) => {
                    const isSelected = selectedCollections.includes(col._id);
                    return (
                      <TouchableOpacity
                        key={col._id}
                        style={[
                          styles.collectionRow,
                          { backgroundColor: card, borderColor: muted },
                          isSelected && {
                            backgroundColor: muted,
                            borderColor: textColor,
                          },
                        ]}
                        onPress={() => toggleCollection(col._id)}
                      >
                        <ThemedText
                          style={[
                            styles.collectionRowText,
                            isSelected && styles.collectionRowTextActive,
                          ]}
                        >
                          {col.name}
                        </ThemedText>
                        <ThemedText
                          style={[styles.collectionRowCheck, { color: muted }]}
                        >
                          {isSelected ? "✓" : "+"}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            </View>
          )}

        {saveError ? (
          <ThemedText style={styles.errorText}>{saveError}</ThemedText>
        ) : null}
        <View style={{ height: 40 }} />
      </ScrollView>

      <View
        style={{
          borderTopColor: muted,
          flexDirection: "row",
          gap: 12,
          padding: 24,
          paddingBottom: Platform.OS === "ios" ? 36 : 24,
          borderTopWidth: 1,
        }}
      >
        <Link href="/" dismissTo asChild>
          <ThemedButton variant="outline">Cancel</ThemedButton>
        </Link>
        <ThemedButton onPress={handleSave} disabled={saving}>
          Save Verse
        </ThemedButton>
      </View>
    </ThemedView>
  </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 8 },
  label: { fontSize: 13, marginBottom: 6 },
  translationRow: { marginBottom: 20 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginRight: 8,
    backgroundColor: "#fafafa",
  },
  chipActive: { borderColor: "#1a1a1a" },
  chipText: { fontSize: 13, fontWeight: "500" },
  chipTextActive: {},
  bookBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e8e8e8",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fafafa",
    marginBottom: 16,
  },
  bookBtnText: { fontSize: 15 },
  bookBtnChevron: { fontSize: 20 },
  comboWrapper: { marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#e8e8e8",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: "#fafafa",
    marginBottom: 12,
  },
  collectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e8e8e8",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fafafa",
  },
  collectionRowActive: { borderColor: "#1a1a1a", backgroundColor: "#f5f5f5" },
  collectionRowText: { fontSize: 15 },
  collectionRowTextActive: { fontWeight: "600" },
  collectionRowCheck: { fontSize: 16 },
  textArea: { height: 140, paddingTop: 12 },
  row: { flexDirection: "row", gap: 8 },
  rowItem: { flex: 1 },
  fetchBtn: {
    borderWidth: 1,
    borderColor: "#1a1a1a",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 4,
  },
  fetchBtnText: { fontSize: 15, fontWeight: "600" },
  btnDisabled: { opacity: 0.4 },
  errorText: { color: "#c0392b", fontSize: 13, marginTop: 4, marginBottom: 8 },
  footer: {},
  cancelBtnText: { fontSize: 15, fontWeight: "600" },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  saveBtn: {
    flex: 1, // ✅ changed from 2 → 1
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { fontSize: 15, fontWeight: "600" },
});
