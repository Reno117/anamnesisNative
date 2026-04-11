import { ThemedText } from "@/components/themed-text";
import { api } from "@/convex/_generated/api";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { ExpandableVerse } from "./expandableVerse";

type SortOption = "recent" | "book" | "memorized";

interface Props {
  userId: string;
  search: string;
  sort: SortOption;
}

export function VerseList({ userId, search, sort }: Props) {
  const router = useRouter();
  const verses = useQuery(api.verses.listVerses, { userId });
  const scheme = useColorScheme();

  // ── Theme tokens ──────────────────────────────────────────────
  const bg = useThemeColor({}, "background");
  const surface = useThemeColor(
    { light: "#ffffff", dark: "#1c1c1e" },
    "background",
  );
  const border = useThemeColor({ light: "#ece9e3", dark: "#2c2c2e" }, "border");
  const textPrimary = useThemeColor({}, "text");
  const textMuted = useThemeColor(
    { light: "#aaaaaa", dark: "#636366" },
    "tabIconDefault",
  );
  const shadow = scheme === "dark" ? "transparent" : "#000";

  // Memorized card theming
  const memorizedSurface = useThemeColor(
    { light: "#f5fbf5", dark: "#1a2a1a" },
    "background",
  );
  const memorizedBorder = useThemeColor(
    { light: "#c8e6c9", dark: "#2a4a2a" },
    "border",
  );
  const memorizedBadgeBg = useThemeColor(
    { light: "#e8f5e9", dark: "#1e3a1e" },
    "background",
  );
  const memorizedText = useThemeColor(
    { light: "#388e3c", dark: "#81c784" },
    "text",
  );
  const verseText = useThemeColor(
    { light: "#444444", dark: "#ababab" },
    "text",
  );
  const refText = useThemeColor({ light: "#000000", dark: "#f2f2f7" }, "text");

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate a network request
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  }, []);

  const filtered = useMemo(() => {
    if (!verses) return [];
    let list = [...verses];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) =>
          v.book.toLowerCase().includes(q) ||
          v.text.toLowerCase().includes(q) ||
          `${v.book} ${v.chapter}:${v.verseStart}`.toLowerCase().includes(q),
      );
    }

    if (sort === "recent") {
      list.sort((a, b) => b.addedAt - a.addedAt);
    } else if (sort === "book") {
      list.sort(
        (a, b) =>
          a.book.localeCompare(b.book) ||
          a.chapter - b.chapter ||
          a.verseStart - b.verseStart,
      );
    } else if (sort === "memorized") {
      list.sort((a, b) => (b.isMemorized ? 1 : 0) - (a.isMemorized ? 1 : 0));
    }

    return list;
  }, [verses, search, sort]);

  const empty = (verses?.length === 0) ?
     (
      <View style={styles.centered}>
        <ThemedText
          type="defaultSemiBold"
          style={[styles.emptyTitle, { color: textPrimary }]}
        >
          No verses yet
        </ThemedText>
        <ThemedText style={[styles.emptySubtitle, { color: textMuted }]}>
          Tap + Add to get started
        </ThemedText>
      </View>
    )
  : (filtered.length === 0) ? 
     (
      <View style={styles.centered}>
        <ThemedText
          type="defaultSemiBold"
          style={[styles.emptyTitle, { color: textPrimary }]}
        >
          No results
        </ThemedText>
        <ThemedText style={[styles.emptySubtitle, { color: textMuted }]}>
          Try a different search
        </ThemedText>
      </View>
    ) : null;

  return (
    <FlatList
      data={filtered}
      keyExtractor={(v) => v._id}
      contentContainerStyle={styles.list}
      keyboardDismissMode="interactive"
      refreshControl={
        <RefreshControl
          refreshing={refreshing || verses == undefined}
          onRefresh={onRefresh}
          tintColor="blue" // iOS spinner color
          colors={["blue", "green", "orange"]} // Android spinner colors
          title="Refreshing..." // optional iOS title
          titleColor="blue"
        />
      }
      ListEmptyComponent={empty}
      renderItem={({ item }) => {
        const ref = `${item.book} ${item.chapter}:${item.verseStart}${item.verseEnd ? `–${item.verseEnd}` : ""}`;
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
                backgroundColor: memorizedSurface,
                borderColor: memorizedBorder,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.refRow}>
                <ThemedText style={[styles.ref, { color: refText }]}>
                  {ref}
                </ThemedText>
                <View style={styles.cardHeaderRight}>
                  <ThemedText
                    style={[styles.translation, { color: textMuted }]}
                  >
                    {item.translation}
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/(app)/edit-modal",
                        params: { verseId: item._id },
                      })
                    }
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.editBtn}
                  >
                    <ThemedText
                      style={[styles.editBtnText, { color: textMuted }]}
                    >
                      ✎
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
              {item.isMemorized && (
                <View
                  style={[
                    styles.memorizedBadge,
                    { backgroundColor: memorizedBadgeBg },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.memorizedBadgeText,
                      { color: memorizedText },
                    ]}
                  >
                    ✓ Memorized
                  </ThemedText>
                </View>
              )}
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
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: { fontSize: 17, fontWeight: "600", marginBottom: 4 },
  emptySubtitle: { fontSize: 14 },
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
  ref: { fontSize: 14, fontWeight: "700", letterSpacing: 0.1 },
  translation: { fontSize: 11, fontWeight: "500" },
  editBtn: { padding: 2 },
  editBtnText: { fontSize: 15 },
  memorizedBadge: {
    alignSelf: "flex-start",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  memorizedBadgeText: { fontSize: 11, fontWeight: "600" },
  verseText: { fontSize: 15, lineHeight: 22 },
});
