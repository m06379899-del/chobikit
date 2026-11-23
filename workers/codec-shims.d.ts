/** Minimal typings for the deep codec imports used by the worker. */
interface EmscriptenCodecModule {
  encode(data: unknown, width?: number, height?: number, options?: unknown): Uint8Array;
}

declare module "@jsquash/jpeg/codec/enc/mozjpeg_enc.js" {
  const factory: (opts?: Record<string, unknown>) => Promise<EmscriptenCodecModule>;
  export default factory;
}

declare module "@jsquash/webp/codec/enc/webp_enc.js" {
  const factory: (opts?: Record<string, unknown>) => Promise<EmscriptenCodecModule>;
  export default factory;
}

declare module "@jsquash/webp/codec/enc/webp_enc_simd.js" {
  const factory: (opts?: Record<string, unknown>) => Promise<EmscriptenCodecModule>;
  export default factory;
}

declare module "@jsquash/avif/codec/enc/avif_enc.js" {
  const factory: (opts?: Record<string, unknown>) => Promise<EmscriptenCodecModule>;
  export default factory;
}

declare module "@jsquash/png/codec/pkg/squoosh_png.js" {
  export function encode(
    data: Uint8Array,
    width: number,
    height: number,
    bitDepth?: number,
  ): Promise<Uint8Array | null>;
  const init: (moduleOrPath?: string) => Promise<unknown>;
  export default init;
}
