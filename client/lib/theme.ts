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
