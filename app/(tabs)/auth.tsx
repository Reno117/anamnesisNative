import { Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuthActions } from "@convex-dev/auth/react";

export default function authCheck() {
    const { signIn, signOut } = useAuthActions();

    return (
    
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
    <Button title="login" onPress={
        () => {
            signIn("google" ,{ redirectTo: "http://localhost:8081" })
        }
    }/>
</View>
)
} 