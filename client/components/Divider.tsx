import { View, StyleSheet } from "react-native";
import { colors, spacing } from "@/lib/theme";

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.horizontalPadding,
  },
});
