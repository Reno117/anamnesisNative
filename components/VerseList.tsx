import { useMemo } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native"
import { useRouter } from "expo-router"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

type SortOption = "recent" | "book" | "memorized"

interface Props {
  userId: string
  search: string
  sort: SortOption
}

export function VerseList({ userId, search, sort }: Props) {
  const router = useRouter()
  const verses = useQuery(api.verses.listVerses, { userId })

  const filtered = useMemo(() => {
    if (!verses) return []
    let list = [...verses]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (v) =>
          v.book.toLowerCase().includes(q) ||
          v.text.toLowerCase().includes(q) ||
          `${v.book} ${v.chapter}:${v.verseStart}`.toLowerCase().includes(q)
      )
    }

    // Sort
    if (sort === "recent") {
      list.sort((a, b) => b.addedAt - a.addedAt)
    } else if (sort === "book") {
      list.sort((a, b) =>
        a.book.localeCompare(b.book) || a.chapter - b.chapter || a.verseStart - b.verseStart
      )
    } else if (sort === "memorized") {
      list.sort((a, b) => (b.isMemorized ? 1 : 0) - (a.isMemorized ? 1 : 0))
    }

    return list
  }, [verses, search, sort])

  if (verses === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#1a1a1a" />
      </View>
    )
  }

  if (verses.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No verses yet</Text>
        <Text style={styles.emptySubtitle}>Tap + Add to get started</Text>
      </View>
    )
  }

  if (filtered.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No results</Text>
        <Text style={styles.emptySubtitle}>Try a different search</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={filtered}
      keyExtractor={(v) => v._id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const ref = `${item.book} ${item.chapter}:${item.verseStart}${item.verseEnd ? `–${item.verseEnd}` : ""}`
        return (
          <TouchableOpacity
            style={[styles.card, item.isMemorized && styles.cardMemorized]}
            onPress={() => router.push({ pathname: "./edit-modal", params: { verseId: item._id } })}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={styles.refRow}>
                <Text style={styles.ref}>{ref}</Text>
                <Text style={styles.translation}>{item.translation}</Text>
              </View>
              {item.isMemorized && (
                <View style={styles.memorizedBadge}>
                  <Text style={styles.memorizedBadgeText}>✓ Memorized</Text>
                </View>
              )}
            </View>
            <Text style={styles.verseText} numberOfLines={3}>{item.text}</Text>
          </TouchableOpacity>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: "#1a1a1a", marginBottom: 4 },
  emptySubtitle: { fontSize: 14, color: "#aaa" },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ece9e3",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardMemorized: {
    backgroundColor: "#f5fbf5",
    borderColor: "#c8e6c9",
  },
  cardHeader: { marginBottom: 8 },
  refRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  ref: { fontSize: 14, fontWeight: "700", color: "#1a1a1a", letterSpacing: 0.1 },
  translation: { fontSize: 11, color: "#aaa", fontWeight: "500" },
  memorizedBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#e8f5e9",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  memorizedBadgeText: { fontSize: 11, color: "#388e3c", fontWeight: "600" },
  verseText: { fontSize: 15, color: "#444", lineHeight: 22 },
})