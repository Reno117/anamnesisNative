import { authClient } from "@/lib/auth-client";
import React, { useState } from "react";
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function AuthTestScreen() {
  const [email, setEmail] = useState("test@test.com");
  const [password, setPassword] = useState("password123");

  const handleSignUp = async () => {
    try {
      await authClient.signUp.email({ email, password, name: "" });
    } catch (err: any) {}
  };

  const handleSignIn = async () => {
    try {
      await authClient.signIn.email({ email, password });
    } catch (err: any) {}
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
