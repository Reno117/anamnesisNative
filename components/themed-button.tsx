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

type ButtonVariant = "default" | "outline" | "destructive";

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
  };

  const current = variantStyles[variant];

  return (
    <TouchableOpacity
      style={[
        styles.base,
        {
          backgroundColor: current.backgroundColor,
          borderColor: current.borderColor,
        },
        disabled && styles.disabled,
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
  text: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  disabled: {
    opacity: 0.4,
  },
});
