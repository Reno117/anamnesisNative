import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { authClient } from "@/lib/auth-client";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeColor } from "@/hooks/use-theme-color";
import { ThemedText } from "@/components/themed-text";
import { ExpandableVerse } from "@/components/expandableVerse";

export default function CollectionDetail() {
  const router = useRouter();
  const { collectionId } = useLocalSearchParams<{ collectionId: string }>();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const scheme = useColorScheme();

  // ── Theme tokens ──────────────────────────────────────────────
  const bg = useThemeColor({}, "background");
  const surface = useThemeColor(
    { light: "#ffffff", dark: "#1c1c1e" },
    "background",
  );
  const border = useThemeColor({ light: "#ece9e3", dark: "#2c2c2e" }, "border");
  const textPrimary = useThemeColor({}, "text");
  const textSub = useThemeColor(
    { light: "#555555", dark: "#8e8e93" },
    "tabIconDefault",
  );
  const textMuted = useThemeColor(
    { light: "#888888", dark: "#636366" },
    "tabIconDefault",
  );
  const textFaint = useThemeColor(
    { light: "#aaaaaa", dark: "#48484a" },
    "tabIconDefault",
  );
  const editBorder = useThemeColor(
    { light: "#e0e0e0", dark: "#3a3a3c" },
    "border",
  );
  const verseText = useThemeColor(
    { light: "#444444", dark: "#ebebf5" },
    "text",
  );
  const removeTint = useThemeColor(
    { light: "#cccccc", dark: "#48484a" },
    "tabIconDefault",
  );
  const shadow = scheme === "dark" ? "transparent" : "#000";

  // Memorized card colors
  const memorizedBg = scheme === "dark" ? "#1a2e1a" : "#f5fbf5";
  const memorizedBorder = scheme === "dark" ? "#2d4a2d" : "#c8e6c9";
  const memorizedCheck = scheme === "dark" ? "#66bb6a" : "#388e3c";

  const collection = useQuery(
    api.collections.getCollection,
    collectionId ? { collectionId: collectionId as Id<"collections"> } : "skip",
  );

  const verses = useQuery(
    api.collectionVerses.getVersesInCollection,
    collectionId ? { collectionId: collectionId as Id<"collections"> } : "skip",
  );

  const removeVerse = useMutation(
    api.collectionVerses.removeVerseFromCollection,
  );

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
      ],
    );
  }

  if (!collection || !verses) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: bg }]}>
        <ActivityIndicator color={textPrimary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bg }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: textPrimary }]}>
            ‹ Back
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.editBtn, { borderColor: editBorder }]}
          onPress={() =>
            router.push({
              pathname: "/create-collection-modal",
              params: {
                collectionId: collection._id,
                name: collection.name,
                description: collection.description ?? "",
              },
            })
          }
        >
          <Text style={[styles.editBtnText, { color: textSub }]}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.titleRow, { borderBottomColor: border }]}>
        <Text style={[styles.pageTitle, { color: textPrimary }]}>
          {collection.name}
        </Text>
        {collection.description ? (
          <Text style={[styles.description, { color: textMuted }]}>
            {collection.description}
          </Text>
        ) : null}
        <Text style={[styles.verseCountText, { color: textFaint }]}>
          {verses.length} {verses.length === 1 ? "verse" : "verses"}
        </Text>
      </View>

      {verses.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: textPrimary }]}>
            No verses yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: textFaint }]}>
            Add verses to this collection from the verse edit screen.
          </Text>
        </View>
      ) : (
        <FlatList
          data={verses}
          keyExtractor={(v) => v!._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            if (!item) return null;
            const ref = `${item.book} ${item.chapter}:${item.verseStart}${item.verseEnd ? `–${item.verseEnd}` : ""}`;
            const canRemove = item.addedBy === userId;
            return (
              <ExpandableVerse
              verse={item}
                style={[
                  styles.card,
                  {
                    backgroundColor: surface,
                    borderColor: border,
                    shadowColor: shadow,
                  },
                  item.isMemorized && {
                    backgroundColor: memorizedBg,
                    borderColor: memorizedBorder,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <ThemedText style={[styles.ref, { color: textPrimary }]}>
                    {ref}
                  </ThemedText>
                  <View style={styles.cardHeaderRight}>
                    {item.isMemorized && (
                      <ThemedText
                        style={[styles.memorizedDot, { color: memorizedCheck }]}
                      >
                        ✓
                      </ThemedText>
                    )}
                    {/* Edit button */}
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: "/(app)/edit-modal",
                          params: { verseId: item._id },
                        })
                      }
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <ThemedText style={styles.editBtnText}>✎</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
                <ThemedText
                  style={[styles.verseText, { color: verseText }]}
                  numberOfLines={3}
                >
                  {item.text}
                </ThemedText>
              </ExpandableVerse>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  backBtnText: { fontSize: 17, fontWeight: "500" },
  editBtn: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  editBtnText: { fontSize: 15, color: "#aaa" },
  //editBtnText: { fontSize: 14, fontWeight: "600" },
  titleRow: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.6,
    marginBottom: 2,
  },
  description: { fontSize: 14, marginBottom: 4 },
  verseCountText: { fontSize: 13 },
  list: { padding: 16, gap: 10 },
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  //cardHeaderRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  ref: { fontSize: 13, fontWeight: "700" },
  memorizedDot: { fontSize: 13, fontWeight: "700" },
  removeText: { fontSize: 14, fontWeight: "700" },
  verseText: { fontSize: 15, lineHeight: 22 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 21 },
});