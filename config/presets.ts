/**
 * Data-driven resize presets (owner can add more here — the UI and
 * translations pick them up automatically).
 */
export interface ResizePreset {
  /** Translation key under the "presets" namespace. */
  id: string;
  width: number;
  height: number;
}

export const RESIZE_PRESETS: ResizePreset[] = [
  { id: "facebookPost", width: 1200, height: 630 },
  { id: "facebookCover", width: 851, height: 315 },
  { id: "instagramSquare", width: 1080, height: 1080 },
  { id: "instagramStory", width: 1080, height: 1920 },
  { id: "youtubeThumbnail", width: 1280, height: 720 },
  { id: "whatsappDp", width: 640, height: 640 },
  { id: "passport", width: 600, height: 600 },
];
