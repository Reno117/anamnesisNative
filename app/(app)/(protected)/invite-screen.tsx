import { useState } from "react"
import {
  View,
  StyleSheet,
  Share,
  TouchableOpacity,
  Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { Id } from "@/convex/_generated/dataModel"
import { ThemedView } from "@/components/themed-view"
import { ThemedText } from "@/components/themed-text"
import { ThemedButton } from "@/components/themed-button"

export default function InviteScreen() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const {
    groupId,
    inviteCode: initialCode,
    collectionName,
  } = useLocalSearchParams<{
    groupId: string;
    inviteCode: string;
    collectionName: string;
  }>();

  const [inviteCode, setInviteCode] = useState(initialCode ?? "");

  const members = useQuery(api.groups.getGroupMembers, {
    groupId: groupId as Id<"groups">,
  });

  const group = useQuery(api.groups.getGroup, {
    groupId: groupId as Id<"groups">,
  });

  // Replace the inviteCode state entirely — just read from the group directly
  // Keep the state only for after a regenerate
  const [regeneratedCode, setRegeneratedCode] = useState<string | null>(null);
  const displayCode = regeneratedCode ?? group?.inviteCode ?? "...";

  const regenerateCode = useMutation(api.groups.regenerateInviteCode);
  const removeMember = useMutation(api.groups.removeMember);

  async function handleShare() {
    await Share.share({
      message: `Join my "${collectionName}" scripture memory collection! Use code: ${displayCode}`,
    });
  }

  async function handleRegenerate() {
    Alert.alert(
      "Reset invite code?",
      "The old code will stop working. Anyone with the old link won't be able to join.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            const result = await regenerateCode({
              adminUserId: userId!,
              groupId: groupId as Id<"groups">,
            });
            if (result && "inviteCode" in result) {
              setRegeneratedCode(result.inviteCode ?? null);
            }
          },
        },
      ],
    );
  }

  async function handleRemoveMember(targetUserId: string) {
    Alert.alert("Remove member?", "They will lose access to this collection.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () =>
          removeMember({
            adminUserId: userId!,
            groupId: groupId as Id<"groups">,
            targetUserId,
          }),
      },
    ]);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.content}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <ThemedText style={styles.backBtnText}>‹ Back</ThemedText>
          </TouchableOpacity>

          <ThemedText type="title" style={styles.title}>
            Invite Others
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Share this code to invite people to "{collectionName}"
          </ThemedText>

          {/* Invite code display */}
          <View style={styles.codeCard}>
            <ThemedText style={styles.codeLabel}>Invite Code</ThemedText>
            <ThemedText type="title" style={styles.code}>
              {displayCode}
            </ThemedText>
          </View>

          <View style={styles.btnRow}>
            <ThemedButton onPress={handleShare}>Share Code</ThemedButton>
            <ThemedButton variant="outline" onPress={handleRegenerate}>
              Reset Code
            </ThemedButton>
          </View>

          {/* Members list */}
          <ThemedText type="defaultSemiBold" style={styles.membersTitle}>
            Members ({members?.length ?? 0})
          </ThemedText>
          {members?.map((member) => (
            <View key={member._id} style={styles.memberRow}>
              <View>
                <ThemedText style={styles.memberId}>{member.userId}</ThemedText>
                <ThemedText style={styles.memberRole}>
                  {member.role === "admin" ? "Admin" : "Member"}
                </ThemedText>
              </View>
              {member.userId !== userId && member.role !== "admin" && (
                <TouchableOpacity
                  onPress={() => handleRemoveMember(member.userId)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <ThemedText style={styles.removeText}>Remove</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flex: 1, padding: 24 },
  backBtn: { marginBottom: 24 },
  backBtnText: { fontSize: 17, fontWeight: "500" },
  title: { marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#888", marginBottom: 32, lineHeight: 22 },
  codeCard: {
    borderWidth: 1,
    borderColor: "#e8e8e8",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    backgroundColor: "#fafafa",
    marginBottom: 20,
    
  },
  codeLabel: {
    fontSize: 13,
    color: "#aaa",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  code: { fontSize: 42, fontWeight: "700", letterSpacing: 6, lineHeight: -5 },
  btnRow: { flexDirection: "row", gap: 12, marginBottom: 36 },
  membersTitle: { fontSize: 16, marginBottom: 16 },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  memberId: { fontSize: 14, fontWeight: "500" },
  memberRole: { fontSize: 12, color: "#aaa", marginTop: 2 },
  removeText: { fontSize: 13, color: "#c62828", fontWeight: "600" },
});