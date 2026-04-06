// supabase/functions/_shared/prompt-builder.ts

import type { Profile, ReviewContext } from "./types.ts";

export function buildUserPrompt(
  profile: Profile,
  context: ReviewContext,
  voiceSlug: string,
): string {
  const profileFields: Record<string, unknown> = {};

  if (profile.height_cm != null) profileFields.height_cm = profile.height_cm;
  if (profile.weight_kg != null) profileFields.weight_kg = profile.weight_kg;
  if (profile.size_top != null) profileFields.size_top = profile.size_top;
  if (profile.size_bottom != null) profileFields.size_bottom = profile.size_bottom;
  if (profile.shoe_size != null) profileFields.shoe_size = profile.shoe_size;
  if (profile.age != null) profileFields.age = profile.age;
  if (profile.gender_presentation != null) {
    profileFields.gender_presentation = profile.gender_presentation;
  }
  if (profile.budget_tier != null) profileFields.budget_tier = profile.budget_tier;
  if (profile.color_undertone != null) profileFields.color_undertone = profile.color_undertone;
  if (profile.occasion_tags.length > 0) {
    profileFields.occasion_tags = profile.occasion_tags;
  }
  if (profile.style_vetoes.length > 0) {
    profileFields.style_vetoes = profile.style_vetoes;
  }

  const hasProfile = Object.keys(profileFields).length > 0;

  const lines = [
    hasProfile
      ? `Profile: ${JSON.stringify(profileFields)}`
      : "No profile provided — omit the fit_for_you section entirely.",
    `Context: ${context}`,
    `Voice: ${voiceSlug}`,
    "",
    "Review the clothing item in the attached image.",
  ];

  return lines.join("\n");
}
