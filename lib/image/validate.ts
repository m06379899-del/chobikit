import { IMAGE_LIMITS } from "@/config/limits";

export const SUPPORTED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "avif",
  "gif",
  "bmp",
  "heic",
  "heif",
] as const;

export type FileValidation =
  | { ok: true }
  | { ok: false; reason: "fileTooLarge" | "unsupported" };

export function getFileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

export function isSupportedImage(file: File): boolean {
  const ext = getFileExtension(file.name);
  if ((SUPPORTED_EXTENSIONS as readonly string[]).includes(ext)) return true;
  // Accept any raster image MIME the browser recognizes, but not SVG
  // (vector handling is out of scope for Phase 1).
  return (
    file.type.startsWith("image/") && file.type !== "image/svg+xml"
  );
}

export function validateImageFile(file: File): FileValidation {
  if (!isSupportedImage(file)) return { ok: false, reason: "unsupported" };
  if (file.size > IMAGE_LIMITS.maxFileSizeMB * 1024 * 1024) {
    return { ok: false, reason: "fileTooLarge" };
  }
  return { ok: true };
}

/**
 * Rough device-class heuristic: phones with few cores / little RAM get
 * gentler batch defaults (one image at a time, smaller batches).
 */
export function isLowPowerDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 8;
  const memory = nav.deviceMemory ?? 8;
  return cores <= 4 || memory <= 4;
}

/** Batch size above which low-power devices see a "may be slow" warning. */
export const LARGE_BATCH_WARNING = isLowPowerDevice() ? 8 : 20;
