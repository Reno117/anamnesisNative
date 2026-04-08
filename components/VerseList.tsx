import { useMemo } from "react"
import {
  View,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { useRouter } from "expo-router"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { ThemedText } from "@/components/themed-text"

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

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (v) =>
          v.book.toLowerCase().includes(q) ||
          v.text.toLowerCase().includes(q) ||
          `${v.book} ${v.chapter}:${v.verseStart}`.toLowerCase().includes(q)
      )
    }

    if (sort === "recent") {
      list.sort((a, b) => b.addedAt - a.addedAt)
    } else if (sort === "book") {
      list.sort(
        (a, b) =>
          a.book.localeCompare(b.book) ||
          a.chapter - b.chapter ||
          a.verseStart - b.verseStart
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
        <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>No verses yet</ThemedText>
        <ThemedText style={styles.emptySubtitle}>Tap + Add to get started</ThemedText>
      </View>
    )
  }

  if (filtered.length === 0) {
    return (
      <View style={styles.centered}>
        <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>No results</ThemedText>
        <ThemedText style={styles.emptySubtitle}>Try a different search</ThemedText>
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
            
            onPress={() =>
              router.push({
                pathname: "/(app)/(protected)/practice",
                params: { verseId: item._id },
              })
            }
            activeOpacity={0.9}
          >
            <View style={styles.cardHeader}>
              <View style={styles.refRow}>
                <ThemedText style={styles.ref}>{ref}</ThemedText>
                <View style={styles.cardHeaderRight}>
                  <ThemedText style={styles.translation}>{item.translation}</ThemedText>
                  {/* Edit button */}
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/(app)/(protected)/edit-modal",
                        params: { verseId: item._id },
                      })
                    }
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.editBtn}
                  >
                    <ThemedText style={styles.editBtnText}>✎</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
              {item.isMemorized && (
                <View style={styles.memorizedBadge}>
                  <ThemedText style={styles.memorizedBadgeText}>✓ Memorized</ThemedText>
                </View>
              )}
            </View>
            <ThemedText style={styles.verseText} numberOfLines={3}>
              {item.text}
            </ThemedText>
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
  cardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ref: { fontSize: 14, fontWeight: "700", letterSpacing: 0.1, color: "black" },
  translation: { fontSize: 11, color: "#aaa", fontWeight: "500" },
  editBtn: {
    padding: 2,
  },
  editBtnText: { fontSize: 15, color: "#aaa" },
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