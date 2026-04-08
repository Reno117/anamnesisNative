import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Dimensions,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { ThemedText } from "@/components/themed-text"
import { ThemedButton } from "@/components/themed-button"
import { ThemedView } from "@/components/themed-view"
import { SafeAreaView } from "react-native-safe-area-context"

const SCREEN_HEIGHT = Dimensions.get("window").height
const LONG_VERSE_THRESHOLD = 300 // characters

export default function PracticeModal() {
  const router = useRouter()
  const { verseId } = useLocalSearchParams<{ verseId: string }>()

  const verse = useQuery(api.verses.getVerse, {
    verseId: verseId as Id<"verses">,
  })

  const ref = verse
    ? `${verse.book} ${verse.chapter}:${verse.verseStart}${verse.verseEnd ? `–${verse.verseEnd}` : ""}`
    : ""

  const isLong = (verse?.text?.length ?? 0) > LONG_VERSE_THRESHOLD

  function goToMode(mode: "first-letter" | "full-verse") {
    router.replace({
      pathname:
        mode === "first-letter"
          ? "/(app)/(protected)/practice-first-letter"
          : "/(app)/(protected)/practice-full-verse",
      params: { verseId },
    })
  }

  return (
    <TouchableWithoutFeedback onPress={() => router.back()}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback>
          <ThemedView style={styles.sheet}>
            <SafeAreaView edges={["bottom"]}>
              {/* Drag handle */}
              <View style={styles.handle} />

              {/* Reference */}
              <ThemedText type="defaultSemiBold" style={styles.ref}>
                {ref}
              </ThemedText>

              {/* Verse text — scrollable only if long */}
              {isLong ? (
                <ScrollView
                  style={[styles.verseScroll, { maxHeight: SCREEN_HEIGHT * 0.3 }]}
                  showsVerticalScrollIndicator={false}
                >
                  <ThemedText type="defaultSemiBold">{verse?.text}</ThemedText>
                </ScrollView>
              ) : (
                <ThemedText type="defaultSemiBold">{verse?.text}</ThemedText>
              )}

              {/* Divider */}
              <View style={styles.divider} />

              <ThemedText type="defaultSemiBold" style={styles.practiceLabel}>
                Choose a practice mode
              </ThemedText>

              {/* Mode buttons */}
              <TouchableOpacity
                style={styles.modeCard}
                onPress={() => goToMode("first-letter")}
                activeOpacity={0.7}
              >
                <View style={styles.modeIcon}>
                  <ThemedText style={styles.modeIconText}>A</ThemedText>
                </View>
                <View style={styles.modeInfo}>
                  <ThemedText type="defaultSemiBold" style={styles.modeTitle}>
                    First Letter
                  </ThemedText>
                  <ThemedText style={styles.modeSubtitle}>
                    Type the first letter of each word
                  </ThemedText>
                </View>
                <ThemedText style={styles.modeChevron}>›</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modeCard}
                onPress={() => goToMode("full-verse")}
                activeOpacity={0.7}
              >
                <View style={styles.modeIcon}>
                  <ThemedText style={styles.modeIconText}>≡</ThemedText>
                </View>
                <View style={styles.modeInfo}>
                  <ThemedText type="defaultSemiBold" style={styles.modeTitle}>
                    Full Verse
                  </ThemedText>
                  <ThemedText style={styles.modeSubtitle}>
                    Type the entire verse from memory
                  </ThemedText>
                </View>
                <ThemedText style={styles.modeChevron}>›</ThemedText>
              </TouchableOpacity>

              {/* Cancel */}
              <View style={styles.cancelRow}>
                <ThemedButton
                  variant="outline"
                  onPress={() => router.back()}
                >
                  Cancel
                </ThemedButton>
              </View>
            </SafeAreaView>
          </ThemedView>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  ref: {
    fontSize: 18,
    marginBottom: 10,
  },
  verseScroll: {
    marginBottom: 16,
  },
  verseText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#444",
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginBottom: 16,
  },
  practiceLabel: {
    fontSize: 13,
    color: "#aaa",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modeCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ece9e3",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  modeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  modeIconText: { fontSize: 18, fontWeight: "700" },
  modeInfo: { flex: 1 },
  modeTitle: { fontSize: 15 },
  modeSubtitle: { fontSize: 13, color: "#aaa", marginTop: 2 },
  modeChevron: { fontSize: 22, color: "#ccc" },
  cancelRow: {
    flexDirection: "row",
    marginTop: 8,
  },
})