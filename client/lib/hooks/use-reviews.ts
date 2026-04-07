import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";

export interface Review {
  id: string;
  photo_storage_path: string | null;
  context: "store" | "online" | "home";
  item_name: string | null;
  brand_guess: string | null;
  verdict: "pass" | "conditional" | "no";
  score: number;
  sections: Record<string, string>;
  safety_flag: string | null;
  is_favorited: boolean;
  created_at: string;
  stylist_voice_id_used: string | null;
  price_estimate: string | null;
}

export function useReviews() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["reviews", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
    enabled: !!user,
  });
}

export function useReview(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["review", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Review;
    },
    enabled: !!user && !!id,
  });
}
