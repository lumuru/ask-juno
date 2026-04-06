import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { colors, typography } from "@/lib/theme";
import { useScan } from "@/lib/hooks/use-scan";
import { useCheckUnlocks } from "@/lib/hooks/use-unlocks";
import { PillSelector } from "@/components/PillSelector";

type ScanContext = "store" | "online" | "home";

export default function ScanScreen() {
  const router = useRouter();
  const scan = useScan();
  const checkUnlocks = useCheckUnlocks();
  const [context, setContext] = useState<ScanContext>("online");

  const pickImage = async (fromCamera: boolean) => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
    };

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled || !result.assets[0]) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const reviewData = await scan.mutateAsync({
        imageUri: result.assets[0].uri,
        context,
      });

      await checkUnlocks.mutateAsync();

      if (reviewData?.id) {
        router.push(`/review/${reviewData.id}`);
      }
    } catch (_error) {
      // Error is available via scan.error
    }
  };

  if (scan.isPending) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.textPrimary} size="large" />
          <Text style={styles.loadingText}>Your stylist is reviewing...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <Text style={styles.title}>Scan an item</Text>
        <Text style={styles.subtitle}>
          Choose a photo from your gallery or take a new one
        </Text>

        <View style={styles.contextSection}>
          <PillSelector
            label="Where is this item?"
            options={["Online", "Store", "Home"]}
            selected={
              context === "online"
                ? "Online"
                : context === "store"
                  ? "Store"
                  : "Home"
            }
            onSelect={(val) =>
              setContext(val.toLowerCase() as ScanContext)
            }
          />
        </View>

        <View style={styles.buttons}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => pickImage(false)}
          >
            <Text style={styles.primaryButtonText}>Choose from gallery</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => pickImage(true)}
          >
            <Text style={styles.secondaryButtonText}>Take a photo</Text>
          </Pressable>
        </View>

        {scan.isError && (
          <Text style={styles.errorText}>
            Something went wrong. Please try again.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    ...typography.headline,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: 40,
  },
  contextSection: {
    marginBottom: 40,
  },
  buttons: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.textPrimary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: colors.background,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceElevated,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
  },
  errorText: {
    ...typography.meta,
    color: colors.scoreAmber,
    textAlign: "center",
    marginTop: 20,
  },
});
