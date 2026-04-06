# Juno React Native Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the React Native mobile client for Juno — an AI stylist app where users photograph clothing items and receive editorial reviews from AI voices.

**Architecture:** Expo Router (file-based navigation) with React Query for server state and Zustand for local UI state. All data flows through the existing Supabase backend (edge functions, auth, storage, database). Dark mode only, editorial design system.

**Tech Stack:** React Native, Expo SDK 52+, Expo Router, TanStack React Query, Zustand, Supabase JS, RevenueCat SDK, Expo Image Picker

**Spec:** `docs/superpowers/specs/2026-04-06-juno-client-design.md`

---

## Parallelization Guide

```
Task 1  (Expo scaffold + navigation shell)
  │
  ├── Task 2  (Design system / theme)          ─┐
  │                                              ├─ parallel after Task 1
  ├── Task 3  (Supabase client + auth provider) ─┘
  │
  ├── Task 4  (Auth screens — sign-in)           ── after Task 3
  │
  ├── Task 5  (Zustand store)                   ─┐
  │                                              ├─ parallel after Task 2
  ├── Task 6  (React Query hooks)               ─┘
  │
  ├── Task 7  (Onboarding flow)                  ── after Tasks 2, 5
  │
  ├── Task 8  (Home screen — empty + bento)      ── after Tasks 2, 6
  │
  ├── Task 9  (Scan screen — gallery picker)     ── after Tasks 3, 6
  │
  ├── Task 10 (Review card screen)               ── after Tasks 2, 6
  │
  ├── Task 11 (Settings screen)                  ── after Tasks 3, 6
  │
  ├── Task 12 (Style quiz)                       ── after Tasks 2, 6
  │
  └── Task 13 (RevenueCat integration)           ── after Task 3
```

## File Structure

```
app/                              # Expo Router file-based routes
├── _layout.tsx                   # Root layout — providers (QueryClient, Auth, Zustand)
├── (auth)/
│   ├── _layout.tsx               # Auth group layout
│   └── sign-in.tsx               # Sign-in screen (Apple + Google + anonymous)
├── (onboarding)/
│   ├── _layout.tsx               # Onboarding group layout
│   └── index.tsx                 # Swipeable onboarding pages + optional profile
├── (tabs)/
│   ├── _layout.tsx               # Tab bar layout (Home, Scan, Settings)
│   ├── index.tsx                 # Home screen (empty state + bento grid)
│   ├── scan.tsx                  # Scan screen (gallery-first)
│   └── settings.tsx              # Settings screen
├── review/
│   └── [id].tsx                  # Review card screen (dynamic route)
└── style-quiz/
    └── index.tsx                 # Style quiz screen

lib/
├── supabase.ts                   # Supabase client singleton
├── auth-provider.tsx             # Auth context provider
├── theme.ts                      # Design tokens (colors, typography, spacing)
├── store.ts                      # Zustand store (onboarding, local UI state)
└── hooks/
    ├── use-reviews.ts            # React Query hooks for reviews
    ├── use-profile.ts            # React Query hooks for profile
    ├── use-unlocks.ts            # React Query hooks for unlock status
    ├── use-voices.ts             # React Query hooks for stylist voices
    └── use-scan.ts               # Image upload + review request mutation

components/
├── ScoreDisplay.tsx              # Large score number with color tint
├── SectionBlock.tsx              # Single review section (header + body)
├── PairingCard.tsx               # Outfit card with color swatches
├── BentoGrid.tsx                 # Bento grid layout for home screen
├── BentoTile.tsx                 # Single tile in bento grid
├── PillSelector.tsx              # Tappable pill selector (for profile)
├── Divider.tsx                   # Thin hairline divider
└── EmptyState.tsx                # Empty state with CTA
```

---

### Task 1: Expo Project Scaffold + Navigation Shell

**Files:**
- Create: `app/_layout.tsx`
- Create: `app/(auth)/_layout.tsx`
- Create: `app/(auth)/sign-in.tsx`
- Create: `app/(onboarding)/_layout.tsx`
- Create: `app/(onboarding)/index.tsx`
- Create: `app/(tabs)/_layout.tsx`
- Create: `app/(tabs)/index.tsx`
- Create: `app/(tabs)/scan.tsx`
- Create: `app/(tabs)/settings.tsx`
- Create: `app/review/[id].tsx`
- Create: `app/style-quiz/index.tsx`
- Create: `app.json`
- Create: `package.json`
- Create: `tsconfig.json`

- [ ] **Step 1: Initialize Expo project**

Run from the project root (`/Users/ronmrls/claude-code/projects/juno`):

```bash
npx create-expo-app@latest app --template blank-typescript
```

This creates the `app/` directory structure inside an `app/` folder. We need to restructure so the Expo project lives at the repo root level under a dedicated directory.

Actually, we'll create the Expo project as a sibling to `supabase/`. Run:

```bash
npx create-expo-app@latest client --template blank-typescript
cd client
```

- [ ] **Step 2: Install core dependencies**

```bash
cd client
npx expo install expo-router expo-linking expo-constants expo-status-bar react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated expo-font expo-splash-screen
npm install @tanstack/react-query zustand @supabase/supabase-js expo-image-picker expo-haptics
```

- [ ] **Step 3: Configure app.json for Expo Router**

Replace `client/app.json`:

```json
{
  "expo": {
    "name": "Juno",
    "slug": "juno",
    "version": "1.0.0",
    "scheme": "juno",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "backgroundColor": "#0D0D0D"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.juno.app",
      "infoPlist": {
        "NSPhotoLibraryUsageDescription": "Juno needs access to your photos to scan clothing items.",
        "NSCameraUsageDescription": "Juno can use your camera to photograph clothing items."
      }
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#0D0D0D"
      },
      "package": "com.juno.app",
      "permissions": ["android.permission.CAMERA", "android.permission.READ_MEDIA_IMAGES"]
    },
    "plugins": [
      "expo-router",
      "expo-font",
      [
        "expo-image-picker",
        {
          "photosPermission": "Juno needs access to your photos to scan clothing items.",
          "cameraPermission": "Juno can use your camera to photograph clothing items."
        }
      ]
    ]
  }
}
```

- [ ] **Step 4: Configure tsconfig.json**

Replace `client/tsconfig.json`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

- [ ] **Step 5: Create root layout with placeholder providers**

Create `client/app/_layout.tsx`:

```tsx
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0D0D0D" },
          animation: "slide_from_right",
        }}
      />
    </>
  );
}
```

- [ ] **Step 6: Create tab layout**

Create `client/app/(tabs)/_layout.tsx`:

```tsx
import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
      {label}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#E8E6E1",
        tabBarInactiveTintColor: "#555555",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="H" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="S" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="⚙" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#111111",
    borderTopColor: "#1E1E1E",
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 24,
  },
  tabLabel: {
    fontSize: 18,
    color: "#555555",
    fontWeight: "300",
  },
  tabLabelActive: {
    color: "#E8E6E1",
  },
});
```

- [ ] **Step 7: Create placeholder screens**

Create `client/app/(tabs)/index.tsx`:

```tsx
import { View, Text, StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    justifyContent: "center",
    alignItems: "center",
  },
  text: { color: "#E8E6E1", fontSize: 16 },
});
```

Create `client/app/(tabs)/scan.tsx`:

```tsx
import { View, Text, StyleSheet } from "react-native";

export default function ScanScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Scan</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    justifyContent: "center",
    alignItems: "center",
  },
  text: { color: "#E8E6E1", fontSize: 16 },
});
```

Create `client/app/(tabs)/settings.tsx`:

```tsx
import { View, Text, StyleSheet } from "react-native";

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Settings</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    justifyContent: "center",
    alignItems: "center",
  },
  text: { color: "#E8E6E1", fontSize: 16 },
});
```

Create `client/app/(auth)/_layout.tsx`:

```tsx
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0D0D0D" } }} />
  );
}
```

Create `client/app/(auth)/sign-in.tsx`:

```tsx
import { View, Text, StyleSheet } from "react-native";

export default function SignInScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Sign In</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    justifyContent: "center",
    alignItems: "center",
  },
  text: { color: "#E8E6E1", fontSize: 16 },
});
```

Create `client/app/(onboarding)/_layout.tsx`:

```tsx
import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0D0D0D" } }} />
  );
}
```

Create `client/app/(onboarding)/index.tsx`:

```tsx
import { View, Text, StyleSheet } from "react-native";

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Onboarding</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    justifyContent: "center",
    alignItems: "center",
  },
  text: { color: "#E8E6E1", fontSize: 16 },
});
```

Create `client/app/review/[id].tsx`:

```tsx
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Review {id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    justifyContent: "center",
    alignItems: "center",
  },
  text: { color: "#E8E6E1", fontSize: 16 },
});
```

Create `client/app/style-quiz/index.tsx`:

```tsx
import { View, Text, StyleSheet } from "react-native";

export default function StyleQuizScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Style Quiz</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    justifyContent: "center",
    alignItems: "center",
  },
  text: { color: "#E8E6E1", fontSize: 16 },
});
```

- [ ] **Step 8: Verify the app starts**

```bash
cd client
npx expo start
```

Expected: Metro bundler starts, no errors. Press `i` for iOS simulator or `a` for Android emulator to verify the tab navigation works.

- [ ] **Step 9: Commit**

```bash
git add client/
git commit -m "feat(client): scaffold Expo project with navigation shell

Expo Router file-based navigation with tabs (Home, Scan, Settings),
auth group, onboarding group, review card stack, and style quiz stack.
All screens are placeholders."
```

---

### Task 2: Design System / Theme

**Files:**
- Create: `client/lib/theme.ts`
- Create: `client/components/Divider.tsx`
- Create: `client/components/PillSelector.tsx`

- [ ] **Step 1: Create theme tokens**

Create `client/lib/theme.ts`:

```ts
export const colors = {
  background: "#0D0D0D",
  surface: "#111111",
  surfaceElevated: "#161616",
  textPrimary: "#E8E6E1",
  textSecondary: "#C8C5BF",
  textMuted: "#555555",
  divider: "#1E1E1E",
  scoreGreen: "#7A9A6D",
  scoreNeutral: "#8A8781",
  scoreAmber: "#B8A45C",
  border: "#2A2A2A",
} as const;

export const fonts = {
  serif: "InstrumentSerif_400Regular",
  serifItalic: "InstrumentSerif_400Regular_Italic",
  sans: "Inter_300Light",
  sansMedium: "Inter_500Medium",
  sansRegular: "Inter_400Regular",
} as const;

export const typography = {
  score: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 72,
    color: "#E8E6E1",
    letterSpacing: -0.02 * 72,
  },
  headline: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 24,
    color: "#E8E6E1",
    lineHeight: 24 * 1.2,
  },
  finalWord: {
    fontFamily: "InstrumentSerif_400Regular_Italic",
    fontSize: 17,
    color: "#D8D5CF",
    lineHeight: 17 * 1.55,
  },
  body: {
    fontFamily: "Inter_300Light",
    fontSize: 14,
    color: "#C8C5BF",
    lineHeight: 14 * 1.65,
  },
  sectionHeader: {
    fontFamily: "Inter_500Medium",
    fontSize: 9,
    color: "#555555",
    letterSpacing: 0.16 * 9,
    textTransform: "uppercase" as const,
  },
  meta: {
    fontFamily: "Inter_300Light",
    fontSize: 12,
    color: "#666666",
    letterSpacing: 0.03 * 12,
  },
  caption: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: "#3A3A3A",
    letterSpacing: 0.04 * 10,
  },
} as const;

export const spacing = {
  horizontalPadding: 24,
  sectionPadding: 24,
} as const;

export function scoreColor(score: number): string {
  if (score >= 7.0) return colors.scoreGreen;
  if (score >= 5.0) return colors.scoreNeutral;
  return colors.scoreAmber;
}
```

- [ ] **Step 2: Install fonts**

```bash
cd client
npx expo install @expo-google-fonts/instrument-serif @expo-google-fonts/inter expo-font
```

- [ ] **Step 3: Update root layout to load fonts**

Replace `client/app/_layout.tsx`:

```tsx
import { Stack } from "expo-router";
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

SplashScreen.preventAutoHideAsync();

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
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0D0D0D" },
          animation: "slide_from_right",
        }}
      />
    </>
  );
}
```

- [ ] **Step 4: Create Divider component**

Create `client/components/Divider.tsx`:

```tsx
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
```

- [ ] **Step 5: Create PillSelector component**

Create `client/components/PillSelector.tsx`:

```tsx
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "@/lib/theme";

interface PillSelectorProps {
  label: string;
  options: string[];
  selected: string | null;
  onSelect: (value: string) => void;
}

export function PillSelector({
  label,
  options,
  selected,
  onSelect,
}: PillSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pills}>
        {options.map((option) => (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            style={[
              styles.pill,
              selected === option && styles.pillSelected,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                selected === option && styles.pillTextSelected,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 0.16 * 9,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillSelected: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  pillText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: colors.textMuted,
  },
  pillTextSelected: {
    color: colors.background,
  },
});
```

- [ ] **Step 6: Verify fonts render**

Run `npx expo start`, open on simulator. Navigate to Home tab — text should render in the Inter font (once Home screen is updated to use theme fonts in a later task). For now, verify the app still starts without errors.

- [ ] **Step 7: Commit**

```bash
git add client/lib/theme.ts client/components/Divider.tsx client/components/PillSelector.tsx client/app/_layout.tsx
git commit -m "feat(client): add design system with theme tokens, fonts, and components

Colors, typography, spacing tokens. Instrument Serif + Inter fonts.
Divider and PillSelector reusable components."
```

---

### Task 3: Supabase Client + Auth Provider

**Files:**
- Create: `client/lib/supabase.ts`
- Create: `client/lib/auth-provider.tsx`
- Create: `client/.env.local`
- Modify: `client/app/_layout.tsx`

- [ ] **Step 1: Install Supabase dependencies**

```bash
cd client
npx expo install expo-secure-store
npm install @supabase/supabase-js
```

- [ ] **Step 2: Create Supabase client**

Create `client/lib/supabase.ts`:

```ts
import "react-native-url-polyfill/dist/setup";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS !== "web" ? ExpoSecureStoreAdapter : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

- [ ] **Step 3: Install URL polyfill**

```bash
cd client
npm install react-native-url-polyfill
```

- [ ] **Step 4: Create auth provider**

Create `client/lib/auth-provider.tsx`:

```tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";
import type { Session, User } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithApple = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
    });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) throw error;
  };

  const signInAnonymously = async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        signInWithApple,
        signInWithGoogle,
        signInAnonymously,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
```

- [ ] **Step 5: Create .env.local**

Create `client/.env.local`:

```
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key-here
```

Add to `client/.gitignore` (append):

```
.env.local
```

- [ ] **Step 6: Wire auth provider into root layout**

Replace `client/app/_layout.tsx`:

```tsx
import { Stack } from "expo-router";
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
import { AuthProvider } from "@/lib/auth-provider";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

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
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#0D0D0D" },
            animation: "slide_from_right",
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 7: Verify app starts with providers**

```bash
cd client
npx expo start
```

Expected: App starts without errors. Auth provider initializes (no session yet, so `user` is null).

- [ ] **Step 8: Commit**

```bash
git add client/lib/supabase.ts client/lib/auth-provider.tsx client/app/_layout.tsx client/.gitignore
git commit -m "feat(client): add Supabase client and auth provider

SecureStore-backed session persistence, Apple/Google/anonymous sign-in,
auth state via React context. QueryClient provider wired into root layout."
```

---

### Task 4: Auth Screen — Sign In

**Files:**
- Modify: `client/app/(auth)/sign-in.tsx`
- Modify: `client/app/_layout.tsx`

- [ ] **Step 1: Build sign-in screen**

Replace `client/app/(auth)/sign-in.tsx`:

```tsx
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-provider";
import { colors, typography } from "@/lib/theme";

export default function SignInScreen() {
  const { signInWithApple, signInWithGoogle, signInAnonymously } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Juno</Text>
        <Text style={styles.subtitle}>Your AI stylist</Text>
      </View>

      <View style={styles.buttons}>
        <Pressable
          style={[styles.button, styles.buttonApple]}
          onPress={signInWithApple}
        >
          <Text style={[styles.buttonText, styles.buttonTextDark]}>
            Continue with Apple
          </Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.buttonGoogle]}
          onPress={signInWithGoogle}
        >
          <Text style={styles.buttonText}>Continue with Google</Text>
        </Pressable>

        <Pressable style={styles.skipButton} onPress={signInAnonymously}>
          <Text style={styles.skipText}>Try without an account</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    ...typography.headline,
    fontSize: 48,
    lineHeight: 48 * 1.1,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.meta,
    fontSize: 14,
  },
  buttons: {
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonApple: {
    backgroundColor: colors.textPrimary,
  },
  buttonGoogle: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: colors.textPrimary,
  },
  buttonTextDark: {
    color: colors.background,
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  skipText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: colors.textMuted,
  },
});
```

- [ ] **Step 2: Add auth routing to root layout**

Replace `client/app/_layout.tsx`:

```tsx
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
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, isLoading, segments]);

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
```

- [ ] **Step 3: Verify auth flow**

```bash
cd client
npx expo start
```

Expected: App opens to sign-in screen (no session). "Try without an account" creates an anonymous session and redirects to tabs.

- [ ] **Step 4: Commit**

```bash
git add client/app/(auth)/sign-in.tsx client/app/_layout.tsx
git commit -m "feat(client): add sign-in screen with auth routing

Apple, Google, and anonymous sign-in options. Auth gate redirects
unauthenticated users to sign-in, authenticated users to tabs."
```

---

### Task 5: Zustand Store

**Files:**
- Create: `client/lib/store.ts`

- [ ] **Step 1: Create store**

Create `client/lib/store.ts`:

```ts
import { create } from "zustand";

interface AppStore {
  // Onboarding
  hasCompletedOnboarding: boolean;
  setOnboardingComplete: () => void;

  // Scan flow
  selectedImageUri: string | null;
  setSelectedImageUri: (uri: string | null) => void;

  // Style quiz
  quizSelections: string[];
  toggleQuizSelection: (id: string) => void;
  resetQuizSelections: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  // Onboarding
  hasCompletedOnboarding: false,
  setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),

  // Scan flow
  selectedImageUri: null,
  setSelectedImageUri: (uri) => set({ selectedImageUri: uri }),

  // Style quiz
  quizSelections: [],
  toggleQuizSelection: (id) =>
    set((state) => ({
      quizSelections: state.quizSelections.includes(id)
        ? state.quizSelections.filter((s) => s !== id)
        : [...state.quizSelections, id],
    })),
  resetQuizSelections: () => set({ quizSelections: [] }),
}));
```

- [ ] **Step 2: Commit**

```bash
git add client/lib/store.ts
git commit -m "feat(client): add Zustand store for local UI state

Onboarding completion flag, scan flow image URI, style quiz selections."
```

---

### Task 6: React Query Hooks

**Files:**
- Create: `client/lib/hooks/use-reviews.ts`
- Create: `client/lib/hooks/use-profile.ts`
- Create: `client/lib/hooks/use-unlocks.ts`
- Create: `client/lib/hooks/use-voices.ts`
- Create: `client/lib/hooks/use-scan.ts`

- [ ] **Step 1: Create reviews hooks**

Create `client/lib/hooks/use-reviews.ts`:

```ts
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
```

- [ ] **Step 2: Create profile hooks**

Create `client/lib/hooks/use-profile.ts`:

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";

export interface Profile {
  user_id: string;
  display_name: string | null;
  stylist_voice_id: string | null;
  level: "A" | "B" | "C";
  height_cm: number | null;
  weight_kg: number | null;
  gender_presentation: string | null;
  budget_tier: string | null;
  body_shape: string | null;
  style_quiz_completed_at: string | null;
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as Profile | null;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      const { data, error } = await supabase
        .from("profiles")
        .upsert({ user_id: user!.id, ...updates })
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["profile", user!.id], data);
    },
  });
}
```

- [ ] **Step 3: Create unlocks hook**

Create `client/lib/hooks/use-unlocks.ts`:

```ts
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
```

- [ ] **Step 4: Create voices hook**

Create `client/lib/hooks/use-voices.ts`:

```ts
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
    staleTime: 1000 * 60 * 60, // voices rarely change, cache 1 hour
  });
}
```

- [ ] **Step 5: Create scan mutation hook**

Create `client/lib/hooks/use-scan.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";
import * as FileSystem from "expo-file-system";
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
      // 1. Read image as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 2. Upload to Supabase Storage
      const fileName = `${user!.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("scan-uploads")
        .upload(fileName, decode(base64), {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 3. Call review edge function
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
```

- [ ] **Step 6: Install file system dependency**

```bash
cd client
npx expo install expo-file-system
npm install base64-arraybuffer
```

- [ ] **Step 7: Commit**

```bash
git add client/lib/hooks/
git commit -m "feat(client): add React Query hooks for all data operations

Reviews (list + single), profile (read + update), unlocks (check),
voices (list), and scan mutation (upload + review request)."
```

---

### Task 7: Onboarding Flow

**Files:**
- Modify: `client/app/(onboarding)/index.tsx`
- Modify: `client/app/_layout.tsx`

- [ ] **Step 1: Build onboarding screen**

Replace `client/app/(onboarding)/index.tsx`:

```tsx
import { useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  FlatList,
  type ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors, typography } from "@/lib/theme";
import { PillSelector } from "@/components/PillSelector";
import { useAppStore } from "@/lib/store";
import { useUpdateProfile } from "@/lib/hooks/use-profile";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    key: "1",
    title: "Photograph\nany item",
    subtitle: "From your closet, a store, or a screenshot",
  },
  {
    key: "2",
    title: "Get a stylist's\nhonest take",
    subtitle: "Scored, reviewed, and paired — in seconds",
  },
  {
    key: "3",
    title: "Build your\nstyle over time",
    subtitle: "Unlock your wardrobe, quiz, and new voices",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const setOnboardingComplete = useAppStore((s) => s.setOnboardingComplete);
  const updateProfile = useUpdateProfile();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [heightCm, setHeightCm] = useState<string | null>(null);
  const [build, setBuild] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index ?? 0);
      }
    },
  ).current;

  const finish = async () => {
    if (heightCm || build || gender) {
      await updateProfile.mutateAsync({
        height_cm: heightCm ? parseInt(heightCm, 10) : null,
        body_shape: build,
        gender_presentation: gender,
      });
    }
    setOnboardingComplete();
    router.replace("/(tabs)");
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      setShowProfile(true);
    }
  };

  if (showProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.profileContent}>
          <Text style={styles.profileTitle}>Help Juno know your fit</Text>
          <Text style={styles.profileSubtitle}>
            Optional — you can always add this later
          </Text>

          <View style={styles.profileForm}>
            <PillSelector
              label="Height"
              options={["< 165cm", "165–175cm", "175–185cm", "185cm +"]}
              selected={heightCm}
              onSelect={setHeightCm}
            />
            <PillSelector
              label="Build"
              options={["Slim", "Athletic", "Medium", "Broad"]}
              selected={build}
              onSelect={setBuild}
            />
            <PillSelector
              label="I usually shop"
              options={["Masc", "Femme", "Androgynous", "All"]}
              selected={gender}
              onSelect={setGender}
            />
          </View>
        </View>

        <View style={styles.bottomButtons}>
          <Pressable style={styles.skipButton} onPress={finish}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
          <Pressable style={styles.nextButton} onPress={finish}>
            <Text style={styles.nextText}>Get Started</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex && styles.dotActive]}
          />
        ))}
      </View>

      <View style={styles.bottomButtons}>
        <Pressable
          style={styles.skipButton}
          onPress={() => {
            setOnboardingComplete();
            router.replace("/(tabs)");
          }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
        <Pressable style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextText}>
            {currentIndex === SLIDES.length - 1 ? "Continue" : "Next"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  slideTitle: {
    ...typography.headline,
    fontSize: 36,
    lineHeight: 36 * 1.2,
    textAlign: "center",
    marginBottom: 16,
  },
  slideSubtitle: {
    ...typography.body,
    textAlign: "center",
    color: colors.textMuted,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.textPrimary,
    width: 20,
  },
  bottomButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.textMuted,
  },
  nextButton: {
    backgroundColor: colors.textPrimary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  nextText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: colors.background,
  },
  profileContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  profileTitle: {
    ...typography.headline,
    marginBottom: 8,
  },
  profileSubtitle: {
    ...typography.meta,
    marginBottom: 40,
  },
  profileForm: {
    gap: 8,
  },
});
```

- [ ] **Step 2: Add onboarding gate to root layout**

Update the `AuthGate` component in `client/app/_layout.tsx` to check onboarding status. Replace the `AuthGate` function:

```tsx
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
```

Add the import at the top of `_layout.tsx`:

```tsx
import { useAppStore } from "@/lib/store";
```

- [ ] **Step 3: Verify onboarding flow**

```bash
cd client
npx expo start
```

Expected: After sign-in, user sees onboarding slides. Can swipe through 3 pages. "Continue" on last page shows profile form. "Skip" or "Get Started" navigates to tabs.

- [ ] **Step 4: Commit**

```bash
git add client/app/(onboarding)/index.tsx client/app/_layout.tsx
git commit -m "feat(client): add onboarding flow with optional profile setup

3 swipeable intro slides, then optional height/build/gender profile
with pill selectors. Skip button always visible. Profile saved to
Supabase on completion."
```

---

### Task 8: Home Screen — Empty State + Bento Grid

**Files:**
- Create: `client/components/EmptyState.tsx`
- Create: `client/components/BentoGrid.tsx`
- Create: `client/components/BentoTile.tsx`
- Modify: `client/app/(tabs)/index.tsx`

- [ ] **Step 1: Create EmptyState component**

Create `client/components/EmptyState.tsx`:

```tsx
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors, typography } from "@/lib/theme";

export function EmptyState() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✦</Text>
      <Text style={styles.title}>Your style story{"\n"}starts here</Text>
      <Text style={styles.subtitle}>
        Scan your first item to get a stylist review
      </Text>
      <Pressable
        style={styles.button}
        onPress={() => router.push("/(tabs)/scan")}
      >
        <Text style={styles.buttonText}>Scan your first item</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  icon: {
    fontSize: 32,
    color: colors.textMuted,
    marginBottom: 24,
  },
  title: {
    ...typography.headline,
    fontSize: 28,
    lineHeight: 28 * 1.3,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 32,
  },
  button: {
    backgroundColor: colors.textPrimary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
  },
  buttonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: colors.background,
  },
});
```

- [ ] **Step 2: Create BentoTile component**

Create `client/components/BentoTile.tsx`:

```tsx
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
```

- [ ] **Step 3: Create BentoGrid component**

Create `client/components/BentoGrid.tsx`:

```tsx
import { View, StyleSheet } from "react-native";
import { BentoTile } from "./BentoTile";
import type { Review } from "@/lib/hooks/use-reviews";

interface BentoGridProps {
  reviews: Review[];
}

export function BentoGrid({ reviews }: BentoGridProps) {
  if (reviews.length === 0) return null;

  const [latest, ...rest] = reviews;

  // Group remaining reviews into rows of 2
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
```

- [ ] **Step 4: Update Home screen**

Replace `client/app/(tabs)/index.tsx`:

```tsx
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
```

- [ ] **Step 5: Verify home screen**

```bash
cd client
npx expo start
```

Expected: With no reviews, shows empty state with "Scan your first item" button. With reviews (after connecting to Supabase with test data), shows bento grid.

- [ ] **Step 6: Commit**

```bash
git add client/components/EmptyState.tsx client/components/BentoTile.tsx client/components/BentoGrid.tsx client/app/\(tabs\)/index.tsx
git commit -m "feat(client): add home screen with empty state and bento grid

Empty state shows CTA to scan first item. Bento grid shows latest
review as large tile, older reviews in rows of 2. Score overlay with
color-coded tint."
```

---

### Task 9: Scan Screen — Gallery Picker + Review Request

**Files:**
- Modify: `client/app/(tabs)/scan.tsx`

- [ ] **Step 1: Build scan screen**

Replace `client/app/(tabs)/scan.tsx`:

```tsx
import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { colors, typography } from "@/lib/theme";
import { useScan } from "@/lib/hooks/use-scan";
import { useCheckUnlocks } from "@/lib/hooks/use-unlocks";
import { PillSelector } from "@/components/PillSelector";

type ScanContext = "store" | "online" | "home";

export default function ScanScreen() {
  const router = useRouter();
  const scan = useScan();
  const checkUnlocks = useCheckUnlocks();
  const [context, setContext] = useState<ScanContext>("online");

  const pickImage = async (fromCamera: boolean) => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
    };

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled || !result.assets[0]) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const reviewData = await scan.mutateAsync({
        imageUri: result.assets[0].uri,
        context,
      });

      // Check for new unlocks after review
      await checkUnlocks.mutateAsync();

      // Navigate to review card
      if (reviewData?.id) {
        router.push(`/review/${reviewData.id}`);
      }
    } catch (_error) {
      // Error is available via scan.error
    }
  };

  if (scan.isPending) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.textPrimary} size="large" />
          <Text style={styles.loadingText}>Your stylist is reviewing...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <Text style={styles.title}>Scan an item</Text>
        <Text style={styles.subtitle}>
          Choose a photo from your gallery or take a new one
        </Text>

        <View style={styles.contextSection}>
          <PillSelector
            label="Where is this item?"
            options={["Online", "Store", "Home"]}
            selected={
              context === "online"
                ? "Online"
                : context === "store"
                  ? "Store"
                  : "Home"
            }
            onSelect={(val) =>
              setContext(val.toLowerCase() as ScanContext)
            }
          />
        </View>

        <View style={styles.buttons}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => pickImage(false)}
          >
            <Text style={styles.primaryButtonText}>Choose from gallery</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => pickImage(true)}
          >
            <Text style={styles.secondaryButtonText}>Take a photo</Text>
          </Pressable>
        </View>

        {scan.isError && (
          <Text style={styles.errorText}>
            Something went wrong. Please try again.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    ...typography.headline,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: 40,
  },
  contextSection: {
    marginBottom: 40,
  },
  buttons: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.textPrimary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: colors.background,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceElevated,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
  },
  errorText: {
    ...typography.meta,
    color: colors.scoreAmber,
    textAlign: "center",
    marginTop: 20,
  },
});
```

- [ ] **Step 2: Verify scan flow**

```bash
cd client
npx expo start
```

Expected: Scan tab shows context selector and two buttons. "Choose from gallery" opens photo picker. After selection, shows loading state. (Full flow requires running Supabase backend.)

- [ ] **Step 3: Commit**

```bash
git add client/app/\(tabs\)/scan.tsx
git commit -m "feat(client): add scan screen with gallery-first picker

Context selector (online/store/home), gallery picker as primary action,
camera as secondary. Loading state while review processes. Error display
on failure. Checks unlocks after each review."
```

---

### Task 10: Review Card Screen

**Files:**
- Create: `client/components/ScoreDisplay.tsx`
- Create: `client/components/SectionBlock.tsx`
- Create: `client/components/PairingCard.tsx`
- Modify: `client/app/review/[id].tsx`

- [ ] **Step 1: Create ScoreDisplay component**

Create `client/components/ScoreDisplay.tsx`:

```tsx
import { View, Text, StyleSheet } from "react-native";
import { colors, typography, scoreColor } from "@/lib/theme";

interface ScoreDisplayProps {
  score: number;
}

export function ScoreDisplay({ score }: ScoreDisplayProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.score, { color: scoreColor(score) }]}>
        {score.toFixed(1)}
      </Text>
      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  score: {
    ...typography.score,
    lineHeight: 72,
  },
  rule: {
    width: 32,
    height: 1,
    backgroundColor: "#333333",
    marginTop: 12,
  },
});
```

- [ ] **Step 2: Create SectionBlock component**

Create `client/components/SectionBlock.tsx`:

```tsx
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
```

- [ ] **Step 3: Create PairingCard component**

Create `client/components/PairingCard.tsx`:

```tsx
import { View, Text, StyleSheet } from "react-native";
import { colors } from "@/lib/theme";

interface PairingCardProps {
  title: string;
  vibe?: string;
}

export function PairingCard({ title, vibe }: PairingCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.desc}>
        <Text style={styles.title}>{title}</Text>
        {vibe && <Text style={styles.vibe}>{vibe}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 240,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    overflow: "hidden",
  },
  desc: {
    padding: 14,
  },
  title: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#999999",
    marginBottom: 4,
  },
  vibe: {
    fontFamily: "Inter_300Light",
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: "italic",
  },
});
```

- [ ] **Step 4: Build review card screen**

Replace `client/app/review/[id].tsx`:

```tsx
import {
  ScrollView,
  View,
  Text,
  Image,
  Pressable,
  FlatList,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { colors, typography, spacing } from "@/lib/theme";
import { useReview } from "@/lib/hooks/use-reviews";
import { ScoreDisplay } from "@/components/ScoreDisplay";
import { SectionBlock } from "@/components/SectionBlock";
import { PairingCard } from "@/components/PairingCard";
import { Divider } from "@/components/Divider";
import { supabase } from "@/lib/supabase";

const SECTION_ORDER = [
  { key: "first_impression", label: "First Impression" },
  { key: "fit_for_you", label: "Fit For You" },
  { key: "style_read", label: "Style Read" },
  { key: "originality", label: "Originality" },
  { key: "construction", label: "Construction" },
  { key: "color_story", label: "Color Story" },
  { key: "occasion_fit", label: "Occasion Fit" },
  { key: "pairing", label: "Pairing" },
  { key: "alternatives", label: "Alternatives" },
  { key: "critique", label: "Critique" },
  { key: "final_word", label: "Final Word" },
] as const;

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: review, isLoading } = useReview(id);

  if (isLoading || !review) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const imageUrl = review.photo_storage_path
    ? supabase.storage
        .from("scan-uploads")
        .getPublicUrl(review.photo_storage_path).data.publicUrl
    : null;

  const sections = review.sections as Record<string, string>;

  const handleSaveToWardrobe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Save to wardrobe_items table
    await supabase.from("wardrobe_items").insert({
      item_name: review.item_name ?? "Unknown item",
      category: "other",
      color_tags: [],
      original_review_id: review.id,
    });
  };

  // Parse pairing text into individual items
  const pairingItems = sections.pairing
    ? sections.pairing.split("\n").filter((line: string) => line.trim())
    : [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.heroImage} />
        )}

        {/* Score */}
        <ScoreDisplay score={review.score} />

        {/* Item info */}
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>
            {review.item_name ?? "Unknown Item"}
          </Text>
          <Text style={styles.itemMeta}>
            {review.brand_guess ?? "Unknown brand"}
          </Text>
        </View>

        <Divider />

        {/* Sections */}
        {SECTION_ORDER.map(({ key, label }) => {
          const content = sections[key];
          if (!content) return null;

          // Special rendering for pairing section
          if (key === "pairing") {
            return (
              <View key={key} style={styles.pairingSection}>
                <Text style={styles.pairingSectionHeader}>{label}</Text>
                <FlatList
                  horizontal
                  data={pairingItems}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pairingScroll}
                  keyExtractor={(_, i) => String(i)}
                  renderItem={({ item }) => (
                    <PairingCard title={item.replace(/^[-—•]\s*/, "")} />
                  )}
                />
              </View>
            );
          }

          return (
            <SectionBlock
              key={key}
              header={label}
              body={content}
              isFinalWord={key === "final_word"}
              priceEstimate={
                key === "construction" ? review.price_estimate : null
              }
            />
          );
        })}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.aiDisclosure}>
            Generated by AI — opinions are Juno's, not yours.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <Pressable onPress={() => router.push("/(tabs)/scan")}>
          <Text style={styles.bottomBtnPrimary}>Scan Again</Text>
        </Pressable>
        <Pressable onPress={handleSaveToWardrobe}>
          <Text style={styles.bottomBtn}>Save to Wardrobe</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backText: {
    fontFamily: "Inter_300Light",
    fontSize: 14,
    color: "#777777",
  },
  heroImage: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
  },
  itemInfo: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  itemName: {
    ...typography.headline,
    marginBottom: 6,
  },
  itemMeta: {
    ...typography.meta,
  },
  pairingSection: {
    paddingVertical: spacing.sectionPadding,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  pairingSectionHeader: {
    ...typography.sectionHeader,
    paddingHorizontal: spacing.horizontalPadding,
    marginBottom: 14,
  },
  pairingScroll: {
    paddingHorizontal: spacing.horizontalPadding,
    gap: 12,
  },
  footer: {
    paddingVertical: 20,
    paddingHorizontal: spacing.horizontalPadding,
    alignItems: "center",
  },
  aiDisclosure: {
    ...typography.caption,
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
    paddingVertical: 16,
    paddingHorizontal: spacing.horizontalPadding,
    backgroundColor: "rgba(17,17,17,0.95)",
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  bottomBtn: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#777777",
    paddingVertical: 6,
  },
  bottomBtnPrimary: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: colors.textPrimary,
    paddingVertical: 6,
  },
});
```

- [ ] **Step 5: Verify review card renders**

```bash
cd client
npx expo start
```

Expected: Navigate to `/review/[id]` (hardcode a test ID or navigate from home screen). Shows hero image, large score, item info, all sections in editorial layout, pairing cards in horizontal scroll, and bottom bar with Scan Again + Save.

- [ ] **Step 6: Commit**

```bash
git add client/components/ScoreDisplay.tsx client/components/SectionBlock.tsx client/components/PairingCard.tsx client/app/review/\[id\].tsx
git commit -m "feat(client): add review card screen with editorial layout

Full scrollable review: hero image, large score with color tint,
item info, 11 sections in magazine-column flow, horizontal pairing
cards, price inline in construction section, final word in italic
serif. Bottom bar with Scan Again and Save to Wardrobe."
```

---

### Task 11: Settings Screen

**Files:**
- Modify: `client/app/(tabs)/settings.tsx`

- [ ] **Step 1: Build settings screen**

Replace `client/app/(tabs)/settings.tsx`:

```tsx
import { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing } from "@/lib/theme";
import { useAuth } from "@/lib/auth-provider";
import { useProfile, useUpdateProfile } from "@/lib/hooks/use-profile";
import { useVoices } from "@/lib/hooks/use-voices";
import { useUnlocks } from "@/lib/hooks/use-unlocks";
import { PillSelector } from "@/components/PillSelector";
import { Divider } from "@/components/Divider";
import { supabase } from "@/lib/supabase";

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: voices } = useVoices();
  const { data: unlocks } = useUnlocks();
  const updateProfile = useUpdateProfile();

  const voiceSwapUnlocked = unlocks?.unlocks.some(
    (u) => u.feature === "voice_swap_hint",
  );

  const handleExportData = async () => {
    const { data, error } = await supabase.functions.invoke("export-account");
    if (error) {
      Alert.alert("Error", "Failed to export data");
      return;
    }
    Alert.alert("Data Exported", "Your data has been prepared for download.");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete all your data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.functions.invoke(
              "delete-account",
              { body: { confirm: true } },
            );
            if (error) {
              Alert.alert("Error", "Failed to delete account");
              return;
            }
            await signOut();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Profile</Text>
          <PillSelector
            label="Height"
            options={["< 165cm", "165–175cm", "175–185cm", "185cm +"]}
            selected={null}
            onSelect={(val) => {
              const heightMap: Record<string, number> = {
                "< 165cm": 160,
                "165–175cm": 170,
                "175–185cm": 180,
                "185cm +": 190,
              };
              updateProfile.mutate({ height_cm: heightMap[val] ?? null });
            }}
          />
          <PillSelector
            label="Build"
            options={["Slim", "Athletic", "Medium", "Broad"]}
            selected={profile?.body_shape ?? null}
            onSelect={(val) => updateProfile.mutate({ body_shape: val })}
          />
          <PillSelector
            label="I usually shop"
            options={["Masc", "Femme", "Androgynous", "All"]}
            selected={profile?.gender_presentation ?? null}
            onSelect={(val) =>
              updateProfile.mutate({ gender_presentation: val })
            }
          />
        </View>

        <Divider />

        {/* Voice Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Stylist Voice</Text>
          {voices?.map((voice) => {
            const isActive = profile?.stylist_voice_id === voice.id;
            const isLocked = !voiceSwapUnlocked && !voice.is_default;

            return (
              <Pressable
                key={voice.id}
                style={[
                  styles.voiceRow,
                  isActive && styles.voiceRowActive,
                  isLocked && styles.voiceRowLocked,
                ]}
                disabled={isLocked}
                onPress={() =>
                  updateProfile.mutate({ stylist_voice_id: voice.id })
                }
              >
                <View>
                  <Text
                    style={[
                      styles.voiceName,
                      isLocked && styles.voiceNameLocked,
                    ]}
                  >
                    {voice.name}
                  </Text>
                  <Text style={styles.voiceDesc}>{voice.description}</Text>
                </View>
                {isActive && <Text style={styles.activeIndicator}>●</Text>}
                {isLocked && (
                  <Text style={styles.lockText}>
                    {unlocks
                      ? `${unlocks.total_reviews}/5 reviews`
                      : "Locked"}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        <Divider />

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Account</Text>
          <Pressable style={styles.accountRow} onPress={handleExportData}>
            <Text style={styles.accountRowText}>Export my data</Text>
          </Pressable>
          <Pressable style={styles.accountRow} onPress={handleDeleteAccount}>
            <Text style={[styles.accountRowText, styles.destructiveText]}>
              Delete account
            </Text>
          </Pressable>
          <Pressable style={styles.accountRow} onPress={signOut}>
            <Text style={styles.accountRowText}>Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.headline,
    fontSize: 20,
    paddingHorizontal: spacing.horizontalPadding,
    paddingTop: 12,
    paddingBottom: 24,
  },
  section: {
    paddingHorizontal: spacing.horizontalPadding,
    paddingVertical: spacing.sectionPadding,
  },
  sectionHeader: {
    ...typography.sectionHeader,
    marginBottom: 16,
  },
  voiceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  voiceRowActive: {
    borderBottomColor: colors.scoreGreen,
  },
  voiceRowLocked: {
    opacity: 0.4,
  },
  voiceName: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  voiceNameLocked: {
    color: colors.textMuted,
  },
  voiceDesc: {
    fontFamily: "Inter_300Light",
    fontSize: 12,
    color: colors.textMuted,
  },
  activeIndicator: {
    color: colors.scoreGreen,
    fontSize: 10,
  },
  lockText: {
    fontFamily: "Inter_300Light",
    fontSize: 11,
    color: colors.textMuted,
  },
  accountRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  accountRowText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.textSecondary,
  },
  destructiveText: {
    color: colors.scoreAmber,
  },
});
```

- [ ] **Step 2: Verify settings screen**

```bash
cd client
npx expo start
```

Expected: Settings tab shows profile pills, voice selector (with lock state), and account actions.

- [ ] **Step 3: Commit**

```bash
git add client/app/\(tabs\)/settings.tsx
git commit -m "feat(client): add settings screen with profile, voice, and account

Profile editing via pill selectors. Voice selection with lock state
and progress toward unlock. Export data, delete account (with
confirmation), and sign out."
```

---

### Task 12: Style Quiz

**Files:**
- Modify: `client/app/style-quiz/index.tsx`

- [ ] **Step 1: Build style quiz screen**

Replace `client/app/style-quiz/index.tsx`:

```tsx
import {
  View,
  Text,
  Image,
  Pressable,
  FlatList,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { colors, typography, spacing } from "@/lib/theme";
import { useAppStore } from "@/lib/store";
import { useUpdateProfile } from "@/lib/hooks/use-profile";

const { width } = Dimensions.get("window");
const COLUMN_COUNT = 2;
const GAP = 10;
const TILE_SIZE = (width - spacing.horizontalPadding * 2 - GAP) / COLUMN_COUNT;

// Placeholder outfit data — in production, these would come from a curated set
const OUTFITS = [
  { id: "1", label: "Minimal Casual", color: "#2C3E50" },
  { id: "2", label: "Street Edge", color: "#1A1A2E" },
  { id: "3", label: "Classic Tailored", color: "#4A3728" },
  { id: "4", label: "Athleisure", color: "#2D4A3E" },
  { id: "5", label: "Boho Relaxed", color: "#5C4033" },
  { id: "6", label: "Monochrome", color: "#333333" },
  { id: "7", label: "Coastal Clean", color: "#4A6274" },
  { id: "8", label: "Vintage Mix", color: "#6B4423" },
  { id: "9", label: "Scandi Simple", color: "#8B8B7A" },
  { id: "10", label: "Bold Color", color: "#7A3B5E" },
];

const MIN_SELECTIONS = 5;

export default function StyleQuizScreen() {
  const router = useRouter();
  const quizSelections = useAppStore((s) => s.quizSelections);
  const toggleQuizSelection = useAppStore((s) => s.toggleQuizSelection);
  const resetQuizSelections = useAppStore((s) => s.resetQuizSelections);
  const updateProfile = useUpdateProfile();

  const handleFinish = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Save quiz results — the selected style tags map to occasion_tags
    const selectedLabels = OUTFITS.filter((o) =>
      quizSelections.includes(o.id),
    ).map((o) => o.label);

    await updateProfile.mutateAsync({
      style_quiz_completed_at: new Date().toISOString(),
    });

    resetQuizSelections();
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </View>

      <View style={styles.intro}>
        <Text style={styles.title}>Pick 5 outfits{"\n"}you'd wear</Text>
        <Text style={styles.subtitle}>
          This helps Juno understand your style
        </Text>
      </View>

      <FlatList
        data={OUTFITS}
        numColumns={COLUMN_COUNT}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = quizSelections.includes(item.id);
          return (
            <Pressable
              style={[
                styles.tile,
                { backgroundColor: item.color },
                isSelected && styles.tileSelected,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleQuizSelection(item.id);
              }}
            >
              <Text style={styles.tileLabel}>{item.label}</Text>
              {isSelected && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </Pressable>
          );
        }}
      />

      <View style={styles.bottom}>
        <Text style={styles.countText}>
          {quizSelections.length}/{MIN_SELECTIONS} selected
        </Text>
        <Pressable
          style={[
            styles.finishButton,
            quizSelections.length < MIN_SELECTIONS &&
              styles.finishButtonDisabled,
          ]}
          disabled={quizSelections.length < MIN_SELECTIONS}
          onPress={handleFinish}
        >
          <Text style={styles.finishButtonText}>Done</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.horizontalPadding,
    paddingVertical: 12,
  },
  backText: {
    fontFamily: "Inter_300Light",
    fontSize: 14,
    color: "#777777",
  },
  intro: {
    paddingHorizontal: spacing.horizontalPadding,
    marginBottom: 24,
  },
  title: {
    ...typography.headline,
    fontSize: 28,
    lineHeight: 28 * 1.2,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
  grid: {
    paddingHorizontal: spacing.horizontalPadding,
    paddingBottom: 100,
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE * 1.3,
    borderRadius: 12,
    justifyContent: "flex-end",
    padding: 12,
  },
  tileSelected: {
    borderWidth: 2,
    borderColor: colors.textPrimary,
  },
  tileLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  checkmark: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.textPrimary,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: {
    fontSize: 14,
    color: colors.background,
    fontWeight: "600",
  },
  bottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.horizontalPadding,
    paddingVertical: 16,
    paddingBottom: 40,
    backgroundColor: "rgba(13,13,13,0.95)",
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  countText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: colors.textMuted,
  },
  finishButton: {
    backgroundColor: colors.textPrimary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  finishButtonDisabled: {
    opacity: 0.3,
  },
  finishButtonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: colors.background,
  },
});
```

- [ ] **Step 2: Verify style quiz**

```bash
cd client
npx expo start
```

Expected: Navigate to style quiz. Shows grid of outfit tiles. Tap to select (shows checkmark + border). Counter at bottom. "Done" button disabled until 5 selected.

- [ ] **Step 3: Commit**

```bash
git add client/app/style-quiz/index.tsx
git commit -m "feat(client): add style quiz with visual outfit picker

2-column grid of outfit style tiles. Tap to select with haptic
feedback and visual checkmark. Minimum 5 selections required.
Saves quiz completion to profile on finish."
```

---

### Task 13: RevenueCat Integration

**Files:**
- Create: `client/lib/revenuecat.ts`
- Modify: `client/app/_layout.tsx`

- [ ] **Step 1: Install RevenueCat SDK**

```bash
cd client
npm install react-native-purchases
```

- [ ] **Step 2: Create RevenueCat setup module**

Create `client/lib/revenuecat.ts`:

```ts
import Purchases from "react-native-purchases";
import { Platform } from "react-native";

const REVENUECAT_API_KEY_IOS =
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS ?? "";
const REVENUECAT_API_KEY_ANDROID =
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID ?? "";

export async function initRevenueCat(userId: string) {
  const apiKey =
    Platform.OS === "ios"
      ? REVENUECAT_API_KEY_IOS
      : REVENUECAT_API_KEY_ANDROID;

  if (!apiKey) return;

  Purchases.configure({ apiKey, appUserID: userId });
}

export async function getSubscriptionStatus(): Promise<{
  isPaid: boolean;
  willRenew: boolean;
}> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const isPaid =
      Object.keys(customerInfo.entitlements.active).length > 0;
    const activeEntitlement = Object.values(
      customerInfo.entitlements.active,
    )[0];

    return {
      isPaid,
      willRenew: activeEntitlement?.willRenew ?? false,
    };
  } catch {
    return { isPaid: false, willRenew: false };
  }
}

export async function getOfferings() {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch {
    return null;
  }
}

export async function purchasePackage(pkg: any) {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return Object.keys(customerInfo.entitlements.active).length > 0;
}

export async function restorePurchases() {
  const customerInfo = await Purchases.restorePurchases();
  return Object.keys(customerInfo.entitlements.active).length > 0;
}
```

- [ ] **Step 3: Initialize RevenueCat in auth provider**

Add RevenueCat initialization to `client/lib/auth-provider.tsx`. After the line `setSession(session);` inside the `onAuthStateChange` callback, add:

```tsx
if (session?.user?.id) {
  initRevenueCat(session.user.id);
}
```

Add the import at the top:

```tsx
import { initRevenueCat } from "./revenuecat";
```

Also add the same initialization inside the `getSession().then()` block, after `setSession(session);`:

```tsx
if (session?.user?.id) {
  initRevenueCat(session.user.id);
}
```

- [ ] **Step 4: Add env vars placeholder**

Append to `client/.env.local`:

```
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=
```

- [ ] **Step 5: Commit**

```bash
git add client/lib/revenuecat.ts client/lib/auth-provider.tsx
git commit -m "feat(client): add RevenueCat integration for subscriptions

Configure RevenueCat with user ID on auth, get subscription status,
offerings, purchase, and restore purchases. Initialized in auth provider."
```

---

## Post-Plan Notes

### Testing Strategy

Unit testing for React Native UI components is less valuable than integration testing with the actual backend. The recommended testing approach:

1. Run `supabase start` locally for the full backend
2. Use Expo Go on a device/simulator for manual testing
3. Write E2E tests with Detox or Maestro in a future iteration (out of scope for v1)

### Running the Full Stack

```bash
# Terminal 1: Start Supabase
cd /Users/ronmrls/claude-code/projects/juno
supabase start

# Terminal 2: Start Expo
cd /Users/ronmrls/claude-code/projects/juno/client
npx expo start
```

### Environment Variables

The client needs these env vars in `client/.env.local`:

```
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<from supabase start output>
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=<from RevenueCat dashboard>
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=<from RevenueCat dashboard>
```
