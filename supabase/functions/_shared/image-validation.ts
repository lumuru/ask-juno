// supabase/functions/_shared/image-validation.ts

const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const HEIC_BRANDS = new Set(["heic", "heix", "hevc", "hevx"]);
const HEIF_BRANDS = new Set(["mif1", "msf1"]);

function startsWith(bytes: Uint8Array, magic: number[]): boolean {
  if (bytes.length < magic.length) return false;
  return magic.every((b, i) => bytes[i] === b);
}

export function detectMimeType(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;

  if (startsWith(bytes, JPEG_MAGIC)) return "image/jpeg";
  if (startsWith(bytes, PNG_MAGIC)) return "image/png";

  // ISOBMFF: bytes 4-7 = "ftyp", bytes 8-11 = brand
  const ftyp = new TextDecoder().decode(bytes.slice(4, 8));
  if (ftyp === "ftyp") {
    const brand = new TextDecoder().decode(bytes.slice(8, 12));
    if (HEIC_BRANDS.has(brand)) return "image/heic";
    if (HEIF_BRANDS.has(brand)) return "image/heif";
  }

  return null;
}

export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
]);
