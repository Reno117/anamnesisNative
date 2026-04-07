import React, { useEffect, useState } from "react";
import {
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { authClient } from "@/lib/auth-client";
import { VerseList } from "@/components/VerseList";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
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
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ThemedView style={{ flex: 1 }}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <View style={styles.headerTop}>
            <ThemedText style={styles.appTitle}>My Verses</ThemedText>

            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push("/modal")}
            >
              <ThemedText style={styles.addBtnText}>+ Add</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View
            style={[
              styles.searchWrapper,
              { backgroundColor: inputBg },
            ]}
          >
            <ThemedText style={[styles.searchIcon, { color: mutedText }]}>
              ⌕
            </ThemedText>

            <TextInput
              style={styles.searchInput}
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
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

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
    marginBottom: 14,
  },

  appTitle: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.8,
  },

  addBtn: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
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