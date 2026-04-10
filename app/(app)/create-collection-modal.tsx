import { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { Id } from "@/convex/_generated/dataModel";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedButton } from "@/components/themed-button";

type CollectionType = "personal" | "shared";

export default function CreateCollectionModal() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const {
    collectionId,
    name: existingName,
    description: existingDescription,
  } = useLocalSearchParams<{
    collectionId?: string;
    name?: string;
    description?: string;
  }>();

  const isEditing = !!collectionId;

  const [name, setName] = useState(existingName ?? "");
  const [description, setDescription] = useState(existingDescription ?? "");
  const [type, setType] = useState<CollectionType>("personal");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const createCollection = useMutation(api.collections.createCollection);
  const updateCollection = useMutation(api.collections.updateCollection);
  const createGroup = useMutation(api.groups.createGroup);

  async function handleSave() {
    if (!name.trim()) {
      setError("Please enter a collection name.");
      return;
    }
    if (!userId) return;
    setSaving(true);
    setError("");
    try {
      if (isEditing) {
        await updateCollection({
          collectionId: collectionId as Id<"collections">,
          userId,
          name,
          description: description || undefined,
        });
        router.dismiss();
      } else if (type === "personal") {
        await createCollection({
          userId,
          name,
          description: description || undefined,
        });
        router.dismiss();
      } else {
        // Shared — create group first, then collection owned by group
        const { groupId, inviteCode } = await createGroup({ userId, name });
        await createCollection({
          userId,
          name,
          description: description || undefined,
          groupId, // pass groupId so collection is owned by group
        });
        // Navigate to invite screen so admin can share the code immediately
        router.dismiss();
        router.push({
          pathname: "/(app)/(protected)/invite-screen",
          params: { groupId, inviteCode, collectionName: name },
        });
      }
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"} // try "height" for Android too
          style={{ flex: 1 }}
        >
          <View style={styles.scroll}>
            <ThemedText type="title" style={styles.title}>
              {isEditing ? "Edit Collection" : "New Collection"}
            </ThemedText>

            <ThemedText type="defaultSemiBold" style={styles.label}>
              Name *
            </ThemedText>
            <TextInput
              style={styles.input}
              placeholder="e.g. Romans 8, Anxiety verses, Small Group S25..."
              placeholderTextColor="#aaa"
              value={name}
              onChangeText={setName}
              autoFocus
              maxLength={60}
            />

            <ThemedText type="defaultSemiBold" style={styles.label}>
              Description
            </ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Optional — what is this collection for?"
              placeholderTextColor="#aaa"
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              maxLength={200}
            />

            {/* Type toggle — only show when creating */}
            {!isEditing && (
              <View style={styles.typeSection}>
                <ThemedText type="defaultSemiBold" style={styles.label}>
                  Type
                </ThemedText>
                <View style={styles.typeRow}>
                  <TouchableOpacity
                    style={[
                      styles.typeBtn,
                      type === "personal" && styles.typeBtnActive,
                    ]}
                    onPress={() => setType("personal")}
                  >
                    <ThemedText
                      style={[
                        styles.typeBtnText,
                        type === "personal" && styles.typeBtnTextActive,
                      ]}
                    >
                      🔒 Personal
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.typeBtnSub,
                        type === "personal" && styles.typeBtnSubActive,
                      ]}
                    >
                      Only you
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeBtn,
                      type === "shared" && styles.typeBtnActive,
                    ]}
                    onPress={() => setType("shared")}
                  >
                    <ThemedText
                      style={[
                        styles.typeBtnText,
                        type === "shared" && styles.typeBtnTextActive,
                      ]}
                    >
                      👥 Shared
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.typeBtnSub,
                        type === "shared" && styles.typeBtnSubActive,
                      ]}
                    >
                      Invite others
                    </ThemedText>
                  </TouchableOpacity>
                </View>
                {type === "shared" && (
                  <ThemedText style={styles.sharedHint}>
                    An invite code will be generated after creation.
                  </ThemedText>
                )}
              </View>
            )}

            {error ? (
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            ) : null}
          </View>

          <View style={styles.footer}>
            <ThemedButton variant="outline" onPress={() => router.dismiss()}>
              Cancel
            </ThemedButton>
            <ThemedButton onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : isEditing ? (
                "Save"
              ) : type === "shared" ? (
                "Create & Invite"
              ) : (
                "Create"
              )}
            </ThemedButton>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { flex: 1, padding: 24 },
  title: { marginBottom: 24 },
  label: { fontSize: 13, marginBottom: 6, color: "#555" },
  input: {
    borderWidth: 1,
    borderColor: "#e8e8e8",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1a1a1a",
    backgroundColor: "#fafafa",
    marginBottom: 20,
  },
  textArea: { height: 100, paddingTop: 12 },
  typeSection: { marginBottom: 8 },
  typeRow: { flexDirection: "row", gap: 12, marginBottom: 10 },
  typeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    backgroundColor: "#fafafa",
    gap: 4,
  },
  typeBtnActive: { borderColor: "#1a1a1a", backgroundColor: "#f5f5f5" },
  typeBtnText: { fontSize: 15, fontWeight: "600", color: "#555" },
  typeBtnTextActive: { color: "#1a1a1a" },
  typeBtnSub: { fontSize: 12, color: "#aaa" },
  typeBtnSubActive: { color: "#666" },
  sharedHint: { fontSize: 13, color: "#aaa", marginTop: 4 },
  errorText: { color: "#c0392b", fontSize: 13, marginTop: 4 },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
});
