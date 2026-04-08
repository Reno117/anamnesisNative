import { useState } from "react"
import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { ThemedText } from "@/components/themed-text"
import { ThemedButton } from "@/components/themed-button"
import { ThemedView } from "@/components/themed-view"
import { useThemeColor } from "@/hooks/use-theme-color"

function tokenize(text: string): string[] {
  return text.split(/\s+/).filter(Boolean)
}

function normalize(word: string): string {
  return word.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
}

type WordResult = { word: string; correct: boolean }

export default function PracticeFullVerse() {
  const router = useRouter()
  const { verseId } = useLocalSearchParams<{ verseId: string }>()

  const verse = useQuery(api.verses.getVerse, {
    verseId: verseId as Id<"verses">,
  })
  const markReviewed = useMutation(api.verses.markReviewed)
  const toggleMemorized = useMutation(api.verses.toggleMemorized)
  const textColor = useThemeColor({}, "text")


  const [input, setInput] = useState("")
  const [results, setResults] = useState<WordResult[] | null>(null)

  const ref = verse
    ? `${verse.book} ${verse.chapter}:${verse.verseStart}${verse.verseEnd ? `–${verse.verseEnd}` : ""}`
    : ""

  function handleSubmit() {
    if (!verse) return
    const correctWords = tokenize(verse.text)
    const userWords = tokenize(input)

    const wordResults: WordResult[] = correctWords.map((word, i) => ({
      word,
      correct: normalize(userWords[i] ?? "") === normalize(word),
    }))

    const correct = wordResults.filter((w) => w.correct).length
    setResults(wordResults)
    markReviewed({ verseId: verseId as Id<"verses"> })
  }

  function handleRetry() {
    setInput("")
    setResults(null)
  }

  const correctCount = results?.filter((w) => w.correct).length ?? 0
  const totalCount = results?.length ?? 0
  const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0
  const perfect = percentage === 100

  if (!verse) return null

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ThemedText style={styles.backBtnText}>‹ Back</ThemedText>
            </TouchableOpacity>
            <ThemedText type="defaultSemiBold" style={styles.ref}>{ref}</ThemedText>
            <ThemedText style={styles.mode}>Full Verse</ThemedText>
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {!results ? (
              <>
                <ThemedText style={styles.instruction}>
                  Type the verse from memory as accurately as you can.
                </ThemedText>

                <TextInput
                  style={[styles.input, { color: textColor }]}
                  value={input}
                  onChangeText={setInput}
                  multiline
                  autoFocus
                  textAlignVertical="top"
                  placeholder="Start typing..."
                  placeholderTextColor="#ccc"
                  autoCorrect={false}
                  autoCapitalize="sentences"
                />

                <View style={styles.btnRow}>
                  <ThemedButton
                    variant="outline"
                    onPress={() => router.back()}
                  >
                    Cancel
                  </ThemedButton>
                  <ThemedButton
                    onPress={handleSubmit}
                    disabled={!input.trim()}
                  >
                    Submit
                  </ThemedButton>
                </View>
              </>
            ) : (
              /* Results */
              <View style={styles.results}>
                <ThemedText type="title" style={styles.percentageText}>
                  {percentage}%
                </ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.resultLabel}>
                  {perfect
                    ? "Perfect! 🎉"
                    : percentage >= 80
                    ? "Great job!"
                    : percentage >= 50
                    ? "Keep practicing!"
                    : "Keep at it!"}
                </ThemedText>
                <ThemedText style={styles.resultSub}>
                  {correctCount} of {totalCount} words correct
                </ThemedText>

                {/* Word diff */}
                <View style={styles.reviewContainer}>
                  <View style={styles.wordsContainer}>
                    {results.map((result, i) => (
                      <View key={i} style={styles.wordWrapper}>
                        <ThemedText
                          style={
                            result.correct
                              ? styles.wordCorrect
                              : styles.wordIncorrect
                          }
                        >
                          {result.word}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.btnRow}>
                  <ThemedButton variant="outline" onPress={handleRetry}>
                    Retry
                  </ThemedButton>
                  {perfect && !verse.isMemorized && (
                    <ThemedButton
                      onPress={async () => {
                        await toggleMemorized({ verseId: verseId as Id<"verses"> })
                        router.back()
                      }}
                    >
                      Mark Memorized
                    </ThemedButton>
                  )}
                  <ThemedButton variant="outline" onPress={() => router.back()}>
                    Done
                  </ThemedButton>
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 2,
  },
  backBtn: { marginBottom: 8 },
  backBtnText: { fontSize: 17, fontWeight: "500" },
  ref: { fontSize: 18 },
  mode: { fontSize: 13, color: "#aaa" },
  scroll: { padding: 20, paddingBottom: 40 },
  instruction: {
    fontSize: 15,
    color: "#888",
    marginBottom: 20,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e8e8e8",
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    minHeight: 180,
    marginBottom: 20,
    lineHeight: 24,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  results: { alignItems: "center", paddingTop: 20 },
  percentageText: {
    fontSize: 72,
    fontWeight: "700",
    letterSpacing: -2,
    marginBottom: 8,
  },
  resultLabel: { fontSize: 22, marginBottom: 4 },
  resultSub: { fontSize: 15, color: "#aaa", marginBottom: 28 },
  reviewContainer: {
    width: "100%",
    backgroundColor: "#fafafa",
    borderRadius: 14,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#ece9e3",
  },
  wordsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  wordWrapper: { marginBottom: 4 },
  wordCorrect: { fontSize: 16, color: "#2e7d32", fontWeight: "500" },
  wordIncorrect: { fontSize: 16, color: "#c62828", fontWeight: "500" },
})