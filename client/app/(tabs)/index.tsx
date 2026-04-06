import { ScrollView, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography } from "@/lib/theme";
import { useReviews } from "@/lib/hooks/use-reviews";
import { EmptyState } from "@/components/EmptyState";
import { BentoGrid } from "@/components/BentoGrid";

export default function HomeScreen() {
  const { data: reviews, isLoading } = useReviews();

  const hasReviews = reviews && reviews.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {!isLoading && !hasReviews ? (
        <EmptyState />
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.header}>Juno</Text>
          {hasReviews && <BentoGrid reviews={reviews} />}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  header: {
    ...typography.headline,
    fontSize: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
});
