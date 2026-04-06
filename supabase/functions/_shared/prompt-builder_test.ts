// supabase/functions/_shared/prompt-builder_test.ts

import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildUserPrompt } from "./prompt-builder.ts";
import type { Profile } from "./types.ts";

const baseProfile: Profile = {
  user_id: "abc",
  level: "A",
  height_cm: 175,
  weight_kg: null,
  size_top: "M",
  size_bottom: "32",
  shoe_size: "42",
  age: 28,
  gender_presentation: "masc",
  budget_tier: "mid",
  color_undertone: null,
  body_shape: null,
  occasion_tags: [],
  style_vetoes: [],
  stylist_voice_id: null,
  timezone: "UTC",
};

Deno.test("buildUserPrompt: includes profile fields", () => {
  const result = buildUserPrompt(baseProfile, "store", "parisian_editor");
  assertStringIncludes(result, "175");
  assertStringIncludes(result, "masc");
  assertStringIncludes(result, "store");
});

Deno.test("buildUserPrompt: omits null fields", () => {
  const result = buildUserPrompt(baseProfile, "online", "sassy_best_friend");
  assertEquals(result.includes("weight_kg"), false);
  assertEquals(result.includes("color_undertone"), false);
});

Deno.test("buildUserPrompt: empty profile produces minimal prompt", () => {
  const empty: Profile = {
    user_id: "abc",
    level: "A",
    height_cm: null,
    weight_kg: null,
    size_top: null,
    size_bottom: null,
    shoe_size: null,
    age: null,
    gender_presentation: null,
    budget_tier: null,
    color_undertone: null,
    body_shape: null,
    occasion_tags: [],
    style_vetoes: [],
    stylist_voice_id: null,
    timezone: "UTC",
  };
  const result = buildUserPrompt(empty, "home", "runway_critic");
  assertStringIncludes(result, "home");
  assertStringIncludes(result, "No profile");
});

Deno.test("buildUserPrompt: includes arrays when non-empty", () => {
  const profile = { ...baseProfile, occasion_tags: ["work", "date"], style_vetoes: ["neon"] };
  const result = buildUserPrompt(profile, "store", "parisian_editor");
  assertStringIncludes(result, "work");
  assertStringIncludes(result, "neon");
});
