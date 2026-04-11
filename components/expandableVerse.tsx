import { useEffect, useRef, useCallback } from "react"
import * as Haptics from "expo-haptics";
import { View, StyleSheet, TouchableOpacity, useColorScheme } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetModalProvider,
} from "@gorhom/bottom-sheet"
import { ThemedText } from "@/components/themed-text"
import { ThemedButton } from "@/components/themed-button"
import { SafeAreaView } from "react-native-safe-area-context"
import { useThemeColor } from "@/hooks/use-theme-color"
import { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";

type ExpandableVerseProps = {
    verse: Doc<"verses">,
    children: ReactNode,
    style: StyleProp<ViewStyle>,

}
export function ExpandableVerse({
  verse,
  children,
  style,
}: ExpandableVerseProps) {
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const scheme = useColorScheme();

  // ── Theme tokens ──────────────────────────────────────────────
  const surface = useThemeColor(
    { light: "#ffffff", dark: "#1c1c1e" },
    "background",
  );
  const border = useThemeColor({ light: "#ece9e3", dark: "#2c2c2e" }, "border");
  const textMuted = useThemeColor(
    { light: "#aaaaaa", dark: "#636366" },
    "tabIconDefault",
  );
  const dividerColor = useThemeColor(
    { light: "#f0f0f0", dark: "#2c2c2e" },
    "border",
  );
  const iconBg = useThemeColor(
    { light: "#f5f5f5", dark: "#2c2c2e" },
    "background",
  );
  const handleColor = useThemeColor(
    { light: "#dddddd", dark: "#3a3a3c" },
    "border",
  );
  const shadow = scheme === "dark" ? "transparent" : "#000";

  const ref = verse
    ? `${verse.book} ${verse.chapter}:${verse.verseStart}${verse.verseEnd ? `–${verse.verseEnd}` : ""}`
    : "";

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    [],
  );

  function goToMode(mode: "first-letter" | "full-verse") {
    bottomSheetRef.current?.dismiss();
    router.replace({
      pathname:
        mode === "first-letter"
          ? "/(app)/(protected)/practice-first-letter"
          : "/(app)/(protected)/practice-full-verse",
      params: { verse: verse._id },
    });
  }
  return (
    <>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          bottomSheetRef.current?.present();
        }}
        style={style}
        activeOpacity={0.9}
      >
        {children}
      </TouchableOpacity>

      <BottomSheetModal
        ref={bottomSheetRef}
        enableDynamicSizing
        snapPoints={[]}
        maxDynamicContentSize={650}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={[styles.handle, { backgroundColor: handleColor }]}
        backgroundStyle={{ backgroundColor: surface, shadowColor: shadow }}
        enablePanDownToClose
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <SafeAreaView edges={["bottom"]}>
            <ThemedText type="defaultSemiBold" style={styles.ref}>
              {ref}
            </ThemedText>

            <ThemedText type="defaultSemiBold" style={styles.verseText}>
              {verse?.text}
            </ThemedText>

            <View style={[styles.divider, { backgroundColor: dividerColor }]} />

            <ThemedText
              type="defaultSemiBold"
              style={[styles.practiceLabel, { color: textMuted }]}
            >
              Choose a practice mode
            </ThemedText>

            <TouchableOpacity
              style={[styles.modeCard, { borderColor: border }]}
              onPress={() => goToMode("first-letter")}
              activeOpacity={0.7}
            >
              <View style={[styles.modeIcon, { backgroundColor: iconBg }]}>
                <ThemedText style={styles.modeIconText}>A</ThemedText>
              </View>
              <View style={styles.modeInfo}>
                <ThemedText type="defaultSemiBold" style={styles.modeTitle}>
                  First Letter
                </ThemedText>
                <ThemedText style={[styles.modeSubtitle, { color: textMuted }]}>
                  Type the first letter of each word
                </ThemedText>
              </View>
              <ThemedText style={[styles.modeChevron, { color: textMuted }]}>
                ›
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeCard, { borderColor: border }]}
              onPress={() => goToMode("full-verse")}
              activeOpacity={0.7}
            >
              <View style={[styles.modeIcon, { backgroundColor: iconBg }]}>
                <ThemedText style={styles.modeIconText}>≡</ThemedText>
              </View>
              <View style={styles.modeInfo}>
                <ThemedText type="defaultSemiBold" style={styles.modeTitle}>
                  Full Verse
                </ThemedText>
                <ThemedText style={[styles.modeSubtitle, { color: textMuted }]}>
                  Type the entire verse from memory
                </ThemedText>
              </View>
              <ThemedText style={[styles.modeChevron, { color: textMuted }]}>
                ›
              </ThemedText>
            </TouchableOpacity>

            <View style={styles.cancelRow}>
              <ThemedButton
                variant="outline"
                onPress={() => bottomSheetRef.current?.dismiss()}
              >
                Cancel
              </ThemedButton>
            </View>
          </SafeAreaView>
        </BottomSheetScrollView>
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  handle: { width: 36, height: 4, borderRadius: 2 },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  ref: { fontSize: 18, marginBottom: 10 },
  verseText: { fontSize: 15, lineHeight: 24, marginBottom: 16 },
  divider: { height: 1, marginBottom: 16 },
  practiceLabel: {
    fontSize: 13,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modeCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  modeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modeIconText: { fontSize: 18, fontWeight: "700" },
  modeInfo: { flex: 1 },
  modeTitle: { fontSize: 15 },
  modeSubtitle: { fontSize: 13, marginTop: 2 },
  modeChevron: { fontSize: 22 },
  cancelRow: { flexDirection: "row", marginTop: 8 },
});