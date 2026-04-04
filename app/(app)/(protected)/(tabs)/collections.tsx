import { useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { Id } from "@/convex/_generated/dataModel"

export default function CollectionsScreen() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const userId = session?.user?.id

  const collections = useQuery(
    api.collections.listCollections,
    userId ? { userId } : "skip"
  )

  const deleteCollection = useMutation(api.collections.deleteCollection)

  function confirmDelete(collectionId: Id<"collections">, name: string) {
    if (name === "Uncategorized") {
      Alert.alert("Can't delete", "The Uncategorized collection can't be removed.")
      return
    }
    Alert.alert(
      "Delete collection?",
      `"${name}" and all its verse links will be removed. Your verses themselves won't be deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteCollection({ collectionId }),
        },
      ]
    )
  }

  if (!userId) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emptyText}>Not logged in.</Text>
      </SafeAreaView>
    )
  }

  if (collections === undefined) {
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
        <Text style={styles.pageTitle}>Collections</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => router.push("/create-collection-modal")}
        >
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Empty state */}
      {collections.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No collections yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first collection to start organizing your verses.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.push("/create-collection-modal")}
          >
            <Text style={styles.emptyBtnText}>Create a Collection</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={collections}
          keyExtractor={(c) => c._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/collection-detail",
                  params: { collectionId: item._id },
                })
              }
              onLongPress={() => confirmDelete(item._id, item.name)}
              activeOpacity={0.7}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.cardName}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.cardDescription} numberOfLines={1}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.verseCount}>{item.verseCount}</Text>
                <Text style={styles.verseCountLabel}>
                  {item.verseCount === 1 ? "verse" : "verses"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f6f3" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ece9e3",
  },
  pageTitle: {
    fontSize: 28, fontWeight: "700", color: "#1a1a1a", letterSpacing: -0.8,
  },
  newBtn: {
    backgroundColor: "#1a1a1a", paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: 20,
  },
  newBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: "#ece9e3",
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardLeft: { flex: 1, marginRight: 12 },
  cardName: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 2 },
  cardDescription: { fontSize: 13, color: "#999" },
  cardRight: { alignItems: "center" },
  verseCount: { fontSize: 24, fontWeight: "700", color: "#1a1a1a", letterSpacing: -0.5 },
  verseCountLabel: { fontSize: 11, color: "#aaa", fontWeight: "500" },
  emptyState: {
    flex: 1, alignItems: "center", justifyContent: "center", padding: 40,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#1a1a1a", marginBottom: 8 },
  emptySubtitle: {
    fontSize: 15, color: "#aaa", textAlign: "center", lineHeight: 22, marginBottom: 28,
  },
  emptyBtn: {
    backgroundColor: "#1a1a1a", paddingHorizontal: 24,
    paddingVertical: 14, borderRadius: 12,
  },
  emptyBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  emptyText: { fontSize: 15, color: "#aaa" },
})