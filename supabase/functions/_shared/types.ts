// supabase/functions/_shared/types.ts

export type ReviewContext = "store" | "online" | "home";
export type ReviewVerdict = "pass" | "conditional" | "no";
export type SafetyFlag = "no_item" | "person_only" | "inappropriate" | "refused";
export type ProfileLevel = "A" | "B" | "C";
export type SubscriptionStatus = "free" | "trial" | "active" | "expired" | "cancelled";

export interface Profile {
  user_id: string;
  level: ProfileLevel;
  height_cm: number | null;
  weight_kg: number | null;
  size_top: string | null;
  size_bottom: string | null;
  shoe_size: string | null;
  age: number | null;
  gender_presentation: string | null;
  budget_tier: string | null;
  color_undertone: string | null;
  body_shape: string | null;
  occasion_tags: string[];
  style_vetoes: string[];
  stylist_voice_id: string | null;
  timezone: string;
}

export interface StylistVoice {
  id: string;
  slug: string;
  name: string;
  prompt_system: string;
  prompt_user_template: string;
  is_premium: boolean;
  version: number;
}

export interface ReviewRequest {
  photo_storage_path: string;
  context: ReviewContext;
}

export interface ReviewItem {
  name: string;
  category: string;
  brand_guess_or_null: string | null;
  color_tags: string[];
}

export interface PriceBallpark {
  low: number;
  high: number;
  currency: string;
  confidence: string;
}

export interface ReviewSections {
  first_impression: string;
  fit_for_you?: string;
  style_read: string;
  originality: string;
  construction: string;
  color_story: string;
  occasion_fit: string;
  pairing: string;
  alternatives: string;
  critique: string;
  final_word: string;
}

export interface ReviewOutput {
  verdict: ReviewVerdict;
  score: number;
  item: ReviewItem;
  price_ballpark: PriceBallpark | null;
  sections: ReviewSections;
  safety_flag: SafetyFlag | null;
}

export interface CapCheckResult {
  allowed: boolean;
  reason?: "cap_reached" | "paid_daily_cap";
  reset_at?: string;
  current_count: number;
  model: string;
  is_paid: boolean;
}

export interface AppConfig {
  free_tier_reviews_per_week: number;
  paid_daily_cap: number;
  claude_model_free: string;
  claude_model_paid: string;
  prompt_version_active: string;
  daily_cost_cap_cents: number;
  force_model_for_all: string | null;
  default_voice: string;
}
