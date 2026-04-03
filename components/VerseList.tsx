import React from "react"
import { View, Text, TouchableOpacity, StyleSheet, Alert, FlatList, ActivityIndicator } from "react-native"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

interface Props {
  userId: string
}

export function VerseList({ userId }: Props) {
  const verses = useQuery(api.verses.listVerses, { userId })
  const removeVerse = useMutation(api.verses.removeVerse)

  function confirmRemove(verseId: Id<"verses">, ref: string) {
    Alert.alert("Remove verse?", `Remove ${ref} from your collection?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removeVerse({ verseId })
          } catch (e) {
            Alert.alert("Error", "Could not remove verse. Please try again.")
          }
        },
      },
    ])
  }

  if (verses === undefined) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator color="#1a1a1a" />
      </View>
    )
  }

  if (verses.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No verses yet.{"\n"}Add your first one above.</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={verses}
      keyExtractor={(v) => v._id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => {
        const ref = `${item.book} ${item.chapter}:${item.verseStart}${item.verseEnd ? `–${item.verseEnd}` : ""} (${item.translation})`
        return (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.ref}>{ref}</Text>
              <TouchableOpacity
                onPress={() => confirmRemove(item._id as Id<"verses">, ref)}
                style={styles.removeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.verseText}>{item.text}</Text>
          </View>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyText: { textAlign: "center", color: "#aaa", fontSize: 16, lineHeight: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  ref: { fontSize: 13, fontWeight: "700", color: "#1a1a1a", letterSpacing: 0.2 },
  removeBtn: { padding: 4 },
  removeBtnText: { color: "#bbb", fontSize: 16, fontWeight: "700" },
  verseText: { fontSize: 15, color: "#444", lineHeight: 23 },
})