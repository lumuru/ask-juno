// supabase/functions/_shared/image-validation_test.ts

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { detectMimeType } from "./image-validation.ts";

Deno.test("detectMimeType: JPEG", () => {
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
  assertEquals(detectMimeType(bytes), "image/jpeg");
});

Deno.test("detectMimeType: PNG", () => {
  const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  assertEquals(detectMimeType(bytes), "image/png");
});

Deno.test("detectMimeType: HEIC", () => {
  const bytes = new Uint8Array(12);
  bytes.set([0, 0, 0, 0x1c], 0);
  bytes.set(new TextEncoder().encode("ftypheic"), 4);
  assertEquals(detectMimeType(bytes), "image/heic");
});

Deno.test("detectMimeType: HEIF (mif1)", () => {
  const bytes = new Uint8Array(12);
  bytes.set([0, 0, 0, 0x1c], 0);
  bytes.set(new TextEncoder().encode("ftypmif1"), 4);
  assertEquals(detectMimeType(bytes), "image/heif");
});

Deno.test("detectMimeType: unknown", () => {
  const bytes = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  assertEquals(detectMimeType(bytes), null);
});

Deno.test("detectMimeType: too few bytes", () => {
  const bytes = new Uint8Array([0xff, 0xd8]);
  assertEquals(detectMimeType(bytes), null);
});
