/// <reference lib="webworker" />
import mozjpegFactory from "@jsquash/jpeg/codec/enc/mozjpeg_enc.js";
import webpFactory from "@jsquash/webp/codec/enc/webp_enc.js";
import webpSimdFactory from "@jsquash/webp/codec/enc/webp_enc_simd.js";
import avifFactory from "@jsquash/avif/codec/enc/avif_enc.js";
import { encode as pngEncode, default as pngInit } from "@jsquash/png/codec/pkg/squoosh_png.js";
import { simd } from "wasm-feature-detect";
import type { WorkerRequest, WorkerResponse } from "./protocol";
import type { CompressJob, CompressOutcome, EncodeFormat } from "@/lib/image/compress";
import type { ResizeJob } from "@/lib/image/resize";

/** IMPORTANT: this worker must stay free of dynamic imports. Webpack's
 * async chunk loader uses `document`, which does not exist in a worker,
 * so any import() here would crash. All codec modules are statically
 * imported and bundled into this single file; only the .wasm binaries
 * are fetched from /wasm/ (same-origin, works offline, CSP-friendly). */

const codecModules = new Map<string, Promise<EmscriptenCodecModule>>();

async function compileWasm(url: string): Promise<WebAssembly.Module> {
  try {
    return await WebAssembly.compileStreaming(fetch(url));
  } catch {
    // Some servers do not send the application/wasm MIME type.
    return WebAssembly.compile(await (await fetch(url)).arrayBuffer());
  }
}

async function loadEmscriptenCodec(
  key: string,
  factory: (opts?: Record<string, unknown>) => Promise<EmscriptenCodecModule>,
  wasmUrl: string,
): Promise<EmscriptenCodecModule> {
  const cached = codecModules.get(key);
  if (cached) return cached;
  const promise = (async () => {
    const wasmModule = await compileWasm(wasmUrl);
    return factory({
      noInitialRun: true,
      instantiateWasm: (imports: WebAssembly.Imports, callback: (i: WebAssembly.Instance) => void) => {
        const instance = new WebAssembly.Instance(wasmModule, imports);
        callback(instance);
        return instance.exports;
      },
    });
  })();
  codecModules.set(key, promise);
  return promise;
}

// Codec defaults replicated from @jsquash meta files so the full option
// objects reach the wasm encoders (the lib wrappers are not used here).
const JPEG_DEFAULTS = {
  quality: 75, baseline: false, arithmetic: false, progressive: true,
  optimize_coding: true, smoothing: 0, color_space: 3, quant_table: 3,
  trellis_multipass: false, trellis_opt_zero: false, trellis_opt_table: false,
  trellis_loops: 1, auto_subsample: true, chroma_subsample: 2,
  separate_chroma_quality: false, chroma_quality: 75,
};
const WEBP_DEFAULTS = {
  quality: 75, target_size: 0, target_PSNR: 0, method: 4, sns_strength: 50,
  filter_strength: 60, filter_sharpness: 0, filter_type: 1, partitions: 0,
  segments: 4, pass: 1, show_compressed: 0, preprocessing: 0, autofilter: 0,
  partition_limit: 0, alpha_compression: 1, alpha_filtering: 1, alpha_quality: 100,
  lossless: 0, exact: 0, image_hint: 0, emulate_jpeg_size: 0, thread_level: 0,
  low_memory: 0, near_lossless: 100, use_delta_palette: 0, use_sharp_yuv: 0,
};
const AVIF_DEFAULTS = {
  quality: 50, qualityAlpha: -1, denoiseLevel: 0, tileColsLog2: 0, tileRowsLog2: 0,
  speed: 6, subsample: 1, chromaDeltaQ: false, sharpness: 0, tune: 0,
  enableSharpYUV: false, bitDepth: 8, lossless: false,
};

async function encodeFormat(
  format: EncodeFormat,
  imageData: ImageData,
  quality: number,
): Promise<ArrayBuffer> {
  switch (format) {
    case "jpeg": {
      const jpegCodec = await loadEmscriptenCodec("jpeg", mozjpegFactory, "/wasm/mozjpeg_enc.wasm");
      return jpegCodec.encode(imageData.data, imageData.width, imageData.height, { ...JPEG_DEFAULTS, quality }).buffer as ArrayBuffer;
    }
    case "webp": {
      const useSimd = await simd();
      const webpCodec = useSimd
                ? await loadEmscriptenCodec("webp-simd", webpSimdFactory, "/wasm/webp_enc_simd.wasm")
        : await loadEmscriptenCodec("webp", webpFactory, "/wasm/webp_enc.wasm");
      const result = webpCodec.encode(imageData.data, imageData.width, imageData.height, { ...WEBP_DEFAULTS, quality });
      if (!result) throw new Error("unknown: webp encoding produced no output");
      return result.buffer as ArrayBuffer;
    }
    case "avif": {
      const avifCodec = await loadEmscriptenCodec("avif", avifFactory, "/wasm/avif_enc.wasm");
      const result = avifCodec.encode(new Uint8Array(imageData.data.buffer), imageData.width, imageData.height, { ...AVIF_DEFAULTS, quality });
      if (!result) throw new Error("unknown: avif encoding produced no output");
      return result.buffer as ArrayBuffer;
    }
    case "png": {
      await pngInit("/wasm/squoosh_png_bg.wasm");
      const output = await pngEncode(new Uint8Array(imageData.data.buffer), imageData.width, imageData.height, 8);
      if (!output) throw new Error("unknown: png encoding produced no output");
      return output.buffer as ArrayBuffer;
    }
  }
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

function bitmapToImageData(bitmap: ImageBitmap): ImageData {
  // Capture dimensions BEFORE closing: a closed ImageBitmap reports width 0.
  const width = bitmap.width;
  const height = bitmap.height;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("unknown: OffscreenCanvas 2D context unavailable");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return ctx.getImageData(0, 0, width, height);
}

const cancelled = new Set<string>();

function post(message: WorkerResponse<CompressOutcome>) {
  self.postMessage(message);
}

function isCancelled(id: string): boolean {
  return cancelled.has(id);
}

const SEARCH_STEPS = 7;

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
      const scale = Math.max(tw / bw, th / bh);
      const sw = tw / scale;
      const sh = th / scale;
      ctx.drawImage(job.bitmap, (bw - sw) / 2, (bh - sh) / 2, sw, sh, 0, 0, tw, th);
    } else if (fit === "contain") {
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
