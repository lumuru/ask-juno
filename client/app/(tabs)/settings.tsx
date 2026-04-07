import { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing } from "@/lib/theme";
import { useAuth } from "@/lib/auth-provider";
import { useProfile, useUpdateProfile } from "@/lib/hooks/use-profile";
import { useVoices } from "@/lib/hooks/use-voices";
import { useUnlocks } from "@/lib/hooks/use-unlocks";
import { PillSelector } from "@/components/PillSelector";
import { Divider } from "@/components/Divider";
import { supabase } from "@/lib/supabase";

const HEIGHT_MAP: Record<string, number> = {
  "< 165cm": 160,
  "165–175cm": 170,
  "175–185cm": 180,
  "185cm +": 190,
};

const REVERSE_HEIGHT_MAP: Record<number, string> = Object.fromEntries(
  Object.entries(HEIGHT_MAP).map(([label, cm]) => [cm, label]),
);

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: voices } = useVoices();
  const { data: unlocks } = useUnlocks();
  const updateProfile = useUpdateProfile();

  const voiceSwapUnlocked = unlocks?.unlocks.some(
    (u) => u.feature === "voice_swap_hint",
  );

  const handleExportData = async () => {
    const { data, error } = await supabase.functions.invoke("export-account");
    if (error) {
      Alert.alert("Error", "Failed to export data");
      return;
    }
    Alert.alert("Data Exported", "Your data has been prepared for download.");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete all your data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.functions.invoke(
              "delete-account",
              { body: { confirm: true } },
            );
            if (error) {
              Alert.alert("Error", "Failed to delete account");
              return;
            }
            await signOut();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Profile</Text>
          <PillSelector
            label="Height"
            options={["< 165cm", "165–175cm", "175–185cm", "185cm +"]}
            selected={
              profile?.height_cm ? REVERSE_HEIGHT_MAP[profile.height_cm] ?? null : null
            }
            onSelect={(val) => {
              updateProfile.mutate({ height_cm: HEIGHT_MAP[val] ?? null });
            }}
          />
          <PillSelector
            label="Build"
            options={["Slim", "Athletic", "Medium", "Broad"]}
            selected={profile?.body_shape ?? null}
            onSelect={(val) => updateProfile.mutate({ body_shape: val })}
          />
          <PillSelector
            label="I usually shop"
            options={["Masc", "Femme", "Androgynous", "All"]}
            selected={profile?.gender_presentation ?? null}
            onSelect={(val) =>
              updateProfile.mutate({ gender_presentation: val })
            }
          />
        </View>

        <Divider />

        {/* Voice Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Stylist Voice</Text>
          {voices?.map((voice) => {
            const isActive = profile?.stylist_voice_id === voice.id;
            const isLocked = !voiceSwapUnlocked && !voice.is_default;

            return (
              <Pressable
                key={voice.id}
                style={[
                  styles.voiceRow,
                  isActive && styles.voiceRowActive,
                  isLocked && styles.voiceRowLocked,
                ]}
                disabled={isLocked}
                onPress={() =>
                  updateProfile.mutate({ stylist_voice_id: voice.id })
                }
              >
                <View>
                  <Text
                    style={[
                      styles.voiceName,
                      isLocked && styles.voiceNameLocked,
                    ]}
                  >
                    {voice.name}
                  </Text>
                  <Text style={styles.voiceDesc}>{voice.description}</Text>
                </View>
                {isActive && <Text style={styles.activeIndicator}>●</Text>}
                {isLocked && (
                  <Text style={styles.lockText}>
                    {unlocks
                      ? `${unlocks.total_reviews}/5 reviews`
                      : "Locked"}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        <Divider />

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Account</Text>
          <Pressable style={styles.accountRow} onPress={handleExportData}>
            <Text style={styles.accountRowText}>Export my data</Text>
          </Pressable>
          <Pressable style={styles.accountRow} onPress={handleDeleteAccount}>
            <Text style={[styles.accountRowText, styles.destructiveText]}>
              Delete account
            </Text>
          </Pressable>
          <Pressable style={styles.accountRow} onPress={signOut}>
            <Text style={styles.accountRowText}>Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.headline,
    fontSize: 20,
    paddingHorizontal: spacing.horizontalPadding,
    paddingTop: 12,
    paddingBottom: 24,
  },
  section: {
    paddingHorizontal: spacing.horizontalPadding,
    paddingVertical: spacing.sectionPadding,
  },
  sectionHeader: {
    ...typography.sectionHeader,
    marginBottom: 16,
  },
  voiceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  voiceRowActive: {
    borderBottomColor: colors.scoreGreen,
  },
  voiceRowLocked: {
    opacity: 0.4,
  },
  voiceName: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  voiceNameLocked: {
    color: colors.textMuted,
  },
  voiceDesc: {
    fontFamily: "Inter_300Light",
    fontSize: 12,
    color: colors.textMuted,
  },
  activeIndicator: {
    color: colors.scoreGreen,
    fontSize: 10,
  },
  lockText: {
    fontFamily: "Inter_300Light",
    fontSize: 11,
    color: colors.textMuted,
  },
  accountRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  accountRowText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.textSecondary,
  },
  destructiveText: {
    color: colors.scoreAmber,
  },
});
