import { useState, useRef } from "react"
import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { ThemedText } from "@/components/themed-text"
import { ThemedButton } from "@/components/themed-button"
import { ThemedView } from "@/components/themed-view"

function tokenizeVerse(text: string): string[] {
  return text.split(/\s+/).filter(Boolean)
}

function stripPunctuation(word: string): string {
  return word.replace(/[^a-zA-Z0-9]/g, "")
}

type WordState = "pending" | "correct" | "incorrect"

const BLANK_WIDTH = 28 // uniform width for all blanks regardless of word length

export default function PracticeFirstLetter() {
  const router = useRouter()
  const { verseId } = useLocalSearchParams<{ verseId: string }>()

  const verse = useQuery(api.verses.getVerse, {
    verseId: verseId as Id<"verses">,
  })
  const markReviewed = useMutation(api.verses.markReviewed)
  const toggleMemorized = useMutation(api.verses.toggleMemorized)

  const words = verse ? tokenizeVerse(verse.text) : []
  const [currentIndex, setCurrentIndex] = useState(0)
  const [wordStates, setWordStates] = useState<WordState[]>([])
  const [finished, setFinished] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<TextInput>(null)

  const ref = verse
    ? `${verse.book} ${verse.chapter}:${verse.verseStart}${verse.verseEnd ? `–${verse.verseEnd}` : ""} · ${verse.translation}`
    : ""

  function handleKeyPress(letter: string) {
    if (finished || currentIndex >= words.length) return
    const raw = words[currentIndex]
    const clean = stripPunctuation(raw)
    const firstLetter = clean[0]?.toLowerCase()
    const isCorrect = letter.toLowerCase() === firstLetter
    const insets = useSafeAreaInsets();


    const newState: WordState = isCorrect ? "correct" : "incorrect";

    const newStates = [...wordStates, newState];
    setWordStates(newStates);


    const nextIndex = currentIndex + 1
    setCurrentIndex(nextIndex)

    if (nextIndex >= words.length) {
      setFinished(true)
      markReviewed({ verseId: verseId as Id<"verses"> })
    }
  }

  function handleRetry() {
    setCurrentIndex(0)
    setWordStates([])
    setFinished(false)
    setInputValue("")
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const correctCount = wordStates.filter((s) => s === "correct").length
  const percentage = words.length > 0 ? Math.round((correctCount / words.length) * 100) : 0
  const perfect = percentage === 100

  if (!verse) return null

  return (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back */}
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ThemedText style={styles.backBtnText}>‹ Back</ThemedText>
            </TouchableOpacity>

            {!finished ? (
              <>
                {/* Title + reference */}
                <ThemedText type="title" style={styles.title}>
                  First Letter Mode
                </ThemedText>
                <ThemedText style={styles.refSubtitle}>
                  {ref.toUpperCase()}
                </ThemedText>

                <ThemedText style={styles.instruction}>
                  Type the first letter of each word — the rest will fill in automatically.
                </ThemedText>

                {/* Word blanks card */}
                <View style={styles.blanksCard}>
                  <View style={styles.wordsContainer}>
                    {words.map((word, i) => {
                      const state = wordStates[i]
                      const isCurrent = i === currentIndex

                      if (state === "correct") {
                        return (
                          <ThemedText key={i} style={styles.wordCorrect}>
                            {word}
                          </ThemedText>
                        )
                      }
                      if (state === "incorrect") {
                        return (
                          <ThemedText key={i} style={styles.wordIncorrect}>
                            {word}
                          </ThemedText>
                        )
                      }
                      // Pending — uniform blank dash
                      return (
                        <View
                          key={i}
                          style={[
                            styles.blank,
                            isCurrent && styles.blankCurrent,
                          ]}
                        />
                      )
                    })}
                  </View>
                </View>

                {/* Visible input */}
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  value={inputValue}
                  autoFocus
                  autoCorrect={false}
                  autoCapitalize="none"
                  placeholder="Type the first letter of each word..."
                  placeholderTextColor="#bbb"
                  onChangeText={(val) => {
                    if (val.length > 0) {
                      handleKeyPress(val[val.length - 1])
                      setInputValue("")
                    }
                  }}
                />
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
                  {correctCount} of {words.length} words correct
                </ThemedText>

                {/* Colored word review */}
                <View style={styles.blanksCard}>
                  <View style={styles.wordsContainer}>
                    {words.map((word, i) => (
                      <ThemedText
                        key={i}
                        style={
                          wordStates[i] === "correct"
                            ? styles.wordCorrect
                            : styles.wordIncorrect
                        }
                      >
                        {word}
                      </ThemedText>
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
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  scroll: { padding: 24, paddingTop: 32, paddingBottom: 48 },

  backBtn: { marginBottom: 24 },
  backBtnText: { fontSize: 17, fontWeight: "500" },

  title: {
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  refSubtitle: {
    fontSize: 13,
    color: "#aaa",
    letterSpacing: 1,
    marginBottom: 24,
  },
  instruction: {
    fontSize: 15,
    color: "#888",
    lineHeight: 22,
    marginBottom: 24,
  },

  blanksCard: {
    borderWidth: 1,
    borderColor: "#e8e8e8",
    borderRadius: 16,
    padding: 20,
    backgroundColor: "#fafafa",
    marginBottom: 20,
  },
  wordsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    rowGap: 14,
  },

  blank: {
    width: BLANK_WIDTH,
    height: 2,
    backgroundColor: "#ccc",
    borderRadius: 1,
    marginTop: 14, // pushes dash down to text baseline
  },
  blankCurrent: {
    backgroundColor: "#1a1a1a",
  },

  wordCorrect: {
    fontSize: 16,
    color: "#2e7d32",
    fontWeight: "500",
  },
  wordIncorrect: {
    fontSize: 16,
    color: "#c62828",
    fontWeight: "500",
  },

  input: {
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: "#1a1a1a",
    backgroundColor: "#fafafa",
  },

  results: { alignItems: "center", paddingTop: 20 },
  percentageText: {
    fontSize: 80,
    fontWeight: "700",
    letterSpacing: -3,
    marginBottom: 8,
    lineHeight: 100
  },
  resultLabel: { fontSize: 22, marginBottom: 4 },
  resultSub: { fontSize: 15, color: "#aaa", marginBottom: 28 },

  btnRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginTop: 8,
  },
})