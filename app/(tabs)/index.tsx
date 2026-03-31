import { ThemedText } from "@/components/themed-text";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const tasks = useQuery(api.tasks.get);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {tasks?.map(({ _id, verse }) => (
        <ThemedText key={_id}>{verse}</ThemedText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
