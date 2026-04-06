import { View, Text, StyleSheet } from "react-native";
import { colors, typography, scoreColor } from "@/lib/theme";

interface ScoreDisplayProps {
  score: number;
}

export function ScoreDisplay({ score }: ScoreDisplayProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.score, { color: scoreColor(score) }]}>
        {score.toFixed(1)}
      </Text>
      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  score: {
    ...typography.score,
    lineHeight: 72,
  },
  rule: {
    width: 32,
    height: 1,
    backgroundColor: "#333333",
    marginTop: 12,
  },
});
