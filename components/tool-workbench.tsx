"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import DropZone from "@/components/drop-zone";
import ImageCard from "@/components/image-card";
import CompareSlider from "@/components/compare-slider";
import CompressControls from "@/components/tools/compress-controls";
import { useToolBatch } from "@/hooks/use-tool-batch";
import { zipAndDownload } from "@/lib/image/zip";
import { IMAGE_LIMITS } from "@/config/limits";
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
  const batch = useToolBatch();

  const [settings, setSettings] = useState<Record<string, CompressSettings>>({});
  const [running, setRunning] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastTargetMissed, setLastTargetMissed] = useState(false);

  const clientRef = useRef<WorkerClient<CompressJob, CompressOutcome> | null>(null);
  const cancelRequested = useRef(false);

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

  function getSettings(id: string): CompressSettings {
    return settings[id] ?? DEFAULT_COMPRESS_SETTINGS;
  }

  function updateSettings(id: string, next: CompressSettings) {
    setSettings((current) => ({ ...current, [id]: next }));
  }

  async function processAll() {
    if (batch.items.length === 0) return;
    const client = ensureClient();
    cancelRequested.current = false;
    setRunning(true);
    setLastTargetMissed(false);
    let targetMissed = false;

    for (const item of batch.items) {
      if (cancelRequested.current) break;
      batch.updateItem(item.id, { status: "processing", errorKey: undefined });
      try {
        // from-image applies EXIF orientation so photos come out upright.
        const bitmap = await createImageBitmap(item.file, {
          imageOrientation: "from-image",
        });
        const compressSettings = getSettings(item.id);
        const format = resolveFormat(item.file, compressSettings.format);
        const outcome = await client.run({
          kind: "compress",
          bitmap,
          format,
          quality: compressSettings.quality,
          targetBytes: compressSettings.targetMode
            ? compressSettings.targetKB * 1024
            : undefined,
        });
        if (outcome.targetReached === false) targetMissed = true;
        const blob = new Blob([outcome.bytes], { type: FORMAT_MIME[format] });
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
        batch.updateItem(item.id, {
          status: "done",
          errorKey: undefined,
          result: {
            blob,
            name: outputName(item.file, format),
            size: blob.size,
          },
          resultUrl: URL.createObjectURL(blob),
        });
      } catch (error) {
        const code = error instanceof Error ? error.message.split(":")[0] : "unknown";
        batch.updateItem(item.id, {
          status: "error",
          errorKey: (ERROR_KEYS[code] ?? "errorGeneric") as "corrupt" | "memory" | "unknown",
        });
      }
    }

    setLastTargetMissed(targetMissed);
    setRunning(false);
  }

  function cancel() {
    cancelRequested.current = true;
    clientRef.current?.cancelAll();
    setRunning(false);
  }

  const hasResults = batch.doneResults.length > 0;
  const selected = batch.items.find((item) => item.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <DropZone onFiles={batch.addFiles} count={IMAGE_LIMITS.maxBatchSize} />

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
          {lastTargetMissed && (
            <p
              role="status"
              className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning"
            >
              {tCompress("targetNotReached")}
            </p>
          )}

          {toolId === "compress" && selected?.resultUrl && selected.result && (
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
                onSelect={toolId === "compress" ? setSelectedId : undefined}
                selected={item.id === selectedId}
              >
                {toolId === "compress" && (
                  <CompressControls
                    settings={getSettings(item.id)}
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
              toolId === "compress" && (
                <button
                  type="button"
                  onClick={() => void processAll()}
                  className="flex-1 rounded-xl px-4 py-3 text-sm font-bold text-on-primary"
                  style={{ backgroundColor: "var(--ck-accent-compress)" }}
                >
                  {tCompress("process")}
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
