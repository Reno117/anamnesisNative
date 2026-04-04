import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, useLocalSearchParams } from "expo-router"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { Id } from "@/convex/_generated/dataModel"

export default function CollectionDetail() {
  const router = useRouter()
  const { collectionId } = useLocalSearchParams<{ collectionId: string }>()
  const { data: session } = authClient.useSession()
  const userId = session?.user?.id

  const collection = useQuery(
    api.collections.getCollection,
    collectionId ? { collectionId: collectionId as Id<"collections"> } : "skip"
  )

  const verses = useQuery(
    api.collectionVerses.getVersesInCollection,
    collectionId ? { collectionId: collectionId as Id<"collections"> } : "skip"
  )

  const removeVerse = useMutation(api.collectionVerses.removeVerseFromCollection)

  function confirmRemove(verseId: Id<"verses">, ref: string) {
    Alert.alert(
      "Remove from collection?",
      `Remove ${ref}? The verse stays in your library.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () =>
            removeVerse({
              collectionId: collectionId as Id<"collections">,
              verseId,
              userId: userId!,
            }),
        },
      ]
    )
  }

  if (!collection || !verses) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color="#1a1a1a" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() =>
            router.push({
              pathname: "/create-collection-modal",
              params: { collectionId: collection._id, name: collection.name, description: collection.description ?? "" },
            })
          }
        >
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>{collection.name}</Text>
        {collection.description ? (
          <Text style={styles.description}>{collection.description}</Text>
        ) : null}
        <Text style={styles.verseCountText}>
          {verses.length} {verses.length === 1 ? "verse" : "verses"}
        </Text>
      </View>

      {verses.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No verses yet</Text>
          <Text style={styles.emptySubtitle}>
            Add verses to this collection from the verse edit screen.
          </Text>
        </View>
      ) : (
        <FlatList
          data={verses}
          keyExtractor={(v) => v!._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            if (!item) return null
            const ref = `${item.book} ${item.chapter}:${item.verseStart}${item.verseEnd ? `–${item.verseEnd}` : ""}`
            const canRemove = item.addedBy === userId
            return (
              <TouchableOpacity
                style={[styles.card, item.isMemorized && styles.cardMemorized]}
                onPress={() =>
                  router.push({ pathname: "/edit-modal", params: { verseId: item._id } })
                }
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.ref}>{ref}</Text>
                  <View style={styles.cardHeaderRight}>
                    {item.isMemorized && (
                      <Text style={styles.memorizedDot}>✓</Text>
                    )}
                    {canRemove && (
                      <TouchableOpacity
                        onPress={() => confirmRemove(item._id as Id<"verses">, ref)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={styles.removeText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <Text style={styles.verseText} numberOfLines={3}>{item.text}</Text>
              </TouchableOpacity>
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f6f3" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 20, paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  backBtnText: { fontSize: 17, color: "#1a1a1a", fontWeight: "500" },
  editBtn: {
    borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  editBtnText: { fontSize: 14, color: "#555", fontWeight: "600" },
  titleRow: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#ece9e3" },
  pageTitle: { fontSize: 26, fontWeight: "700", color: "#1a1a1a", letterSpacing: -0.6, marginBottom: 2 },
  description: { fontSize: 14, color: "#888", marginBottom: 4 },
  verseCountText: { fontSize: 13, color: "#aaa" },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: "#ece9e3",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardMemorized: { backgroundColor: "#f5fbf5", borderColor: "#c8e6c9" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardHeaderRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  ref: { fontSize: 13, fontWeight: "700", color: "#1a1a1a" },
  memorizedDot: { fontSize: 13, color: "#388e3c", fontWeight: "700" },
  removeText: { fontSize: 14, color: "#ccc", fontWeight: "700" },
  verseText: { fontSize: 15, color: "#444", lineHeight: 22 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: "#aaa", textAlign: "center", lineHeight: 21 },
})