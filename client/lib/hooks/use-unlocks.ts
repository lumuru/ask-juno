import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";

export interface UnlockStatus {
  total_reviews: number;
  unlocks: Array<{
    feature: string;
    earned_at: string;
    completed_at: string | null;
  }>;
  newly_eligible: string[];
}

export function useUnlocks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["unlocks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("unlock-check");

      if (error) throw error;
      return data as UnlockStatus;
    },
    enabled: !!user,
  });
}

export function useCheckUnlocks() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("unlock-check");
      if (error) throw error;
      return data as UnlockStatus;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["unlocks", user!.id], data);
    },
  });
}
