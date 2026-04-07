import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from "@expo-google-fonts/instrument-serif";
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
} from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/lib/auth-provider";
import { useAppStore } from "@/lib/store";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function AuthGate() {
  const { session, isLoading } = useAuth();
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "(onboarding)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    } else if (session && inAuthGroup) {
      if (!hasCompletedOnboarding) {
        router.replace("/(onboarding)");
      } else {
        router.replace("/(tabs)");
      }
    } else if (session && !hasCompletedOnboarding && !inOnboarding) {
      router.replace("/(onboarding)");
    }
  }, [session, isLoading, hasCompletedOnboarding, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0D0D0D" },
        animation: "slide_from_right",
      }}
    />
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="light" />
        <AuthGate />
      </AuthProvider>
    </QueryClientProvider>
  );
}
