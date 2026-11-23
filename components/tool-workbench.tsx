"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import DropZone from "@/components/drop-zone";
import ImageCard from "@/components/image-card";
import CompareSlider from "@/components/compare-slider";
import CompressControls from "@/components/tools/compress-controls";
import ConvertControls from "@/components/tools/convert-controls";
import ResizeControls from "@/components/tools/resize-controls";
import { useToolBatch } from "@/hooks/use-tool-batch";
import { zipAndDownload } from "@/lib/image/zip";
import { IMAGE_LIMITS } from "@/config/limits";
import { fireConfetti } from "@/lib/confetti";
import type { ToolId } from "@/lib/tools-registry";
import { WorkerClient } from "@/workers/worker-client";
import {
  DEFAULT_COMPRESS_SETTINGS,
  FORMAT_MIME,
  outputName,
  resolveFormat,
  type CompressJob,
  type CompressOutcome,
  type CompressSettings,
} from "@/lib/image/compress";
import {
  DEFAULT_CONVERT_SETTINGS,
  decodeHeic,
  hexToRgb,
  isHeic,
  type ConvertSettings,
} from "@/lib/image/convert";
import {
  DEFAULT_RESIZE_SETTINGS,
  resizeOutputName,
  type ResizeJob,
  type ResizeSettings,
} from "@/lib/image/resize";

const ERROR_KEYS: Record<string, "corrupt" | "memory" | "errorGeneric"> = {
  corrupt: "corrupt",
  memory: "memory",
  unknown: "errorGeneric",
};

/**
 * Client-side shell shared by all tool pages: drop zone, validated batch
 * list, tool controls, processing pipeline (Web Worker), and the bottom
 * action bar. Convert/resize join the pipeline in Milestones 4-5.
 */
export default function ToolWorkbench({ toolId }: { toolId: ToolId }) {
  const t = useTranslations("workbench");
  const tCompress = useTranslations("compress");
  const tConvert = useTranslations("convert");
  const tResize = useTranslations("resize");
  const batch = useToolBatch();

  const [settings, setSettings] = useState<Record<string, CompressSettings | ConvertSettings>>({});
  const [resizeSettings, setResizeSettings] = useState<ResizeSettings>(DEFAULT_RESIZE_SETTINGS);
  const [running, setRunning] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastTargetMissed, setLastTargetMissed] = useState(false);
  const [summaryPercent, setSummaryPercent] = useState<number | null>(null);

  const clientRef = useRef<WorkerClient<CompressJob | ResizeJob, CompressOutcome> | null>(null);
  const cancelRequested = useRef(false);
  const processingIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      clientRef.current?.dispose();
      clientRef.current = null;
    };
  }, []);

  const ensureClient = useCallback(() => {
    if (!clientRef.current) {
      clientRef.current = new WorkerClient(
        () =>
          new Worker(new URL("../workers/image-worker.ts", import.meta.url), {
            type: "module",
          }),
      );
    }
    return clientRef.current;
  }, []);

  function handleAddFiles(files: File[]) {
    setSummaryPercent(null);
    batch.addFiles(files);
  }

  function getSettings(id: string): CompressSettings | ConvertSettings {
    if (toolId === "convert") return settings[id] ?? DEFAULT_CONVERT_SETTINGS;
    return settings[id] ?? DEFAULT_COMPRESS_SETTINGS;
  }

  function updateSettings(id: string, next: CompressSettings | ConvertSettings) {
    setSettings((current) => ({ ...current, [id]: next }));
  }

  async function processAll() {
    if (batch.items.length === 0) return;
    const client = ensureClient();
    cancelRequested.current = false;
    setRunning(true);
    setLastTargetMissed(false);
    let targetMissed = false;
    let doneCount = 0;
    let originalTotal = 0;
    let resultTotal = 0;

    for (const item of batch.items) {
      if (cancelRequested.current) break;
      processingIdRef.current = item.id;
      batch.updateItem(item.id, { status: "processing", errorKey: undefined });
      try {
        // iPhone HEIC photos decode via heic2any on the main thread first.
        const source: Blob = isHeic(item.file) ? await decodeHeic(item.file) : item.file;
        // from-image applies EXIF orientation so photos come out upright.
        const bitmap = await createImageBitmap(source, {
          imageOrientation: "from-image",
        });
        let job: CompressJob | ResizeJob;
        let format: ReturnType<typeof resolveFormat>;
        if (toolId === "resize") {
          const rs = resizeSettings;
          format = resolveFormat(item.file, rs.format);
          job = {
            kind: "resize",
            bitmap,
            width: rs.mode === "dimensions" ? rs.width : undefined,
            height: rs.mode === "dimensions" ? rs.height : undefined,
            lockAspect: rs.mode === "dimensions" ? rs.lockAspect : undefined,
            percent: rs.mode === "percent" ? rs.percent : undefined,
            fit: rs.presetId ? rs.fit : undefined,
            format,
            quality: rs.quality,
            // JPEG has no alpha; letterboxed contain output flattens to white.
            backgroundColor:
              format === "jpeg" ? ([255, 255, 255] as [number, number, number]) : undefined,
          };
        } else {
          const toolSettings = getSettings(item.id);
          const isConvert = toolId === "convert";
          format = isConvert
            ? (toolSettings as ConvertSettings).format
            : resolveFormat(item.file, (toolSettings as CompressSettings).format);
          const quality = isConvert
            ? (toolSettings as ConvertSettings).quality
            : (toolSettings as CompressSettings).quality;
          const targetBytes =
            isConvert || !(toolSettings as CompressSettings).targetMode
              ? undefined
              : (toolSettings as CompressSettings).targetKB * 1024;
          const backgroundColor =
            isConvert && format === "jpeg"
              ? hexToRgb((toolSettings as ConvertSettings).bgColor)
              : undefined;
          job = {
            kind: "compress",
            bitmap,
            format,
            quality,
            targetBytes,
            backgroundColor,
          };
        }
        const outcome = await client.run(job);
        if (outcome.targetReached === false) targetMissed = true;
        const blob = new Blob([outcome.bytes], { type: FORMAT_MIME[format] });
        doneCount++;
        originalTotal += item.file.size;
        resultTotal += blob.size;
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
        batch.updateItem(item.id, {
          status: "done",
          errorKey: undefined,
          result: {
            blob,
            name:
              toolId === "resize"
                ? resizeOutputName(item.file, format, outcome.width, outcome.height)
                : outputName(item.file, format),
            size: blob.size,
          },
          resultUrl: URL.createObjectURL(blob),
        });
      } catch (error) {
        console.error(`Processing failed for ${item.file.name}:`, error);
        const code = error instanceof Error ? error.message.split(":")[0] : "unknown";
        batch.updateItem(item.id, {
          status: "error",
          errorKey: (ERROR_KEYS[code] ?? "errorGeneric") as "corrupt" | "memory" | "unknown",
        });
      }
    }

    if (doneCount > 0 && originalTotal > resultTotal) {
      setSummaryPercent(Math.round((1 - resultTotal / originalTotal) * 100));
      fireConfetti();
    } else {
      setSummaryPercent(null);
    }
    processingIdRef.current = null;
    setLastTargetMissed(targetMissed);
    setRunning(false);
  }

  function cancel() {
    cancelRequested.current = true;
    clientRef.current?.cancelAll();
    batch.resetProcessing();
    setSummaryPercent(null);
    setRunning(false);
  }

  const hasResults = batch.doneResults.length > 0;
  const selected = batch.items.find((item) => item.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <DropZone onFiles={handleAddFiles} count={IMAGE_LIMITS.maxBatchSize} />

      {batch.errors.length > 0 && (
        <ul
          role="alert"
          className="flex flex-col gap-1 rounded-2xl border border-error/40 bg-error/10 p-4 text-sm text-error"
        >
          {batch.errors.map((error) => (
            <li key={error.id}>
              {t(error.key, {
                name: error.name ?? "",
                limit: IMAGE_LIMITS.maxFileSizeMB,
                count: IMAGE_LIMITS.maxBatchSize,
              })}
            </li>
          ))}
        </ul>
      )}

      {batch.showBatchWarning && (
        <p
          role="status"
          className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning"
        >
          {t("batchWarning")}
        </p>
      )}

      {batch.items.length > 0 && (
        <>
          {summaryPercent !== null && !running && (
            <p
              role="status"
              className="rounded-2xl border border-success/40 bg-success/10 p-4 text-sm font-bold text-success"
            >
              {t("successLine", { percent: summaryPercent })}
            </p>
          )}

          {lastTargetMissed && (
            <p
              role="status"
              className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning"
            >
              {tCompress("targetNotReached")}
            </p>
          )}

          {toolId === "resize" && (
            <ResizeControls settings={resizeSettings} onChange={setResizeSettings} />
          )}

          {toolId !== "resize" && selected?.resultUrl && selected.result && (
            <CompareSlider
              beforeUrl={selected.url}
              afterUrl={selected.resultUrl}
              alt={selected.file.name}
              beforeLabel={tCompress("compareBefore")}
              afterLabel={tCompress("compareAfter")}
            />
          )}

          <div className="flex flex-col gap-3">
            {batch.items.map((item) => (
              <ImageCard
                key={item.id}
                item={item}
                onRemove={batch.removeItem}
                onSelect={toolId !== "resize" ? setSelectedId : undefined}
                selected={item.id === selectedId}
              >
                {toolId === "compress" && (
                  <CompressControls
                    settings={getSettings(item.id) as CompressSettings}
                    onChange={(next) => updateSettings(item.id, next)}
                  />
                )}
                {toolId === "convert" && (
                  <ConvertControls
                    settings={getSettings(item.id) as ConvertSettings}
                    onChange={(next) => updateSettings(item.id, next)}
                  />
                )}
              </ImageCard>
            ))}
          </div>

          <div className="sticky bottom-4 flex gap-3 rounded-2xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur">
            {running ? (
              <button
                type="button"
                onClick={cancel}
                className="flex-1 rounded-xl border border-error bg-error/10 px-4 py-3 text-sm font-bold text-error"
              >
                {t("cancel")}
              </button>
            ) : (
              (
                <button
                  type="button"
                  onClick={() => void processAll()}
                  className="flex-1 rounded-xl px-4 py-3 text-sm font-bold text-on-primary"
                  style={{ backgroundColor: `var(--ck-accent-${toolId})` }}
                >
                  {toolId === "convert" ? tConvert("process") : toolId === "resize" ? tResize("process") : tCompress("process")}
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => zipAndDownload(batch.doneResults, `chobikit-${toolId}.zip`)}
              disabled={!hasResults}
              className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-on-primary transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("downloadAll")}
            </button>
            <button
              type="button"
              onClick={batch.clearAll}
              disabled={running}
              className="rounded-xl border border-border px-4 py-3 text-sm font-bold text-muted transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-50"
            >
              {t("clearAll")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
