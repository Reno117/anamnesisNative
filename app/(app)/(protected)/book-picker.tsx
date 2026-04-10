import { useRouter, useLocalSearchParams } from "expo-router"
import { TouchableOpacity, View, Text, StyleSheet, FlatList } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
  "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles",
  "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
  "Ecclesiastes", "Song of Sol.", "Isaiah", "Jeremiah",
  "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah",
  "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans",
  "1 Cor.", "2 Cor.", "Galatians", "Ephesians",
  "Philippians", "Colossians", "1 Thess.", "2 Thess.",
  "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews",
  "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John",
  "Jude", "Revelation",
]

const DISPLAY_TO_FULL: Record<string, string> = {
  "Song of Sol.": "Song of Solomon",
  "1 Cor.": "1 Corinthians",
  "2 Cor.": "2 Corinthians",
  "1 Thess.": "1 Thessalonians",
  "2 Thess.": "2 Thessalonians",
}

export default function BookPickerModal() {
  const router = useRouter()
  const { current } = useLocalSearchParams<{ current: string }>()

  function handleSelect(displayName: string) {
    const fullName = DISPLAY_TO_FULL[displayName] ?? displayName
    // Navigate back to modal with the book param set
    router.dismissTo({ pathname: "/modal", params: { book: fullName } })
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
    <View style={styles.container}>
      <FlatList
        data={BOOKS}
        keyExtractor={(b) => b}
        numColumns={6}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => {
          const fullName = DISPLAY_TO_FULL[item] ?? item
          const isSelected = (current ?? "Genesis") === fullName
          return (
            <TouchableOpacity
              style={[styles.cell, isSelected && styles.cellActive]}
              onPress={() => handleSelect(item)}
            >
              <Text
                style={[styles.cellText, isSelected && styles.cellTextActive]}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {item}
              </Text>
            </TouchableOpacity>
          )
        }}
      />
    </View>
</SafeAreaView>
  )
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
  cellText: { fontSize: 10, color: "#333", textAlign: "center", fontWeight: "500" },
  cellTextActive: { color: "#fff" },
})