import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-provider";
import { colors, typography } from "@/lib/theme";

export default function SignInScreen() {
  const { signInWithApple, signInWithGoogle, signInAnonymously } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Juno</Text>
        <Text style={styles.subtitle}>Your AI stylist</Text>
      </View>

      <View style={styles.buttons}>
        <Pressable
          style={[styles.button, styles.buttonApple]}
          onPress={signInWithApple}
        >
          <Text style={[styles.buttonText, styles.buttonTextDark]}>
            Continue with Apple
          </Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.buttonGoogle]}
          onPress={signInWithGoogle}
        >
          <Text style={styles.buttonText}>Continue with Google</Text>
        </Pressable>

        <Pressable style={styles.skipButton} onPress={signInAnonymously}>
          <Text style={styles.skipText}>Try without an account</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    ...typography.headline,
    fontSize: 48,
    lineHeight: 48 * 1.1,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.meta,
    fontSize: 14,
  },
  buttons: {
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonApple: {
    backgroundColor: colors.textPrimary,
  },
  buttonGoogle: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: colors.textPrimary,
  },
  buttonTextDark: {
    color: colors.background,
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  skipText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: colors.textMuted,
  },
});
