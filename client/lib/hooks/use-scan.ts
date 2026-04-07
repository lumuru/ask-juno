import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";

export function useScan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      imageUri,
      context,
    }: {
      imageUri: string;
      context: "store" | "online" | "home";
    }) => {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const fileName = `${user!.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("scan-uploads")
        .upload(fileName, decode(base64), {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data, error } = await supabase.functions.invoke("review", {
        body: {
          photo_storage_path: fileName,
          context,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["unlocks"] });
    },
  });
}
