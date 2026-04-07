import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";

export interface StylistVoice {
  id: string;
  slug: string;
  name: string;
  description: string;
  is_default: boolean;
  is_premium: boolean;
}

export function useVoices() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["voices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stylist_voices")
        .select("id, slug, name, description, is_default, is_premium");

      if (error) throw error;
      return data as StylistVoice[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 60,
  });
}
