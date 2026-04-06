// supabase/functions/_shared/review-schema_test.ts

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validateReviewOutput } from "./review-schema.ts";

function validReview() {
  return {
    verdict: "pass",
    score: 8.5,
    item: {
      name: "Linen blazer",
      category: "outerwear",
      brand_guess_or_null: "Zara",
      color_tags: ["navy", "blue"],
    },
    price_ballpark: { low: 60, high: 100, currency: "USD", confidence: "medium" },
    sections: {
      first_impression: "Clean lines.",
      style_read: "Modern minimalism.",
      originality: "Nothing groundbreaking.",
      construction: "Decent for the price.",
      color_story: "Navy is versatile.",
      occasion_fit: "Office or evening.",
      pairing: "White tee, dark jeans.",
      alternatives: "COS or Arket.",
      critique: "Lapels could be slimmer.",
      final_word: "A solid buy.",
    },
    safety_flag: null,
  };
}

Deno.test("validateReviewOutput: valid review passes", () => {
  const result = validateReviewOutput(validReview());
  assertEquals(result.valid, true);
});

Deno.test("validateReviewOutput: missing verdict fails", () => {
  const review = validReview();
  delete (review as Record<string, unknown>).verdict;
  const result = validateReviewOutput(review);
  assertEquals(result.valid, false);
  assertExists(result.error);
});

Deno.test("validateReviewOutput: score out of range fails", () => {
  const review = validReview();
  review.score = 11;
  const result = validateReviewOutput(review);
  assertEquals(result.valid, false);
});

Deno.test("validateReviewOutput: negative score fails", () => {
  const review = validReview();
  review.score = -1;
  const result = validateReviewOutput(review);
  assertEquals(result.valid, false);
});

Deno.test("validateReviewOutput: verdict/score mismatch — pass with 4.0", () => {
  const review = validReview();
  review.verdict = "pass";
  review.score = 4.0;
  const result = validateReviewOutput(review);
  assertEquals(result.valid, false);
  assertEquals(result.error, "verdict/score mismatch");
});

Deno.test("validateReviewOutput: verdict/score mismatch — no with 8.0", () => {
  const review = validReview();
  review.verdict = "no";
  review.score = 8.0;
  const result = validateReviewOutput(review);
  assertEquals(result.valid, false);
  assertEquals(result.error, "verdict/score mismatch");
});

Deno.test("validateReviewOutput: conditional with 5.5 is valid", () => {
  const review = validReview();
  review.verdict = "conditional";
  review.score = 5.5;
  const result = validateReviewOutput(review);
  assertEquals(result.valid, true);
});

Deno.test("validateReviewOutput: missing required section fails", () => {
  const review = validReview();
  delete (review.sections as Record<string, unknown>).first_impression;
  const result = validateReviewOutput(review);
  assertEquals(result.valid, false);
});

Deno.test("validateReviewOutput: fit_for_you is optional", () => {
  const review = validReview();
  const result = validateReviewOutput(review);
  assertEquals(result.valid, true);
});

Deno.test("validateReviewOutput: safety_flag review skips section checks", () => {
  const review = {
    verdict: "no",
    score: 0,
    item: { name: "", category: "", brand_guess_or_null: null, color_tags: [] },
    price_ballpark: null,
    sections: { first_impression: "No item detected.", final_word: "" },
    safety_flag: "no_item",
  };
  const result = validateReviewOutput(review);
  assertEquals(result.valid, true);
});
