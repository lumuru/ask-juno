import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "@/lib/theme";

interface PillSelectorProps {
  label: string;
  options: string[];
  selected: string | null;
  onSelect: (value: string) => void;
}

export function PillSelector({
  label,
  options,
  selected,
  onSelect,
}: PillSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pills}>
        {options.map((option) => (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            style={[
              styles.pill,
              selected === option && styles.pillSelected,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                selected === option && styles.pillTextSelected,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 0.16 * 9,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillSelected: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  pillText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: colors.textMuted,
  },
  pillTextSelected: {
    color: colors.background,
  },
});
