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
