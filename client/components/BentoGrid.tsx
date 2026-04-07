import { View, StyleSheet } from "react-native";
import { BentoTile } from "./BentoTile";
import type { Review } from "@/lib/hooks/use-reviews";

interface BentoGridProps {
  reviews: Review[];
}

export function BentoGrid({ reviews }: BentoGridProps) {
  if (reviews.length === 0) return null;

  const [latest, ...rest] = reviews;

  const rows: Review[][] = [];
  for (let i = 0; i < rest.length; i += 2) {
    rows.push(rest.slice(i, i + 2));
  }

  return (
    <View style={styles.container}>
      <BentoTile review={latest} large />
      {rows.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((review) => (
            <BentoTile key={review.id} review={review} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    padding: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
});
