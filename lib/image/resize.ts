import type { EncodeFormat } from "./compress";

export interface ResizeSettings {
  mode: "dimensions" | "percent";
  width: number;
  height: number;
  /** On by default: editing width keeps the width/height ratio. */
  lockAspect: boolean;
  percent: number;
  /** Active preset id, or null for custom dimensions. */
  presetId: string | null;
  fit: "contain" | "cover";
  format: EncodeFormat | "same";
  quality: number;
}

export const DEFAULT_RESIZE_SETTINGS: ResizeSettings = {
  mode: "dimensions",
  width: 1920,
  height: 1080,
  lockAspect: true,
  percent: 100,
  presetId: null,
  fit: "cover",
  format: "same",
  quality: 80,
};

export interface ResizeJob {
  kind: "resize";
  bitmap: ImageBitmap;
  /** Custom/preset target size in pixels. */
  width?: number;
  height?: number;
  lockAspect?: boolean;
  /** Percent mode: scale both sides by this amount. */
  percent?: number;
  /** Preset fit: canvas stays at the preset size, content contain/cover. */
  fit?: "contain" | "cover";
  format: EncodeFormat;
  quality: number;
  backgroundColor?: [number, number, number];
}

/** Result files get a size suffix so they are easy to tell apart. */
export function resizeOutputName(
  file: File,
  format: EncodeFormat,
  width: number,
  height: number,
): string {
  const base = file.name.replace(/\.[^.]+$/, "");
  const ext = format === "jpeg" ? "jpg" : format;
  return `${base}-${width}x${height}.${ext}`;
}
