import { Pressable, Text, View, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors, typography, scoreColor } from "@/lib/theme";
import type { Review } from "@/lib/hooks/use-reviews";
import { supabase } from "@/lib/supabase";

interface BentoTileProps {
  review: Review;
  large?: boolean;
}

export function BentoTile({ review, large = false }: BentoTileProps) {
  const router = useRouter();

  const imageUrl = review.photo_storage_path
    ? supabase.storage
        .from("scan-uploads")
        .getPublicUrl(review.photo_storage_path).data.publicUrl
    : null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.tile,
        large ? styles.tileLarge : styles.tileSmall,
        pressed && styles.tilePressed,
      ]}
      onPress={() => router.push(`/review/${review.id}`)}
    >
      {imageUrl && (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      )}
      <View style={styles.overlay}>
        <Text style={[styles.score, { color: scoreColor(review.score) }]}>
          {review.score.toFixed(1)}
        </Text>
        <Text style={styles.itemName} numberOfLines={1}>
          {review.item_name ?? "Item"}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    overflow: "hidden",
  },
  tileLarge: {
    width: "100%",
    height: 280,
  },
  tileSmall: {
    flex: 1,
    minWidth: "45%",
    height: 160,
  },
  tilePressed: {
    transform: [{ scale: 0.97 }],
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    padding: 14,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  score: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 28,
    marginBottom: 2,
  },
  itemName: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: colors.textSecondary,
  },
});
