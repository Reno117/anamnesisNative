import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { authClient } from "@/lib/auth-client";
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
  const [name, setName] = useState("test");
  const [email, setEmail] = useState("test@test.com");
  const [password, setPassword] = useState("password123");
  {
    /*  CHANGE THIS DEFAULT STATE   */
  }
  const scheme = useColorScheme();

  const textColor = useThemeColor({}, "text");
  const bg = useThemeColor({}, "background");
  const surface = useThemeColor({}, "card"); // card surface, not text
  const border = useThemeColor({}, "border");
  const inputBg = useThemeColor({}, "inputBackground"); // or secondary surface
  const primary = useThemeColor({}, "tint");
  const muted = useThemeColor({}, "tabIconDefault");

  const handleSignUp = async () => {
    try {
      await authClient.signUp.email({ email, password, name });
    } catch (err) {}
  };

  const handleSignIn = async () => {
    try {
      await authClient.signIn.email({ email, password });
    } catch (err) {}
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconWrap]}>
              <Image
                source={require("../../assets/images/llamapicture.png")}
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
            Sign in to your account to continue
          </ThemedText>

          {/* Card */}
          <View
            style={[
              styles.card,
              { backgroundColor: surface, borderColor: border },
            ]}
          >
            {/* Name */}
            <View style={styles.fieldGroup}>
              <ThemedText style={[styles.label, { color: muted }]}>
                Full name
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: textColor,
                    borderColor: border,
                    backgroundColor: inputBg,
                  },
                ]}
                placeholder="Llama Smith"
                placeholderTextColor={muted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                textContentType="name"
              />
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <ThemedText style={[styles.label, { color: muted }]}>
                Email address
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: textColor,
                    borderColor: border,
                    backgroundColor: inputBg,
                  },
                ]}
                placeholder="jane@example.com"
                placeholderTextColor={muted}
                value={email}
                onChangeText={setEmail}
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
                <TouchableOpacity>
                  <ThemedText style={[styles.forgotText, { color: muted }]}>
                    Forgot password?
                  </ThemedText>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: textColor,
                    borderColor: border,
                    backgroundColor: inputBg,
                  },
                ]}
                placeholder="••••••••"
                placeholderTextColor={muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
              />
            </View>

            {/* Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: textColor }]}
                onPress={handleSignIn}
                activeOpacity={0.85}
              >
                <Text style={[styles.primaryText, { color: bg }]}>Sign in</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: border }]}
                onPress={handleSignUp}
                activeOpacity={0.7}
              >
                <ThemedText
                  style={[styles.secondaryText, { color: textColor }]}
                >
                  Create account
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <ThemedText style={[styles.footer, { color: muted }]}>
            By continuing, you agree to our{" "}
            <Text style={{ color: textColor }}>Terms</Text> and{" "}
            <Text style={{ color: textColor }}>Privacy Policy</Text>
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
  // header: {
  //   gap: 6,
  //   marginBottom: 4,
  // },

  header: {
    flex: 1, // fill the available space
    justifyContent: "center", // vertical center
    alignItems: "center", // horizontal center
    padding: 20,
  },
  iconWrap: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "500",
  },
  subtitle: {
    fontSize: 15,
  },
  card: {
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 20,
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotText: {
    fontSize: 13,
  },
  input: {
    borderWidth: 0.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
  primaryBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryText: {
    fontSize: 15,
    fontWeight: "500",
  },
  secondaryBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 0.5,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: "500",
  },
  footer: {
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
  },
});
