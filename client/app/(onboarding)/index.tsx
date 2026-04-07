import { useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  FlatList,
  type ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors, typography } from "@/lib/theme";
import { PillSelector } from "@/components/PillSelector";
import { useAppStore } from "@/lib/store";
import { useUpdateProfile } from "@/lib/hooks/use-profile";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    key: "1",
    title: "Photograph\nany item",
    subtitle: "From your closet, a store, or a screenshot",
  },
  {
    key: "2",
    title: "Get a stylist's\nhonest take",
    subtitle: "Scored, reviewed, and paired — in seconds",
  },
  {
    key: "3",
    title: "Build your\nstyle over time",
    subtitle: "Unlock your wardrobe, quiz, and new voices",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const setOnboardingComplete = useAppStore((s) => s.setOnboardingComplete);
  const updateProfile = useUpdateProfile();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [heightCm, setHeightCm] = useState<string | null>(null);
  const [build, setBuild] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index ?? 0);
      }
    },
  ).current;

  const heightMap: Record<string, number> = {
    "< 165cm": 160,
    "165–175cm": 170,
    "175–185cm": 180,
    "185cm +": 190,
  };

  const finish = async () => {
    if (heightCm || build || gender) {
      await updateProfile.mutateAsync({
        height_cm: heightCm ? heightMap[heightCm] ?? null : null,
        body_shape: build,
        gender_presentation: gender,
      });
    }
    setOnboardingComplete();
    router.replace("/(tabs)");
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      setShowProfile(true);
    }
  };

  if (showProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.profileContent}>
          <Text style={styles.profileTitle}>Help Juno know your fit</Text>
          <Text style={styles.profileSubtitle}>
            Optional — you can always add this later
          </Text>

          <View style={styles.profileForm}>
            <PillSelector
              label="Height"
              options={["< 165cm", "165–175cm", "175–185cm", "185cm +"]}
              selected={heightCm}
              onSelect={setHeightCm}
            />
            <PillSelector
              label="Build"
              options={["Slim", "Athletic", "Medium", "Broad"]}
              selected={build}
              onSelect={setBuild}
            />
            <PillSelector
              label="I usually shop"
              options={["Masc", "Femme", "Androgynous", "All"]}
              selected={gender}
              onSelect={setGender}
            />
          </View>
        </View>

        <View style={styles.bottomButtons}>
          <Pressable style={styles.skipButton} onPress={finish}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
          <Pressable style={styles.nextButton} onPress={finish}>
            <Text style={styles.nextText}>Get Started</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex && styles.dotActive]}
          />
        ))}
      </View>

      <View style={styles.bottomButtons}>
        <Pressable
          style={styles.skipButton}
          onPress={() => {
            setOnboardingComplete();
            router.replace("/(tabs)");
          }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
        <Pressable style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextText}>
            {currentIndex === SLIDES.length - 1 ? "Continue" : "Next"}
          </Text>
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
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  slideTitle: {
    ...typography.headline,
    fontSize: 36,
    lineHeight: 36 * 1.2,
    textAlign: "center",
    marginBottom: 16,
  },
  slideSubtitle: {
    ...typography.body,
    textAlign: "center",
    color: colors.textMuted,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.textPrimary,
    width: 20,
  },
  bottomButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.textMuted,
  },
  nextButton: {
    backgroundColor: colors.textPrimary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  nextText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: colors.background,
  },
  profileContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  profileTitle: {
    ...typography.headline,
    marginBottom: 8,
  },
  profileSubtitle: {
    ...typography.meta,
    marginBottom: 40,
  },
  profileForm: {
    gap: 8,
  },
});
