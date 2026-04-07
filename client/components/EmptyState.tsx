import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors, typography } from "@/lib/theme";

export function EmptyState() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✦</Text>
      <Text style={styles.title}>Your style story{"\n"}starts here</Text>
      <Text style={styles.subtitle}>
        Scan your first item to get a stylist review
      </Text>
      <Pressable
        style={styles.button}
        onPress={() => router.push("/(tabs)/scan")}
      >
        <Text style={styles.buttonText}>Scan your first item</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  icon: {
    fontSize: 32,
    color: colors.textMuted,
    marginBottom: 24,
  },
  title: {
    ...typography.headline,
    fontSize: 28,
    lineHeight: 28 * 1.3,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 32,
  },
  button: {
    backgroundColor: colors.textPrimary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
  },
  buttonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: colors.background,
  },
});
