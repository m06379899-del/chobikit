"use client";

import { useTranslations } from "next-intl";
import DropZone from "@/components/drop-zone";
import ImageCard from "@/components/image-card";
import { useToolBatch } from "@/hooks/use-tool-batch";
import { zipAndDownload } from "@/lib/image/zip";
import { IMAGE_LIMITS } from "@/config/limits";
import type { ToolId } from "@/lib/tools-registry";

/**
 * Client-side shell shared by all tool pages: drop zone, validated batch
 * list, and the bottom action bar. Tool-specific controls render inside
 * each image card once the codecs land (Milestones 3-5).
 */
export default function ToolWorkbench({ toolId }: { toolId: ToolId }) {
  const t = useTranslations("workbench");
  const batch = useToolBatch();

  const hasResults = batch.doneResults.length > 0;

  function downloadAll() {
    void zipAndDownload(batch.doneResults, `chobikit-${toolId}.zip`);
  }

  return (
    <div className="flex flex-col gap-4">
      <DropZone onFiles={batch.addFiles} count={IMAGE_LIMITS.maxBatchSize} />

      {batch.errors.length > 0 && (
        <ul
          role="alert"
          className="flex flex-col gap-1 rounded-2xl border border-error/40 bg-error/10 p-4 text-sm text-error"
        >
          {batch.errors.map((error) => (
            <li key={error.id}>{t(error.key, { name: error.name ?? "", limit: IMAGE_LIMITS.maxFileSizeMB, count: IMAGE_LIMITS.maxBatchSize })}</li>
          ))}
        </ul>
      )}

      {batch.showBatchWarning && (
        <p role="status" className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
          {t("batchWarning")}
        </p>
      )}

      {batch.items.length > 0 && (
        <>
          <div className="flex flex-col gap-3">
            {batch.items.map((item) => (
              <ImageCard
                key={item.id}
                item={item}
                onRemove={batch.removeItem}
              />
            ))}
          </div>

          {/* Bottom action bar */}
          <div className="sticky bottom-4 flex gap-3 rounded-2xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur">
            <button
              type="button"
              onClick={downloadAll}
              disabled={!hasResults}
              className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-on-primary transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("downloadAll")}
            </button>
            <button
              type="button"
              onClick={batch.clearAll}
              className="rounded-xl border border-border px-4 py-3 text-sm font-bold text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              {t("clearAll")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
