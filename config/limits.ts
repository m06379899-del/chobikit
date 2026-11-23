/**
 * DEFAULT values — the project owner has not set final limits yet.
 * Change here when decided (see chobikit-master-prompt.md section 3.4).
 */
export const IMAGE_LIMITS = {
  /** Maximum size per image, in MB. */
  maxFileSizeMB: 50,
  /** Maximum number of images in one batch. */
  maxBatchSize: 50,
} as const;
