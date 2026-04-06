import { View, Text, StyleSheet } from "react-native";
import { colors } from "@/lib/theme";

interface PairingCardProps {
  title: string;
  vibe?: string;
}

export function PairingCard({ title, vibe }: PairingCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.desc}>
        <Text style={styles.title}>{title}</Text>
        {vibe && <Text style={styles.vibe}>{vibe}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 240,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    overflow: "hidden",
  },
  desc: {
    padding: 14,
  },
  title: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#999999",
    marginBottom: 4,
  },
  vibe: {
    fontFamily: "Inter_300Light",
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: "italic",
  },
});
