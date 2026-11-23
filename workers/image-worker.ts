/// <reference lib="webworker" />
import type { WorkerRequest, WorkerResponse } from "./protocol";
import type { CompressJob, CompressOutcome, EncodeFormat } from "@/lib/image/compress";
import type { ResizeJob } from "@/lib/image/resize";

/** Codec work happens here so the UI thread never freezes. WASM codecs are
 * dynamically imported so a browser only loads the encoders it uses. */

const cancelled = new Set<string>();

function post(message: WorkerResponse<CompressOutcome>) {
  self.postMessage(message);
}

function isCancelled(id: string): boolean {
  return cancelled.has(id);
}

function bitmapToImageData(bitmap: ImageBitmap): ImageData {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("unknown: OffscreenCanvas 2D context unavailable");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
}

function flattenAlpha(imageData: ImageData, bg: [number, number, number]): void {
  const px = imageData.data;
  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3] / 255;
    px[i] = Math.round(px[i] * a + bg[0] * (1 - a));
    px[i + 1] = Math.round(px[i + 1] * a + bg[1] * (1 - a));
    px[i + 2] = Math.round(px[i + 2] * a + bg[2] * (1 - a));
    px[i + 3] = 255;
  }
}

async function encodeFormat(
  format: EncodeFormat,
  imageData: ImageData,
  quality: number,
): Promise<ArrayBuffer> {
  switch (format) {
    case "jpeg": {
      const { encode } = await import("@jsquash/jpeg");
      return encode(imageData, { quality });
    }
    case "webp": {
      const { encode } = await import("@jsquash/webp");
      return encode(imageData, { quality });
    }
    case "avif": {
      const { encode } = await import("@jsquash/avif");
      return encode(imageData, { quality });
    }
    case "png": {
      const { encode } = await import("@jsquash/png");
      return encode(imageData); // lossless; quality does not apply
    }
  }
}

const SEARCH_STEPS = 7;

async function runResize(job: ResizeJob, id: string): Promise<void> {
  try {
    const bw = job.bitmap.width;
    const bh = job.bitmap.height;
    let tw: number;
    let th: number;
    let fit: "cover" | "contain" | "stretch" = "stretch";

    if (job.percent !== undefined) {
      tw = Math.max(1, Math.round((bw * job.percent) / 100));
      th = Math.max(1, Math.round((bh * job.percent) / 100));
    } else {
      tw = Math.max(1, job.width ?? bw);
      if (job.fit) {
        th = Math.max(1, job.height ?? bh);
        fit = job.fit;
      } else {
        th = job.lockAspect
          ? Math.max(1, Math.round((tw * bh) / bw))
          : Math.max(1, job.height ?? bh);
      }
    }

    const canvas = new OffscreenCanvas(tw, th);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("unknown: OffscreenCanvas 2D context unavailable");

    if (fit === "cover") {
      // Fill the target and crop to the center.
      const scale = Math.max(tw / bw, th / bh);
      const sw = tw / scale;
      const sh = th / scale;
      ctx.drawImage(job.bitmap, (bw - sw) / 2, (bh - sh) / 2, sw, sh, 0, 0, tw, th);
    } else if (fit === "contain") {
      // Fit inside the target, centered.
      const scale = Math.min(tw / bw, th / bh);
      const dw = bw * scale;
      const dh = bh * scale;
      ctx.drawImage(job.bitmap, (tw - dw) / 2, (th - dh) / 2, dw, dh);
    } else {
      ctx.drawImage(job.bitmap, 0, 0, tw, th);
    }
    job.bitmap.close();

    const imageData = ctx.getImageData(0, 0, tw, th);
    if (job.backgroundColor) flattenAlpha(imageData, job.backgroundColor);
    const bytes = await encodeFormat(job.format, imageData, job.quality);
    post({ id, type: "success", result: {
      bytes, width: tw, height: th, targetReached: null,
    } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const code = message.startsWith("memory") ? "memory" : "unknown";
    post({ id, type: "error", code, message });
  }
}

async function runCompress(job: CompressJob, id: string): Promise<void> {
  try {
    const imageData = bitmapToImageData(job.bitmap);
    if (job.backgroundColor) flattenAlpha(imageData, job.backgroundColor);

    if (job.targetBytes === undefined) {
      const bytes = await encodeFormat(job.format, imageData, job.quality);
      post({ id, type: "success", result: {
        bytes, width: imageData.width, height: imageData.height, targetReached: null,
      } });
      return;
    }

    // Target size mode: binary search for the highest quality that fits.
    let lo = 1;
    let hi = 100;
    let best: ArrayBuffer | null = null;
    let smallest: ArrayBuffer | null = null;
    for (let step = 0; step < SEARCH_STEPS && lo <= hi; step++) {
      if (isCancelled(id)) return;
      const quality = Math.floor((lo + hi) / 2);
      const bytes = await encodeFormat(job.format, imageData, quality);
      if (!smallest || bytes.byteLength < smallest.byteLength) smallest = bytes;
      if (bytes.byteLength <= job.targetBytes) {
        best = bytes;
        lo = quality + 1;
      } else {
        hi = quality - 1;
      }
      post({ id, type: "progress", progress: (step + 1) / SEARCH_STEPS });
    }

    if (isCancelled(id)) return;
    const bytes = best ?? smallest;
    if (!bytes) throw new Error("unknown: encoding produced no output");
    post({ id, type: "success", result: {
      bytes,
      width: imageData.width,
      height: imageData.height,
      targetReached: best !== null,
    } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const code = message.startsWith("memory") ? "memory" : "unknown";
    post({ id, type: "error", code, message });
  }
}

self.onmessage = (event: MessageEvent<WorkerRequest<CompressJob | ResizeJob>>) => {
  const request = event.data;
  if (request.type === "cancel") {
    cancelled.add(request.id);
    return;
  }
  cancelled.delete(request.id);
  if (request.job.kind === "compress") {
    void runCompress(request.job, request.id);
  } else if (request.job.kind === "resize") {
    void runResize(request.job, request.id);
  }
};
