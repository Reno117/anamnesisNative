import { VerseList } from "@/components/VerseList";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";

type SortOption = "recent" | "book" | "memorized";

export default function HomeScreen() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("recent");

  const ensureUncategorized = useMutation(api.collections.ensureUncategorized);

  // Theme-aware colors for custom elements
  const inputBg = useThemeColor({}, "background");
  const mutedText = useThemeColor({}, "icon");

  const textColor = useThemeColor({}, "text");
  const bg = useThemeColor({}, "background");
  const surface = useThemeColor(
    { light: "#ffffff", dark: "#1c1c1e" },
    "background",
  );
  const border = useThemeColor({ light: "#ece9e3", dark: "#2c2c2e" }, "border");
  const textPrimary = useThemeColor({}, "text");
  const textMuted = useThemeColor(
    { light: "#999999", dark: "#636366" },
    "tabIconDefault",
  );
  const textFaint = useThemeColor(
    { light: "#aaaaaa", dark: "#48484a" },
    "tabIconDefault",
  );
  const pill = useThemeColor({ light: "#1a1a1a", dark: "#f2f2f7" }, "text");
  const pillText = useThemeColor(
    { light: "#ffffff", dark: "#1a1a1a" },
    "background",
  );

  useEffect(() => {
    if (userId) ensureUncategorized({ userId });
  }, [userId]);

  if (!userId) {
    return (
      <SafeAreaView style={styles.centered}>
        <ThemedText style={styles.notLoggedIn}>
          You are not logged in.
        </ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bg }]}
      edges={["top"]}
    >
      <ThemedView style={{ flex: 1 }}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <View style={styles.headerTop}>
            <ThemedText style={styles.appTitle}>My Verses</ThemedText>
          </View>

          {/* Search */}
          <View style={[styles.searchWrapper, { backgroundColor: inputBg }]}>
            <ThemedText style={[styles.searchIcon, { color: mutedText }]}>
              ⌕
            </ThemedText>

            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              autoCorrect={false}
              placeholder="Search verses..."
              placeholderTextColor={mutedText}
              value={search}
              onChangeText={setSearch}
              clearButtonMode="while-editing"
            />
          </View>

          {/* Sort pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortRow}
          >
            {(["recent", "book", "memorized"] as SortOption[]).map((opt) => {
              const active = sort === opt;

              return (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.sortPill,
                    {
                      backgroundColor: active ? "#1a1a1a" : inputBg,
                    },
                  ]}
                  onPress={() => setSort(opt)}
                >
                  <ThemedText
                    style={[
                      styles.sortPillText,
                      { color: active ? "#fff" : mutedText },
                    ]}
                  >
                    {opt === "recent"
                      ? "Recently Added"
                      : opt === "book"
                        ? "By Book"
                        : "Memorized"}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </ThemedView>

        {/* List */}
        <VerseList userId={userId} search={search} sort={sort} />
        <ThemedButton variant="add" onPress={() => router.push("/modal")}>
          + Add Verse
        </ThemedButton>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: {
    flex: 1,
  },

  notLoggedIn: { fontSize: 16 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ece9e3", // can theme later
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 14,
  },

  appTitle: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.8,
  },

  // addBtn: {
  //   backgroundColor: "#1a1a1a",
  //   paddingHorizontal: 16,
  //   paddingVertical: 8,
  //   borderRadius: 20,
  // },
  addBtn: {
    position: "absolute",
    bottom: 30, // adjust depending on tab bar height
    right: 20,
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,

    // optional: shadow for nicer UI
    elevation: 4, // Android
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  addBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },

  searchIcon: {
    fontSize: 18,
    marginRight: 6,
  },

  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
  },

  sortRow: { gap: 8 },

  sortPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  sortPillText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
