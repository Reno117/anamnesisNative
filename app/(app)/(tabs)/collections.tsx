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
import { ThemedText } from "@/components/themed-text"

export default function CollectionsScreen() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const userId = session?.user?.id
  const scheme = useColorScheme()

  const bg = useThemeColor({}, "background")
  const surface = useThemeColor({ light: "#ffffff", dark: "#1c1c1e" }, "background")
  const border = useThemeColor({ light: "#ece9e3", dark: "#2c2c2e" }, "border")
  const textPrimary = useThemeColor({}, "text")
  const textMuted = useThemeColor({ light: "#999999", dark: "#636366" }, "tabIconDefault")
  const textFaint = useThemeColor({ light: "#aaaaaa", dark: "#48484a" }, "tabIconDefault")
  const pill = useThemeColor({ light: "#1a1a1a", dark: "#f2f2f7" }, "text")
  const pillText = useThemeColor({ light: "#ffffff", dark: "#1a1a1a" }, "background")
  const shadow = scheme === "dark" ? "transparent" : "#000"

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
          // Fix 1: pass userId to deleteCollection
          onPress: () => deleteCollection({ collectionId, userId: userId! }),
        },
      ]
    )
  }

  if (!userId) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: bg }]}>
        <ThemedText style={{ color: textMuted }}>Not logged in.</ThemedText>
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
        <ThemedText type="title" style={[styles.pageTitle, { color: textPrimary }]}>
          Collections
        </ThemedText>
        <View style={styles.headerBtns}>
          <TouchableOpacity
            style={[styles.joinBtn, { borderColor: textPrimary }]}
            onPress={() => router.push("/(app)/join-collection")}
          >
            <ThemedText style={[styles.joinBtnText, { color: textPrimary }]}>Join</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.newBtn, { backgroundColor: pill }]}
            onPress={() => router.push("/create-collection-modal")}
          >
            <Text style={[styles.newBtnText, { color: pillText }]}>+ New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Empty state */}
      {collections.length === 0 ? (
        <View style={styles.emptyState}>
          <ThemedText type="defaultSemiBold" style={[styles.emptyTitle, { color: textPrimary }]}>
            No collections yet
          </ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: textMuted }]}>
            Create your first collection to start organizing your verses.
          </ThemedText>
          <TouchableOpacity
            style={[styles.emptyBtn, { backgroundColor: pill }]}
            onPress={() => router.push("/create-collection-modal")}
          >
            <Text style={[styles.emptyBtnText, { color: pillText }]}>
              Create a Collection
            </Text>
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
                { backgroundColor: surface, borderColor: border, shadowColor: shadow },
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
                <ThemedText style={[styles.cardName, { color: textPrimary }]}>
                  {item.name}
                </ThemedText>
                {item.isShared && (
                  <View style={styles.sharedBadge}>
                    <ThemedText style={styles.sharedBadgeText}>👥 Shared</ThemedText>
                  </View>
                )}
                {item.description ? (
                  <ThemedText
                    style={[styles.cardDescription, { color: textMuted }]}
                    numberOfLines={1}
                  >
                    {item.description}
                  </ThemedText>
                ) : null}
              </View>

              <View style={styles.cardRight}>
                {/* Invite button — only on shared collections where user is admin */}
                {item.isShared && item.role === "admin" && (
                  <TouchableOpacity
                    style={[styles.inviteBtn, { borderColor: border }]}
                    onPress={() =>
                      router.push({
                        pathname: "/(app)/invite-screen",
                        params: {
                          groupId: item.ownerId,
                          collectionName: item.name,
                        },
                      })
                    }
                  >
                    <ThemedText style={[styles.inviteBtnText, { color: textMuted }]}>
                      Invite
                    </ThemedText>
                  </TouchableOpacity>
                )}
                <ThemedText style={[styles.verseCount, { color: textPrimary }]}>
                  {item.verseCount}
                </ThemedText>
                <ThemedText style={[styles.verseCountLabel, { color: textFaint }]}>
                  {item.verseCount === 1 ? "verse" : "verses"}
                </ThemedText>
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
  pageTitle: { fontSize: 28, fontWeight: "700", letterSpacing: -0.8 },
  headerBtns: { flexDirection: "row", gap: 8, alignItems: "center" },
  joinBtn: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinBtnText: { fontWeight: "600", fontSize: 14 },
  newBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  newBtnText: { fontWeight: "600", fontSize: 14 },
  list: { padding: 16, gap: 10 },
  card: {
    borderRadius: 14, padding: 18, borderWidth: 1,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardLeft: { flex: 1, marginRight: 12 },
  cardName: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  cardDescription: { fontSize: 13, marginTop: 2 },
  cardRight: { alignItems: "center", gap: 4 },
  verseCount: { fontSize: 24, fontWeight: "700", letterSpacing: -0.5 },
  verseCountLabel: { fontSize: 11, fontWeight: "500" },
  sharedBadge: {
    alignSelf: "flex-start", backgroundColor: "#e8f0fe",
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4,
  },
  sharedBadgeText: { fontSize: 11, color: "#1a73e8", fontWeight: "600" },
  inviteBtn: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8,
  },
  inviteBtnText: { fontSize: 12, fontWeight: "600" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  emptySubtitle: { fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 28 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  emptyBtnText: { fontWeight: "600", fontSize: 15 },
})