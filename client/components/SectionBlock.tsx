import { View, Text, StyleSheet } from "react-native";
import { colors, typography, spacing } from "@/lib/theme";

interface SectionBlockProps {
  header: string;
  body: string;
  isFinalWord?: boolean;
  priceEstimate?: string | null;
}

export function SectionBlock({
  header,
  body,
  isFinalWord = false,
  priceEstimate,
}: SectionBlockProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.header}>{header}</Text>
      <Text style={isFinalWord ? styles.finalWordBody : styles.body}>
        {body}
      </Text>
      {priceEstimate && (
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>{priceEstimate}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: spacing.sectionPadding,
    paddingHorizontal: spacing.horizontalPadding,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  header: {
    ...typography.sectionHeader,
    marginBottom: 10,
  },
  body: {
    ...typography.body,
  },
  finalWordBody: {
    ...typography.finalWord,
  },
  priceTag: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 3,
    marginTop: 10,
  },
  priceText: {
    ...typography.meta,
  },
});
