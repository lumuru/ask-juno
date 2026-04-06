// supabase/functions/_shared/cap-check_test.ts

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  computeWeekStart,
  determineModel,
  evaluateCap,
} from "./cap-check.ts";

Deno.test("computeWeekStart: Monday stays Monday", () => {
  const result = computeWeekStart("2026-04-06T10:00:00Z", "UTC");
  assertEquals(result, "2026-04-06");
});

Deno.test("computeWeekStart: Wednesday rolls back to Monday", () => {
  const result = computeWeekStart("2026-04-08T10:00:00Z", "UTC");
  assertEquals(result, "2026-04-06");
});

Deno.test("computeWeekStart: Sunday rolls back to Monday", () => {
  const result = computeWeekStart("2026-04-12T23:59:00Z", "UTC");
  assertEquals(result, "2026-04-06");
});

Deno.test("determineModel: force override wins", () => {
  assertEquals(
    determineModel(false, "claude-sonnet-4-6", "claude-haiku-4-5-20251001", "claude-opus-4-6"),
    "claude-opus-4-6",
  );
});

Deno.test("determineModel: paid user gets paid model", () => {
  assertEquals(
    determineModel(true, "claude-sonnet-4-6", "claude-haiku-4-5-20251001", null),
    "claude-sonnet-4-6",
  );
});

Deno.test("determineModel: free user gets free model", () => {
  assertEquals(
    determineModel(false, "claude-sonnet-4-6", "claude-haiku-4-5-20251001", null),
    "claude-haiku-4-5-20251001",
  );
});

Deno.test("evaluateCap: free user under cap is allowed", () => {
  const result = evaluateCap({
    isPaid: false,
    reviewCount: 3,
    freeCapPerWeek: 5,
    paidDailyCap: 50,
  });
  assertEquals(result.allowed, true);
});

Deno.test("evaluateCap: free user at cap is blocked", () => {
  const result = evaluateCap({
    isPaid: false,
    reviewCount: 5,
    freeCapPerWeek: 5,
    paidDailyCap: 50,
  });
  assertEquals(result.allowed, false);
  assertEquals(result.reason, "cap_reached");
});

Deno.test("evaluateCap: paid user under daily cap is allowed", () => {
  const result = evaluateCap({
    isPaid: true,
    reviewCount: 30,
    freeCapPerWeek: 5,
    paidDailyCap: 50,
  });
  assertEquals(result.allowed, true);
});

Deno.test("evaluateCap: paid user at daily cap is blocked", () => {
  const result = evaluateCap({
    isPaid: true,
    reviewCount: 50,
    freeCapPerWeek: 5,
    paidDailyCap: 50,
  });
  assertEquals(result.allowed, false);
  assertEquals(result.reason, "paid_daily_cap");
});
