import { useThemeColor } from "@/hooks/use-theme-color";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// [abbrev, fullName]
const BOOKS: [string, string][] = [
  ["Gen", "Genesis"],
  ["Exod", "Exodus"],
  ["Lev", "Leviticus"],
  ["Num", "Numbers"],
  ["Deut", "Deuteronomy"],
  ["Josh", "Joshua"],
  ["Judg", "Judges"],
  ["Ruth", "Ruth"],
  ["1 Sam", "1 Samuel"],
  ["2 Sam", "2 Samuel"],
  ["1 Kgs", "1 Kings"],
  ["2 Kgs", "2 Kings"],
  ["1 Chr", "1 Chronicles"],
  ["2 Chr", "2 Chronicles"],
  ["Ezra", "Ezra"],
  ["Neh", "Nehemiah"],
  ["Esth", "Esther"],
  ["Job", "Job"],
  ["Ps", "Psalms"],
  ["Prov", "Proverbs"],
  ["Eccl", "Ecclesiastes"],
  ["Song", "Song of Solomon"],
  ["Isa", "Isaiah"],
  ["Jer", "Jeremiah"],
  ["Lam", "Lamentations"],
  ["Ezek", "Ezekiel"],
  ["Dan", "Daniel"],
  ["Hos", "Hosea"],
  ["Joel", "Joel"],
  ["Amos", "Amos"],
  ["Obad", "Obadiah"],
  ["Jonah", "Jonah"],
  ["Mic", "Micah"],
  ["Nah", "Nahum"],
  ["Hab", "Habakkuk"],
  ["Zeph", "Zephaniah"],
  ["Hag", "Haggai"],
  ["Zech", "Zechariah"],
  ["Mal", "Malachi"],
  ["Matt", "Matthew"],
  ["Mark", "Mark"],
  ["Luke", "Luke"],
  ["John", "John"],
  ["Acts", "Acts"],
  ["Rom", "Romans"],
  ["1 Cor", "1 Corinthians"],
  ["2 Cor", "2 Corinthians"],
  ["Gal", "Galatians"],
  ["Eph", "Ephesians"],
  ["Phil", "Philippians"],
  ["Col", "Colossians"],
  ["1 Thes", "1 Thessalonians"],
  ["2 Thes", "2 Thessalonians"],
  ["1 Tim", "1 Timothy"],
  ["2 Tim", "2 Timothy"],
  ["Titus", "Titus"],
  ["Phlm", "Philemon"],
  ["Heb", "Hebrews"],
  ["Jas", "James"],
  ["1 Pet", "1 Peter"],
  ["2 Pet", "2 Peter"],
  ["1 Jn", "1 John"],
  ["2 Jn", "2 John"],
  ["3 Jn", "3 John"],
  ["Jude", "Jude"],
  ["Rev", "Revelation"],
];

export default function BookPickerModal() {
  const router = useRouter();
  const textPrimary = useThemeColor({}, "text");
  const { current } = useLocalSearchParams<{ current: string }>();
  const [tooltip, setTooltip] = useState<string | null>(null);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSelect(fullName: string) {
    router.dismissTo({ pathname: "/modal", params: { book: fullName } });
  }

  function handleLongPress(fullName: string) {
    setTooltip(fullName);
    // Auto-dismiss after 1.5 s so the user doesn't have to tap away
    tooltipTimer.current = setTimeout(() => setTooltip(null), 1500);
  }

  function dismissTooltip() {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    setTooltip(null);
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: textPrimary }]}>
            ‹ Back
          </Text>
        </TouchableOpacity>

        <FlatList
          data={BOOKS}
          keyExtractor={([, full]) => full}
          numColumns={6}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item: [abbrev, fullName] }) => {
            const isSelected = (current ?? "Genesis") === fullName;
            return (
              <TouchableOpacity
                style={[styles.cell, isSelected && styles.cellActive]}
                onPress={() => handleSelect(fullName)}
                onLongPress={() => handleLongPress(fullName)}
                delayLongPress={350}
              >
                <Text
                  style={[styles.cellText, isSelected && styles.cellTextActive]}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                >
                  {abbrev}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* Full-name tooltip modal */}
        <Modal
          visible={tooltip !== null}
          transparent
          animationType="fade"
          onRequestClose={dismissTooltip}
        >
          <TouchableOpacity
            style={styles.tooltipOverlay}
            activeOpacity={1}
            onPress={dismissTooltip}
          >
            <View style={styles.tooltipBox}>
              <Text style={styles.tooltipText}>{tooltip}</Text>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  grid: { padding: 12 },
  row: { gap: 8, marginBottom: 8 },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    backgroundColor: "#fafafa",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  cellActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  cellText: {
    fontSize: 10,
    color: "#333",
    textAlign: "center",
    fontWeight: "500",
  },
  cellTextActive: { color: "#fff" },
  backBtn: { padding: 4 },
  backBtnText: { fontSize: 17, fontWeight: "500" },

  // Tooltip
  tooltipOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  tooltipBox: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tooltipText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});