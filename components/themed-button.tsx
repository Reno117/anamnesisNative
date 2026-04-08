import {
  StyleSheet,
  Text,
  TouchableOpacity,
  type GestureResponderEvent,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";
import { useColorScheme } from "react-native";

type ButtonVariant = "default" | "outline" | "destructive" | "add";

export type ThemedButtonProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: ButtonVariant;
  style?: TextStyle;
  containerStyle?: ViewStyle;
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
};

export function ThemedButton({
  style,
  containerStyle,
  lightColor,
  darkColor,
  variant = "default",
  children,
  onPress, // ← pulled out of ...rest
  onLongPress, // ← pulled out of ...rest
  disabled, // ← pulled out of ...rest
  ...rest // now only Text props remain
}: ThemedButtonProps) {
  const textColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "text",
  );
  const background = useThemeColor({}, "background");
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const variantStyles = {
    default: {
      backgroundColor: textColor,
      borderColor: textColor,
      textColor: background,
    },
    outline: {
      backgroundColor: "transparent",
      borderColor: textColor,
      textColor: textColor,
    },
    destructive: {
      backgroundColor: "#ef4444",
      borderColor: "#ef4444",
      textColor: "#ffffff",
    },
    add: {
      backgroundColor: isDark ? "#ffffff" : "#111111",
      borderColor: isDark ? "#ffffff" : "#111111",
      textColor: isDark ? "#111111" : "#ffffff",
    },
  };

  const current = variantStyles[variant];

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variant === "add" && styles.addBase, // 👈 override layout
        {
          backgroundColor: current.backgroundColor,
          borderColor: current.borderColor,
        },
       // disabled && styles.disabled,
        containerStyle,
      ]}
      activeOpacity={0.8}
      onPress={onPress} // ← now correctly on the touchable
      onLongPress={onLongPress} // ← same
      disabled={disabled} // ← same
    >
      <Text
        style={[styles.text, { color: current.textColor }, style]}
        {...rest} // only Text-safe props now
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  base: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  addBase: {
    position: "absolute",
    bottom: 20,
    right: 20,

    flex: 0, // 👈 overrides flex:1
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 30,

    // shadow
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  text: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },

  disabled: {
    opacity: 0.4,
  },
});