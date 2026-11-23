export type EncodeFormat = "jpeg" | "png" | "webp" | "avif";

export interface CompressSettings {
  /** 1..100, used when target mode is off. */
  quality: number;
  /** "Make it under ___ KB" binary-search mode. */
  targetMode: boolean;
  targetKB: number;
  /** Output format; "same" keeps the original file's format. */
  format: EncodeFormat | "same";
}

export const DEFAULT_COMPRESS_SETTINGS: CompressSettings = {
  quality: 80,
  targetMode: false,
  targetKB: 200,
  format: "same",
};

export const FORMAT_MIME: Record<EncodeFormat, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

const FORMAT_EXT: Record<EncodeFormat, string> = {
  jpeg: "jpg",
  png: "png",
  webp: "webp",
  avif: "avif",
};

/** Resolve "same as original" to a concrete format. GIF/BMP/HEIC decode to PNG. */
export function resolveFormat(file: File, choice: EncodeFormat | "same"): EncodeFormat {
  if (choice !== "same") return choice;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "jpg" || ext === "jpeg") return "jpeg";
  if (ext === "webp") return "webp";
  if (ext === "avif") return "avif";
  return "png"; // png, gif, bmp, heic/heif
}

export function outputName(file: File, format: EncodeFormat): string {
  const base = file.name.replace(/\.[^.]+$/, "");
  return `${base}.${FORMAT_EXT[format]}`;
}

/** Job posted to the image worker (bitmap is transferred, not copied). */
export interface CompressJob {
  kind: "compress";
  bitmap: ImageBitmap;
  format: EncodeFormat;
  /** 1..100; ignored by lossless PNG. */
  quality: number;
  /** When set, the worker binary-searches quality to fit under this size. */
  targetBytes?: number;
}

export interface CompressOutcome {
  bytes: ArrayBuffer;
  width: number;
  height: number;
  /** null when no target size was requested. */
  targetReached: boolean | null;
}
