import { useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  useColorScheme,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { Id } from "@/convex/_generated/dataModel"
import { useThemeColor } from "@/hooks/use-theme-color"

export default function CollectionsScreen() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const userId = session?.user?.id
  const scheme = useColorScheme()

  // ── Theme tokens ──────────────────────────────────────────────
  const bg          = useThemeColor({}, "background")
  const surface     = useThemeColor({ light: "#ffffff",  dark: "#1c1c1e" }, "background")
  const border      = useThemeColor({ light: "#ece9e3",  dark: "#2c2c2e" }, "border")
  const textPrimary = useThemeColor({}, "text")
  const textMuted   = useThemeColor({ light: "#999999",  dark: "#636366" }, "tabIconDefault")
  const textFaint   = useThemeColor({ light: "#aaaaaa",  dark: "#48484a" }, "tabIconDefault")
  const pill        = useThemeColor({ light: "#1a1a1a",  dark: "#f2f2f7" }, "text")
  const pillText    = useThemeColor({ light: "#ffffff",  dark: "#1a1a1a" }, "background")
  const shadow      = scheme === "dark" ? "transparent" : "#000"

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
      <SafeAreaView style={[styles.centered, { backgroundColor: bg }]}>
        <Text style={[styles.emptyText, { color: textMuted }]}>Not logged in.</Text>
      </SafeAreaView>
    )
  }

  if (collections === undefined) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: bg }]}>
        <ActivityIndicator color={textPrimary} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: border }]}>
        <Text style={[styles.pageTitle, { color: textPrimary }]}>Collections</Text>
        <TouchableOpacity
          style={[styles.newBtn, { backgroundColor: pill }]}
          onPress={() => router.push("/create-collection-modal")}
        >
          <Text style={[styles.newBtnText, { color: pillText }]}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Empty state */}
      {collections.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: textPrimary }]}>No collections yet</Text>
          <Text style={[styles.emptySubtitle, { color: textMuted }]}>
            Create your first collection to start organizing your verses.
          </Text>
          <TouchableOpacity
            style={[styles.emptyBtn, { backgroundColor: pill }]}
            onPress={() => router.push("/create-collection-modal")}
          >
            <Text style={[styles.emptyBtnText, { color: pillText }]}>Create a Collection</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={collections}
          keyExtractor={(c) => c._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.card,
                {
                  backgroundColor: surface,
                  borderColor: border,
                  shadowColor: shadow,
                },
              ]}
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
                <Text style={[styles.cardName, { color: textPrimary }]}>{item.name}</Text>
                {item.description ? (
                  <Text style={[styles.cardDescription, { color: textMuted }]} numberOfLines={1}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
              <View style={styles.cardRight}>
                <Text style={[styles.verseCount, { color: textPrimary }]}>{item.verseCount}</Text>
                <Text style={[styles.verseCountLabel, { color: textFaint }]}>
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
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  pageTitle: {
    fontSize: 28, fontWeight: "700", letterSpacing: -0.8,
  },
  newBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  newBtnText: { fontWeight: "600", fontSize: 14 },
  list: { padding: 16, gap: 10 },
  card: {
    borderRadius: 14, padding: 18,
    borderWidth: 1,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardLeft: { flex: 1, marginRight: 12 },
  cardName: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  cardDescription: { fontSize: 13 },
  cardRight: { alignItems: "center" },
  verseCount: { fontSize: 24, fontWeight: "700", letterSpacing: -0.5 },
  verseCountLabel: { fontSize: 11, fontWeight: "500" },
  emptyState: {
    flex: 1, alignItems: "center", justifyContent: "center", padding: 40,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  emptySubtitle: {
    fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 28,
  },
  emptyBtn: {
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12,
  },
  emptyBtnText: { fontWeight: "600", fontSize: 15 },
  emptyText: { fontSize: 15 },
})