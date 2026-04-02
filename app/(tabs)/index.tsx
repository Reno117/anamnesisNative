import { ThemedText } from "@/components/themed-text";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useRef, useState } from "react";
import { Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { CircleX } from 'lucide-react-native';


export default function HomeScreen() {
  const tasks = useQuery(api.tasks.get);
  const me = useQuery(api.tasks.getMe);
  const newVerse = useMutation(api.tasks.update)
  const removeVerse = useMutation(api.tasks.removeVerse)
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
      <ThemedText>Hello {me?.name} ...</ThemedText>
      {tasks?.map(({ _id, verse }) => (
        <View>
        <ThemedText key={_id}>{verse}</ThemedText>
        <TouchableOpacity onPress={() => {
        removeVerse({
          id: _id
        })
      }}>
            <CircleX color="red" size={48} />

        </TouchableOpacity>
        

        </View>
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
