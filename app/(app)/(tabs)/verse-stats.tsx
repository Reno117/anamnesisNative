import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { useThemeColor } from "@/hooks/use-theme-color"

const BOOK_ORDER = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
  "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles",
  "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
  "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah",
  "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah",
  "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans",
  "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
  "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
  "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews",
  "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John",
  "Jude", "Revelation",
]

function timeSince(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export default function VerseStatsScreen() {
  const { data: session } = authClient.useSession()
  const userId = session?.user?.id
  const scheme = useColorScheme()

  // ── Theme tokens ──────────────────────────────────────────────
  const bg          = useThemeColor({}, "background")
  const surface     = useThemeColor({ light: "#ffffff",   dark: "#1c1c1e" }, "background")
  const border      = useThemeColor({ light: "#ece9e3",   dark: "#2c2c2e" }, "border")
  const textPrimary = useThemeColor({}, "text")
  const textMuted   = useThemeColor({ light: "#888888",   dark: "#636366" }, "tabIconDefault")
  const textFaint   = useThemeColor({ light: "#aaaaaa",   dark: "#48484a" }, "tabIconDefault")
  const trackBg     = useThemeColor({ light: "#eeeeee",   dark: "#3a3a3c" }, "border")

  // Stat cards
  const totalBg       = surface
  const memorizedBg   = scheme === "dark" ? "#1a2e1a" : "#f0faf0"
  const memorizedBdr  = scheme === "dark" ? "#2d4a2d" : "#c8e6c9"
  const remainingBg   = scheme === "dark" ? "#2e2200" : "#fffbf0"
  const remainingBdr  = scheme === "dark" ? "#4a3800" : "#ffe082"

  // Semantic colors (green / amber) — slightly lighter in dark mode
  const green         = scheme === "dark" ? "#66bb6a" : "#2e7d32"
  const greenFill     = scheme === "dark" ? "#4caf50" : "#2e7d32"
  const greenLight    = scheme === "dark" ? "#388e3c" : "#81c784"
  const amber         = scheme === "dark" ? "#ffb74d" : "#e65100"
  const amberMuted    = scheme === "dark" ? "#a07840" : "#a0760a"
  const reviewBg      = scheme === "dark" ? "#2e2200" : "#fffbf0"
  const reviewBdr     = scheme === "dark" ? "#4a3800" : "#ffe082"
  const reviewRowBdr  = scheme === "dark" ? "#3d2e00" : "#fde68a"

  const stats = useQuery(
    api.verses.verseStats,
    userId ? { userId } : "skip"
  )

  if (!userId) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: bg }]}>
        <Text style={[styles.emptyText, { color: textFaint }]}>Not logged in.</Text>
      </SafeAreaView>
    )
  }

  if (!stats) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: bg }]}>
        <ActivityIndicator color={textPrimary} />
      </SafeAreaView>
    )
  }

  const progress = stats.total > 0 ? stats.memorized / stats.total : 0

  const sortedBooks = Object.entries(stats.byBook).sort(([a], [b]) => {
    const ai = BOOK_ORDER.indexOf(a)
    const bi = BOOK_ORDER.indexOf(b)
    if (ai === -1 && bi === -1) return a.localeCompare(b)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: textPrimary }]}>Stats</Text>

        {/* Summary cards */}
        <View style={styles.cardRow}>
          <View style={[styles.statCard, { backgroundColor: totalBg, borderColor: border }]}>
            <Text style={[styles.statNumber, { color: textPrimary }]}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: textMuted }]}>Total</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: memorizedBg, borderColor: memorizedBdr }]}>
            <Text style={[styles.statNumber, { color: green }]}>{stats.memorized}</Text>
            <Text style={[styles.statLabel, { color: textMuted }]}>Memorized</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: remainingBg, borderColor: remainingBdr }]}>
            <Text style={[styles.statNumber, { color: amber }]}>{stats.remaining}</Text>
            <Text style={[styles.statLabel, { color: textMuted }]}>Remaining</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={[styles.section, { backgroundColor: surface, borderColor: border }]}>
          <View style={styles.progressLabelRow}>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>Memorization Progress</Text>
            <Text style={[styles.progressPct, { color: textPrimary }]}>{Math.round(progress * 100)}%</Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: trackBg }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round(progress * 100)}%` as any, backgroundColor: greenFill },
              ]}
            />
          </View>
        </View>

        {/* Needs review */}
        {stats.needsReview.length > 0 && (
          <View style={[styles.section, { backgroundColor: reviewBg, borderColor: reviewBdr }]}>
            <Text style={[styles.reviewTitle, { color: amber }]}>
              ⏰ Due for Review ({stats.needsReview.length})
            </Text>
            <Text style={[styles.reviewSubtitle, { color: amberMuted }]}>
              These memorized verses haven't been reviewed in over 7 days.
            </Text>
            {stats.needsReview.map((verse) => {
              const ref = `${verse.book} ${verse.chapter}:${verse.verseStart}${verse.verseEnd ? `–${verse.verseEnd}` : ""}`
              return (
                <View key={verse._id} style={[styles.reviewRow, { borderTopColor: reviewRowBdr }]}>
                  <Text style={[styles.reviewRef, { color: textPrimary }]}>{ref}</Text>
                  <Text style={[styles.reviewTime, { color: amberMuted }]}>
                    {verse.lastReviewedAt ? timeSince(verse.lastReviewedAt) : "never reviewed"}
                  </Text>
                </View>
              )
            })}
          </View>
        )}

        {/* By book */}
        {sortedBooks.length > 0 && (
          <View style={[styles.section, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>By Book</Text>
            <View style={{ gap: 14, marginTop: 8 }}>
              {sortedBooks.map(([book, { total, memorized }]) => {
                const bookProgress = total > 0 ? memorized / total : 0
                const isComplete = memorized === total && total > 0
                return (
                  <View key={book} style={styles.bookRow}>
                    <View style={styles.bookMeta}>
                      <Text style={[styles.bookName, { color: textPrimary }]}>{book}</Text>
                      <Text style={[styles.bookCount, { color: textMuted }]}>{memorized}/{total}</Text>
                    </View>
                    <View style={[styles.bookTrack, { backgroundColor: trackBg }]}>
                      <View
                        style={[
                          styles.bookFill,
                          { width: `${Math.round(bookProgress * 100)}%` as any },
                          { backgroundColor: isComplete ? greenFill : greenLight },
                        ]}
                      />
                    </View>
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {stats.total === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: textPrimary }]}>No verses yet</Text>
            <Text style={[styles.emptySubtitle, { color: textFaint }]}>
              Add your first verse to see stats here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 20, paddingBottom: 48 },
  pageTitle: { fontSize: 28, fontWeight: "700", letterSpacing: -0.8, marginBottom: 20 },

  cardRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 14, padding: 16, alignItems: "center", borderWidth: 1 },
  statNumber: { fontSize: 32, fontWeight: "700", letterSpacing: -1 },
  statLabel: { fontSize: 12, fontWeight: "500", marginTop: 2 },

  section: { borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },

  progressLabelRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 10,
  },
  progressPct: { fontSize: 14, fontWeight: "700" },
  progressTrack: { height: 10, borderRadius: 5, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 5 },

  reviewTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  reviewSubtitle: { fontSize: 12, marginBottom: 12 },
  reviewRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingVertical: 8,
    borderTopWidth: 1,
  },
  reviewRef: { fontSize: 14, fontWeight: "600" },
  reviewTime: { fontSize: 12 },

  bookRow: { gap: 6 },
  bookMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bookName: { fontSize: 14, fontWeight: "600" },
  bookCount: { fontSize: 12, fontWeight: "500" },
  bookTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  bookFill: { height: "100%", borderRadius: 3 },

  emptyState: { alignItems: "center", paddingTop: 40 },
  emptyTitle: { fontSize: 17, fontWeight: "600", marginBottom: 6 },
  emptySubtitle: { fontSize: 14, textAlign: "center" },
  emptyText: { fontSize: 15 },
})