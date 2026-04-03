import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { authClient } from "@/lib/auth-client"

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

  const stats = useQuery(
    api.verses.verseStats,
    userId ? { userId } : "skip"
  )

  if (!userId) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emptyText}>Not logged in.</Text>
      </SafeAreaView>
    )
  }

  if (!stats) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color="#1a1a1a" />
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Stats</Text>

        {/* Summary cards */}
        <View style={styles.cardRow}>
          <View style={[styles.statCard, styles.cardTotal]}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, styles.cardMemorized]}>
            <Text style={[styles.statNumber, styles.statNumberGreen]}>
              {stats.memorized}
            </Text>
            <Text style={styles.statLabel}>Memorized</Text>
          </View>
          <View style={[styles.statCard, styles.cardRemaining]}>
            <Text style={[styles.statNumber, styles.statNumberAmber]}>
              {stats.remaining}
            </Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.section}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.sectionTitle}>Memorization Progress</Text>
            <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round(progress * 100)}%` as any },
              ]}
            />
          </View>
        </View>

        {/* Needs review */}
        {stats.needsReview.length > 0 && (
          <View style={[styles.section, styles.reviewSection]}>
            <Text style={styles.reviewTitle}>
              ⏰ Due for Review ({stats.needsReview.length})
            </Text>
            <Text style={styles.reviewSubtitle}>
              These memorized verses haven't been reviewed in over 7 days.
            </Text>
            {stats.needsReview.map((verse) => {
              const ref = `${verse.book} ${verse.chapter}:${verse.verseStart}${verse.verseEnd ? `–${verse.verseEnd}` : ""}`
              return (
                <View key={verse._id} style={styles.reviewRow}>
                  <Text style={styles.reviewRef}>{ref}</Text>
                  <Text style={styles.reviewTime}>
                    {verse.lastReviewedAt
                      ? timeSince(verse.lastReviewedAt)
                      : "never reviewed"}
                  </Text>
                </View>
              )
            })}
          </View>
        )}

        {/* By book */}
        {sortedBooks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>By Book</Text>
            <View style={{ gap: 14, marginTop: 8 }}>
              {sortedBooks.map(([book, { total, memorized }]) => {
                const bookProgress = total > 0 ? memorized / total : 0
                return (
                  <View key={book} style={styles.bookRow}>
                    <View style={styles.bookMeta}>
                      <Text style={styles.bookName}>{book}</Text>
                      <Text style={styles.bookCount}>{memorized}/{total}</Text>
                    </View>
                    <View style={styles.bookTrack}>
                      <View
                        style={[
                          styles.bookFill,
                          { width: `${Math.round(bookProgress * 100)}%` as any },
                          memorized === total && total > 0 && styles.bookFillComplete,
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
            <Text style={styles.emptyTitle}>No verses yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first verse to see stats here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f6f3" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 20, paddingBottom: 48 },
  pageTitle: {
    fontSize: 28, fontWeight: "700", color: "#1a1a1a",
    letterSpacing: -0.8, marginBottom: 20,
  },

  cardRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, borderRadius: 14, padding: 16,
    alignItems: "center", borderWidth: 1,
  },
  cardTotal: { backgroundColor: "#fff", borderColor: "#ece9e3" },
  cardMemorized: { backgroundColor: "#f0faf0", borderColor: "#c8e6c9" },
  cardRemaining: { backgroundColor: "#fffbf0", borderColor: "#ffe082" },
  statNumber: { fontSize: 32, fontWeight: "700", color: "#1a1a1a", letterSpacing: -1 },
  statNumberGreen: { color: "#2e7d32" },
  statNumberAmber: { color: "#e65100" },
  statLabel: { fontSize: 12, color: "#888", fontWeight: "500", marginTop: 2 },

  section: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: "#ece9e3", marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },

  progressLabelRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 10,
  },
  progressPct: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  progressTrack: {
    height: 10, backgroundColor: "#eee",
    borderRadius: 5, overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#2e7d32", borderRadius: 5 },

  reviewSection: { borderColor: "#ffe082", backgroundColor: "#fffbf0" },
  reviewTitle: { fontSize: 15, fontWeight: "700", color: "#e65100", marginBottom: 4 },
  reviewSubtitle: { fontSize: 12, color: "#a0760a", marginBottom: 12 },
  reviewRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: "#fde68a",
  },
  reviewRef: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  reviewTime: { fontSize: 12, color: "#a0760a" },

  bookRow: { gap: 6 },
  bookMeta: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  bookName: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  bookCount: { fontSize: 12, color: "#888", fontWeight: "500" },
  bookTrack: { height: 6, backgroundColor: "#eee", borderRadius: 3, overflow: "hidden" },
  bookFill: { height: "100%", backgroundColor: "#81c784", borderRadius: 3 },
  bookFillComplete: { backgroundColor: "#2e7d32" },

  emptyState: { alignItems: "center", paddingTop: 40 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: "#1a1a1a", marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: "#aaa", textAlign: "center" },
  emptyText: { fontSize: 15, color: "#aaa" },
})