import { useEffect, useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native"
import { Link, useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { authClient } from "@/lib/auth-client"
import { VerseList } from "@/components/VerseList"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

type SortOption = "recent" | "book" | "memorized"

export default function HomeScreen() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("recent");

  if (!userId) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.notLoggedIn}>You are not logged in.</Text>
      </SafeAreaView>
    );
  }
  const ensureUncategorized = useMutation(api.collections.ensureUncategorized);

  useEffect(() => {
    if (userId) ensureUncategorized({ userId });
  }, [userId]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.appTitle}>My Verses</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push("/modal")}
          >
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search verses..."
            placeholderTextColor="#aaa"
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
          {(["recent", "book", "memorized"] as SortOption[]).map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.sortPill, sort === opt && styles.sortPillActive]}
              onPress={() => setSort(opt)}
            >
              <Text
                style={[
                  styles.sortPillText,
                  sort === opt && styles.sortPillTextActive,
                ]}
              >
                {opt === "recent"
                  ? "Recently Added"
                  : opt === "book"
                    ? "By Book"
                    : "Memorized"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <VerseList userId={userId} search={search} sort={sort} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f6f3" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  notLoggedIn: { fontSize: 16, color: "#888" },

  header: {
    backgroundColor: "#f7f6f3",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ece9e3",
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
    color: "#1a1a1a",
    letterSpacing: -0.8,
  },
  addBtn: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eeecea",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: { fontSize: 18, color: "#999", marginRight: 6 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: "#1a1a1a" },

  sortRow: { gap: 8 },
  sortPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#eeecea",
  },
  sortPillActive: { backgroundColor: "#1a1a1a" },
  sortPillText: { fontSize: 13, color: "#666", fontWeight: "500" },
  sortPillTextActive: { color: "#fff" },
});