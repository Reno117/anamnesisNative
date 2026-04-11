import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { authClient } from "@/lib/auth-client";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { data: session, isPending } = authClient.useSession();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const [name, setName] = useState(session?.user?.name ?? "");
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [avatarUri] = useState<string | null>(session?.user?.image ?? null);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name ?? "");
      setEmail(session.user.email ?? "");
    }
  }, [session]);

  // ── Theme-aware colors ────────────────────────────────────────────────────
  const bg = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const mutedText = useThemeColor(
    { light: "#999999", dark: "#636366" },
    "tabIconDefault",
  );
  const faintText = useThemeColor(
    { light: "#aaaaaa", dark: "#48484a" },
    "tabIconDefault",
  );
  const surface = useThemeColor(
    { light: "#ffffff", dark: "#1c1c1e" },
    "background",
  );
  const inputBg = useThemeColor(
    { light: "#f5f5f5", dark: "#2c2c2e" },
    "background",
  );
  const border = useThemeColor({ light: "#ece9e3", dark: "#2c2c2e" }, "border");
  const dangerBg = useThemeColor(
    { light: "#FEE2E2", dark: "#3b1219" },
    "background",
  );
  const stripBg = useThemeColor({ light: "#1a1a1a", dark: "#0a0a0a" }, "text");
  const dangerText = "#DC2626";
  const accentBg = "#1a1a1a";
  const accentText = "#ffffff";
  // ─────────────────────────────────────────────────────────────────────────

  const initials = (name || email || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await authClient.updateUser({ name });
      setIsEditing(false);
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(session?.user?.name ?? "");
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    const confirmed =
      Platform.OS === "web"
        ? window.confirm("Are you sure you want to sign out?")
        : await new Promise<boolean>((resolve) => {
            Alert.alert("Sign out", "Are you sure you want to sign out?", [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => resolve(false),
              },
              {
                text: "Sign out",
                style: "destructive",
                onPress: () => resolve(true),
              },
            ]);
          });

    if (!confirmed) return;

    setIsSigningOut(true);
    try {
      await authClient.signOut();
    } catch (err: any) {
      if (Platform.OS === "web") {
        window.alert(err.message ?? "Failed to sign out.");
      } else {
        Alert.alert("Error", err.message ?? "Failed to sign out.");
      }
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed =
      Platform.OS === "web"
        ? window.confirm("Are you sure you want to delete the account")
        : await new Promise<boolean>((resolve) => {
            Alert.alert(
              "Delete account",
              "Are you sure you want to delete the account",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                  onPress: () => resolve(false),
                },
                {
                  text: "Delete Account",
                  style: "destructive",
                  onPress: () => resolve(true),
                },
              ],
            );
          });

    if (!confirmed) return;

    setIsSigningOut(true);
    try {
      await authClient.signOut();
    } catch (err: any) {
      if (Platform.OS === "web") {
        window.alert(err.message ?? "Failed to sign out.");
      } else {
        Alert.alert("Error", err.message ?? "Failed to sign out.");
      }
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isPending) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={accentBg} />
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: bg }]}>
        <ThemedText style={{ color: mutedText, fontSize: 16 }}>
          Not signed in.
        </ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: bg }]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: bg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header strip */}
        <View style={[styles.headerStrip, { backgroundColor: stripBg }]}>
          <Text style={styles.pageTitle}>Profile</Text>
        </View>

        {/* Avatar */}
        <View style={[styles.avatarWrapper, { backgroundColor: bg }]}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={[styles.avatar, { borderColor: bg }]}
            />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarPlaceholder,
                { borderColor: bg },
              ]}
            >
              <Text style={styles.initials}>{initials}</Text>
            </View>
          )}
        </View>

        {/* Name / email display */}
        {!isEditing && (
          <View style={styles.nameBlock}>
            <ThemedText style={styles.displayName}>
              {name || "No name set"}
            </ThemedText>
            <ThemedText style={[styles.displayEmail, { color: mutedText }]}>
              {email}
            </ThemedText>
          </View>
        )}

        {/* Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: surface, borderColor: border },
          ]}
        >
          {isEditing ? (
            <>
              <ThemedText style={[styles.cardTitle, { color: mutedText }]}>
                Edit Profile
              </ThemedText>

              <ThemedText style={[styles.label, { color: mutedText }]}>
                Name
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputBg,
                    borderColor: border,
                    color: textColor,
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={mutedText}
                autoCapitalize="words"
              />

              <ThemedText style={[styles.label, { color: mutedText }]}>
                Email
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputBg,
                    borderColor: border,
                    color: faintText,
                  },
                ]}
                value={email}
                editable={false}
              />
              <ThemedText style={[styles.hint, { color: faintText }]}>
                Email cannot be changed here.
              </ThemedText>

              <View style={styles.rowButtons}>
                <TouchableOpacity
                  style={[
                    styles.btn,
                    {
                      borderWidth: 1,
                      borderColor: border,
                      backgroundColor: "transparent",
                    },
                  ]}
                  onPress={handleCancel}
                  disabled={isSaving}
                >
                  <ThemedText
                    style={{
                      fontWeight: "500",
                      fontSize: 15,
                      color: textColor,
                    }}
                  >
                    Cancel
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.btn,
                    { backgroundColor: accentBg, opacity: isSaving ? 0.6 : 1 },
                  ]}
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={accentText} />
                  ) : (
                    <Text
                      style={{
                        fontWeight: "600",
                        fontSize: 15,
                        color: accentText,
                      }}
                    >
                      Save
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <ThemedText style={[styles.cardTitle, { color: mutedText }]}>
                Account
              </ThemedText>

              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: mutedText }]}>
                  Name
                </ThemedText>
                <ThemedText style={[styles.infoValue, { color: textColor }]}>
                  {name || "—"}
                </ThemedText>
              </View>
              <View style={[styles.divider, { backgroundColor: border }]} />
              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: mutedText }]}>
                  Email
                </ThemedText>
                <ThemedText style={[styles.infoValue, { color: textColor }]}>
                  {email}
                </ThemedText>
              </View>

              <TouchableOpacity
                style={[
                  styles.btn,
                  { backgroundColor: accentBg, marginTop: 20 },
                ]}
                onPress={() => setIsEditing(true)}
              >
                <Text
                  style={{ fontWeight: "600", fontSize: 15, color: accentText }}
                >
                  Edit Profile
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={[
            styles.btnWide,
            { backgroundColor: dangerBg, opacity: isSigningOut ? 0.6 : 1 },
          ]}
          onPress={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <ActivityIndicator size="small" color={dangerText} />
          ) : (
            <Text
              style={{ fontWeight: "600", fontSize: 15, color: dangerText }}
            >
              Sign out
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.btnWide,
            { backgroundColor: dangerBg, opacity: isSigningOut ? 0.6 : 1 },
          ]}
          onPress={handleDeleteAccount}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <ActivityIndicator size="small" color={dangerText} />
          ) : (
            <Text
              style={{ fontWeight: "600", fontSize: 15, color: dangerText }}
            >
              Delete Account
            </Text>
          )}
        </TouchableOpacity>

        {session.session?.createdAt && (
          <ThemedText style={[styles.footer, { color: faintText }]}>
            Signed in since{" "}
            {new Date(session.session.createdAt).toLocaleDateString()}
          </ThemedText>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { alignItems: "center", paddingBottom: 48 },

  headerStrip: {
    width: "100%",
    height: 110,
    justifyContent: "flex-end",
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.8,
    color: "#ffffff",
  },

  avatarWrapper: {
    marginTop: -48,
    marginBottom: 12,
    alignItems: "center",
    paddingTop: 4,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
  },
  avatarPlaceholder: {
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    fontSize: 34,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 1,
  },

  nameBlock: { alignItems: "center", marginBottom: 20, paddingHorizontal: 24 },
  displayName: { fontSize: 22, fontWeight: "700", letterSpacing: -0.3 },
  displayEmail: { fontSize: 14, marginTop: 3 },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    width: "90%",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 14,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  infoLabel: { fontSize: 14, fontWeight: "500" },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    maxWidth: "65%",
    textAlign: "right",
  },
  divider: { height: 1 },

  label: { fontSize: 13, fontWeight: "500", marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
  },
  hint: { fontSize: 12, marginTop: 4 },

  rowButtons: { flexDirection: "row", gap: 10, marginTop: 20 },
  btn: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  btnWide: {
    borderRadius: 20,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    width: "90%",
    marginBottom: 12,
  },

  footer: { fontSize: 12, marginTop: 4 },
});
