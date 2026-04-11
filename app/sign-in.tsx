import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { authClient } from "@/lib/auth-client";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AuthScreen() {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const scheme = useColorScheme();
  const textColor = useThemeColor({}, "text");
  const bg = useThemeColor({}, "background");
  const surface = useThemeColor({}, "card");
  const border = useThemeColor({}, "border");
  const inputBg = useThemeColor({}, "inputBackground");
  const primary = useThemeColor({}, "tint");
  const muted = useThemeColor({}, "tabIconDefault");

  function friendlyError(code: string | undefined, message: string | undefined): string {
    switch (code) {
      case "INVALID_EMAIL":
        return "Please enter a valid email address."
      case "INVALID_PASSWORD":
        return "Incorrect password. Please try again."
      case "USER_NOT_FOUND":
        return "No account found with that email."
      case "EMAIL_NOT_VERIFIED":
        return "Please verify your email before signing in."
      case "USER_ALREADY_EXISTS":
        return "An account with this email already exists."
      case "PASSWORD_TOO_SHORT":
        return "Password must be at least 8 characters."
      case "INVALID_EMAIL_OR_PASSWORD":
        return "Incorrect email or password."
      default:
        return message ?? "Something went wrong. Please try again."
    }
  }

  const handleSignUp = async () => {
    if (!name.trim()) {
      setError("Please enter your full name.")
      return
    }
    if (!email.trim()) {
      setError("Please enter your email address.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    setError("")
    setLoading(true)
    try {
      const { error } = await authClient.signUp.email({ email, password, name })
      if (error) {
        setError(friendlyError(error.code, error.message))
      } else {
        router.push("/")
      }
    } catch (err: any) {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async () => {
    if (!email.trim()) {
      setError("Please enter your email address.")
      return
    }
    if (!password.trim()) {
      setError("Please enter your password.")
      return
    }
    setError("")
    setLoading(true)
    try {
      const { error } = await authClient.signIn.email({ email, password })
      if (error) {
        setError(friendlyError(error.code, error.message))
      } else {
        router.push("/")
      }
    } catch (err: any) {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleSwitchMode() {
    setMode(mode === "signIn" ? "signUp" : "signIn")
    setError("") // clear errors when switching modes
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: 200 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Image
                source={require("../assets/images/llamapicture.png")}
                style={{
                  width: 200,
                  height: 200,
                  resizeMode: "contain",
                  tintColor: scheme === "dark" ? "#FFFFFF" : "#1A1A1A",
                }}
              />
            </View>
          </View>
          <ThemedText style={styles.title}>Anamnesis</ThemedText>
          <ThemedText style={[styles.subtitle, { color: muted }]}>
            {mode === "signIn"
              ? "Sign in to your account to continue"
              : "Create a new account to get started"}
          </ThemedText>

          {/* Card */}
          <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
            {/* Full Name — only shown in sign up mode */}
            {mode === "signUp" && (
              <View style={styles.fieldGroup}>
                <ThemedText style={[styles.label, { color: muted }]}>
                  Full name
                </ThemedText>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor: border, backgroundColor: inputBg }]}
                  placeholder="Llama Smith"
                  placeholderTextColor={muted}
                  value={name}
                  onChangeText={(v) => { setName(v); setError("") }}
                  autoCapitalize="words"
                  textContentType="name"
                />
              </View>
            )}

            {/* Email */}
            <View style={styles.fieldGroup}>
              <ThemedText style={[styles.label, { color: muted }]}>
                Email address
              </ThemedText>
              <TextInput
                style={[styles.input, { color: textColor, borderColor: border, backgroundColor: inputBg }]}
                placeholder="jane@example.com"
                placeholderTextColor={muted}
                value={email}
                onChangeText={(v) => { setEmail(v); setError("") }}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
              />
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <ThemedText style={[styles.label, { color: muted }]}>
                  Password
                </ThemedText>
              </View>
              <TextInput
                style={[styles.input, { color: textColor, borderColor: border, backgroundColor: inputBg }]}
                placeholder="••••••••"
                placeholderTextColor={muted}
                value={password}
                onChangeText={(v) => { setPassword(v); setError("") }}
                secureTextEntry
                textContentType="password"
              />
            </View>

            {/* Error message */}
            {error ? (
              <View style={styles.errorBox}>
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              </View>
            ) : null}

            {/* Primary action button */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: textColor }, loading && styles.btnDisabled]}
                onPress={mode === "signIn" ? handleSignIn : handleSignUp}
                activeOpacity={0.85}
                disabled={loading}
              >
                <Text style={[styles.primaryText, { color: bg }]}>
                  {loading
                    ? mode === "signIn" ? "Signing in..." : "Creating account..."
                    : mode === "signIn" ? "Sign in" : "Create account"
                  }
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: border }]}
                onPress={handleSwitchMode}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.secondaryText, { color: textColor }]}>
                  {mode === "signIn" ? "Create account" : "Back to sign in"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <ThemedText style={[styles.footer, { color: muted }]}>
            By continuing, you agree to our{" "}
            <Link href="https://docs.google.com/document/d/1JPHBDM4U40Veynen6SHx0yxi2NxDyjNnZM6oySzvlv8/edit?tab=t.0" target="_blank">
              <Text style={{ color: textColor }}>Terms</Text> and{" "}
              <Text style={{ color: textColor }}>Privacy Policy</Text>
            </Link>
          </ThemedText>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    gap: 24,
  },
  header: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  iconWrap: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: "500" },
  subtitle: { fontSize: 15 },
  card: {
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 20,
    gap: 16,
  },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: "500" },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  input: {
    borderWidth: 0.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
  },
  errorBox: {
    backgroundColor: "#fff5f5",
    borderWidth: 1,
    borderColor: "#ffcdd2",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    color: "#c62828",
    fontSize: 14,
    lineHeight: 20,
  },
  actions: { gap: 10, marginTop: 4 },
  primaryBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.5 },
  primaryText: { fontSize: 15, fontWeight: "500" },
  secondaryBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 0.5,
  },
  secondaryText: { fontSize: 15, fontWeight: "500" },
  footer: {
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
  },
})