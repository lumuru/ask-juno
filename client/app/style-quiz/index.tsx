import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { colors, typography, spacing } from "@/lib/theme";
import { useAppStore } from "@/lib/store";
import { useUpdateProfile } from "@/lib/hooks/use-profile";

const { width } = Dimensions.get("window");
const COLUMN_COUNT = 2;
const GAP = 10;
const TILE_SIZE = (width - spacing.horizontalPadding * 2 - GAP) / COLUMN_COUNT;

const OUTFITS = [
  { id: "1", label: "Minimal Casual", color: "#2C3E50" },
  { id: "2", label: "Street Edge", color: "#1A1A2E" },
  { id: "3", label: "Classic Tailored", color: "#4A3728" },
  { id: "4", label: "Athleisure", color: "#2D4A3E" },
  { id: "5", label: "Boho Relaxed", color: "#5C4033" },
  { id: "6", label: "Monochrome", color: "#333333" },
  { id: "7", label: "Coastal Clean", color: "#4A6274" },
  { id: "8", label: "Vintage Mix", color: "#6B4423" },
  { id: "9", label: "Scandi Simple", color: "#8B8B7A" },
  { id: "10", label: "Bold Color", color: "#7A3B5E" },
];

const MIN_SELECTIONS = 5;

export default function StyleQuizScreen() {
  const router = useRouter();
  const quizSelections = useAppStore((s) => s.quizSelections);
  const toggleQuizSelection = useAppStore((s) => s.toggleQuizSelection);
  const resetQuizSelections = useAppStore((s) => s.resetQuizSelections);
  const updateProfile = useUpdateProfile();

  const handleFinish = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    await updateProfile.mutateAsync({
      style_quiz_completed_at: new Date().toISOString(),
    });

    resetQuizSelections();
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </View>

      <View style={styles.intro}>
        <Text style={styles.title}>Pick 5 outfits{"\n"}you'd wear</Text>
        <Text style={styles.subtitle}>
          This helps Juno understand your style
        </Text>
      </View>

      <FlatList
        data={OUTFITS}
        numColumns={COLUMN_COUNT}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = quizSelections.includes(item.id);
          return (
            <Pressable
              style={[
                styles.tile,
                { backgroundColor: item.color },
                isSelected && styles.tileSelected,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleQuizSelection(item.id);
              }}
            >
              <Text style={styles.tileLabel}>{item.label}</Text>
              {isSelected && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </Pressable>
          );
        }}
      />

      <View style={styles.bottom}>
        <Text style={styles.countText}>
          {quizSelections.length}/{MIN_SELECTIONS} selected
        </Text>
        <Pressable
          style={[
            styles.finishButton,
            quizSelections.length < MIN_SELECTIONS &&
              styles.finishButtonDisabled,
          ]}
          disabled={quizSelections.length < MIN_SELECTIONS}
          onPress={handleFinish}
        >
          <Text style={styles.finishButtonText}>Done</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.horizontalPadding,
    paddingVertical: 12,
  },
  backText: {
    fontFamily: "Inter_300Light",
    fontSize: 14,
    color: "#777777",
  },
  intro: {
    paddingHorizontal: spacing.horizontalPadding,
    marginBottom: 24,
  },
  title: {
    ...typography.headline,
    fontSize: 28,
    lineHeight: 28 * 1.2,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
  grid: {
    paddingHorizontal: spacing.horizontalPadding,
    paddingBottom: 100,
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE * 1.3,
    borderRadius: 12,
    justifyContent: "flex-end",
    padding: 12,
  },
  tileSelected: {
    borderWidth: 2,
    borderColor: colors.textPrimary,
  },
  tileLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  checkmark: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.textPrimary,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: {
    fontSize: 14,
    color: colors.background,
    fontWeight: "600",
  },
  bottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.horizontalPadding,
    paddingVertical: 16,
    paddingBottom: 40,
    backgroundColor: "rgba(13,13,13,0.95)",
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  countText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: colors.textMuted,
  },
  finishButton: {
    backgroundColor: colors.textPrimary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  finishButtonDisabled: {
    opacity: 0.3,
  },
  finishButtonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: colors.background,
  },
});
