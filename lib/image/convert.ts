import type { EncodeFormat } from "./compress";

export interface ConvertSettings {
  format: EncodeFormat;
  /** 1..100, ignored by PNG. */
  quality: number;
  /** Flattened behind transparency when the output is JPEG. */
  bgColor: string;
}

export const DEFAULT_CONVERT_SETTINGS: ConvertSettings = {
  format: "jpeg",
  quality: 80,
  bgColor: "#ffffff",
};

/** "#rrggbb" -> [r, g, b] */
export function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
  const num = Number.parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function isHeic(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ext === "heic" || ext === "heif" || file.type === "image/heic";
}

/**
 * iPhone HEIC photos are decoded on the main thread with heic2any (lazy
 * loaded) and handed to the pipeline as a PNG blob, which every browser
 * can then process in the worker.
 */
export async function decodeHeic(file: File): Promise<Blob> {
  const { default: heic2any } = await import("heic2any");
  const result = await heic2any({ blob: file, toType: "image/png" });
  return Array.isArray(result) ? result[0] : result;
}
