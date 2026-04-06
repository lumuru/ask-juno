// supabase/functions/_shared/review-schema.ts

import type { ReviewOutput, ReviewVerdict } from "./types.ts";

interface ValidationResult {
  valid: boolean;
  error?: string;
}

const VERDICTS = new Set(["pass", "conditional", "no"]);
const SAFETY_FLAGS = new Set(["no_item", "person_only", "inappropriate", "refused"]);

const REQUIRED_SECTIONS = [
  "first_impression",
  "style_read",
  "originality",
  "construction",
  "color_story",
  "occasion_fit",
  "pairing",
  "alternatives",
  "critique",
  "final_word",
];

function verdictMatchesScore(verdict: ReviewVerdict, score: number): boolean {
  if (verdict === "pass") return score >= 7.0;
  if (verdict === "conditional") return score >= 5.0 && score <= 6.9;
  if (verdict === "no") return score <= 4.9;
  return false;
}

export function validateReviewOutput(
  output: unknown,
): ValidationResult {
  if (!output || typeof output !== "object") {
    return { valid: false, error: "output is not an object" };
  }

  const o = output as Record<string, unknown>;

  if (!o.verdict || !VERDICTS.has(o.verdict as string)) {
    return { valid: false, error: "missing or invalid verdict" };
  }

  if (typeof o.score !== "number" || o.score < 0 || o.score > 10) {
    return { valid: false, error: "score must be 0-10" };
  }

  if (o.safety_flag != null) {
    if (!SAFETY_FLAGS.has(o.safety_flag as string)) {
      return { valid: false, error: "invalid safety_flag" };
    }
    return { valid: true };
  }

  if (!verdictMatchesScore(o.verdict as ReviewVerdict, o.score as number)) {
    return { valid: false, error: "verdict/score mismatch" };
  }

  if (!o.item || typeof o.item !== "object") {
    return { valid: false, error: "missing item" };
  }

  if (!o.sections || typeof o.sections !== "object") {
    return { valid: false, error: "missing sections" };
  }
  const sections = o.sections as Record<string, unknown>;
  for (const key of REQUIRED_SECTIONS) {
    if (typeof sections[key] !== "string") {
      return { valid: false, error: `missing section: ${key}` };
    }
  }

  return { valid: true };
}

export function parseReviewJson(text: string): ReviewOutput | null {
  const cleaned = text
    .replace(/^```json?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}
