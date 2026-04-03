import { View, Button, ScrollView } from "react-native";
import * as Haptics from "expo-haptics";

const delay = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * 🔥 Custom Patterns
 */

// 1. Fintech-style success pulse (Strike-like)
const successPulse = async () => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  await delay(40);

  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  await delay(40);
  
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  await delay(30);

  await Haptics.notificationAsync(
    Haptics.NotificationFeedbackType.Success
  );
};

// 2. Snap + Glow (sharp then smooth)
const snapGlow = async () => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
  await delay(30);

  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
};

// 3. Heavy Commit (big action)
const heavyCommit = async () => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  await delay(60);

  await Haptics.notificationAsync(
    Haptics.NotificationFeedbackType.Success
  );
};

// 4. Double Tap Reward
const doubleReward = async () => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  await delay(50);

  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

export default function HapticsTest() {
  return (
    <ScrollView contentContainerStyle={{ padding: 40, gap: 12 }}>
      
      {/* 🔹 Basic Expo Haptics */}
      <Button
        title="Selection"
        onPress={() => Haptics.selectionAsync()}
      />

      <Button
        title="Impact Light"
        onPress={() =>
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        }
      />

      <Button
        title="Impact Medium"
        onPress={() =>
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        }
      />

      <Button
        title="Impact Heavy"
        onPress={() =>
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
        }
      />

      <Button
        title="Success Notification"
        onPress={() =>
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          )
        }
      />

      <Button
        title="Error Notification"
        onPress={() =>
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
          )
        }
      />

      {/* 🔥 Custom Premium Patterns */}
      <Button
        title="🔥 Success Pulse (Fintech Style)"
        onPress={successPulse}
      />

      <Button
        title="✨ Snap + Glow"
        onPress={snapGlow}
      />

      <Button
        title="💪 Heavy Commit"
        onPress={heavyCommit}
      />

      <Button
        title="👆 Double Tap Reward"
        onPress={doubleReward}
      />
      
    </ScrollView>
  );
}