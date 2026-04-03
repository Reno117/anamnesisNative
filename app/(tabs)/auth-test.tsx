import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, ScrollView } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";

export default function AuthTestScreen() {
  const [email, setEmail] = useState("test@test.com");
  const [password, setPassword] = useState("password123");
  const [log, setLog] = useState<string[]>([]);

  const user = useQuery(api.auth.getCurrentUser);
  const { data: session, isPending } = authClient.useSession();

  const addLog = (msg: string) => {
    setLog((prev) => [msg, ...prev]);
    console.log(msg);
  };

  const handleSignUp = async () => {
    try {
      await authClient.signUp.email({ email, password, name: ""});
      addLog("✅ Signed up successfully");
    } catch (err: any) {
      addLog("❌ Sign up error: " + err.message);
    }
  };

  const handleSignIn = async () => {
    try {
      await authClient.signIn.email({ email, password });
      addLog("✅ Signed in successfully");
    } catch (err: any) {
      addLog("❌ Sign in error: " + err.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      addLog("👋 Signed out");
    } catch (err: any) {
      addLog("❌ Sign out error: " + err.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Auth Test Page</Text>

      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />

      <View style={styles.buttonGroup}>
        <Button title="Sign Up" onPress={handleSignUp} />
        <Button title="Sign In" onPress={handleSignIn} />
        {/*<Button title="Sign In (oAuth)" onPress={() => {
          authClient.signIn.social({provider: "google"})
        }} />
         This is not working at the moment
         */}
        <Button title="Sign Out" onPress={handleSignOut} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Session</Text>
        <Text>{isPending ? "Loading..." : JSON.stringify(session, null, 2)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Convex User</Text>
        <Text>{JSON.stringify(user, null, 2)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Logs</Text>
        {log.map((l, i) => (
          <Text key={i} style={styles.logText}>{l}</Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
  },
  buttonGroup: {
    gap: 10,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  logText: {
    fontSize: 12,
    marginBottom: 2,
  },
});
