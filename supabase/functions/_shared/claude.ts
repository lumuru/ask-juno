// supabase/functions/_shared/claude.ts

import Anthropic from "@anthropic-ai/sdk";
import type { ReviewOutput } from "./types.ts";
import { parseReviewJson, validateReviewOutput } from "./review-schema.ts";

interface ClaudeReviewRequest {
  systemPrompt: string;
  userPrompt: string;
  imageBase64: string;
  imageMimeType: string;
  model: string;
}

interface ClaudeReviewResult {
  review: ReviewOutput;
  inputTokens: number;
  outputTokens: number;
}

export async function callClaudeForReview(
  req: ClaudeReviewRequest,
): Promise<ClaudeReviewResult> {
  const client = new Anthropic({
    apiKey: Deno.env.get("ANTHROPIC_API_KEY")!,
  });

  const makeRequest = (extraInstruction?: string) =>
    client.messages.create({
      model: req.model,
      max_tokens: 4096,
      system: req.systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: req.imageMimeType as
                  | "image/jpeg"
                  | "image/png"
                  | "image/gif"
                  | "image/webp",
                data: req.imageBase64,
              },
            },
            {
              type: "text",
              text: extraInstruction
                ? `${req.userPrompt}\n\nIMPORTANT: ${extraInstruction}`
                : req.userPrompt,
            },
          ],
        },
      ],
    });

  // First attempt
  let response = await makeRequest();
  let textBlock = response.content.find((c) => c.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }

  let parsed = parseReviewJson(textBlock.text);
  if (parsed) {
    const validation = validateReviewOutput(parsed);
    if (validation.valid) {
      return {
        review: parsed as ReviewOutput,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      };
    }
  }

  // Retry once with stricter instruction
  response = await makeRequest(
    "Your previous response was malformed. Return ONLY valid JSON matching the exact schema. Ensure verdict and score are coherent per the calibration table.",
  );
  textBlock = response.content.find((c) => c.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content on retry");
  }

  parsed = parseReviewJson(textBlock.text);
  if (!parsed) {
    throw new Error("Claude returned invalid JSON on retry");
  }

  const validation = validateReviewOutput(parsed);
  if (!validation.valid) {
    throw new Error(`Review validation failed on retry: ${validation.error}`);
  }

  return {
    review: parsed as ReviewOutput,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

/**
 * Estimate cost in cents for a Claude API call.
 * Haiku: $0.80/M input, $4/M output
 * Sonnet: $3/M input, $15/M output
 */
export function estimateCostCents(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const isHaiku = model.includes("haiku");
  const inputRate = isHaiku ? 0.08 : 0.3; // cents per 1K tokens
  const outputRate = isHaiku ? 0.4 : 1.5;

  return Math.ceil(
    (inputTokens / 1000) * inputRate + (outputTokens / 1000) * outputRate,
  );
}
