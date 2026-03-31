import { ThemedText } from "@/components/themed-text";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useRef, useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";

export default function HomeScreen() {
  const tasks = useQuery(api.tasks.get);
  const newVerse = useMutation(api.tasks.update)
  const ref = useRef<TextInput>(null);
  const [text, setText] = useState('');


  const onAddVerse = () => newVerse({
            body: text
          })

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

      <TextInput
        placeholder="Add a verse!"
        onChangeText={newText => setText(newText)}
        defaultValue={text}
        style={{
          height: 40,
          padding: 5,
          marginHorizontal: 8,
          borderWidth: 1,
        }}
      />

      <Button
        title="add-verse"
        onPress={onAddVerse}
      />


      
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
