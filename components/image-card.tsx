"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { formatBytes } from "@/lib/format";
import type { BatchItem } from "@/hooks/use-tool-batch";

const STATUS_STYLES: Record<BatchItem["status"], string> = {
  queued: "bg-surface-2 text-muted",
  processing: "bg-primary/15 text-primary-strong",
  done: "bg-success/15 text-success",
  error: "bg-error/15 text-error",
};

const STATUS_KEYS = {
  queued: "queued",
  processing: "processing",
  done: "done",
  error: "error",
} as const;

/** One image in the batch: thumbnail, name, sizes, status, controls slot. */
export default function ImageCard({
  item,
  onRemove,
  children,
}: {
  item: BatchItem;
  onRemove: (id: string) => void;
  children?: ReactNode;
}) {
  const t = useTranslations("workbench");

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- blob URL thumbnails cannot go through next/image */}
        <img
          src={item.url}
          alt={item.file.name}
          className="h-14 w-14 shrink-0 rounded-xl border border-border object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-text">{item.file.name}</p>
          <p className="text-sm text-muted">
            {t("original")}: {formatBytes(item.file.size)}
            {item.result && (
              <>
                {" · "}
                {t("result")}: {formatBytes(item.result.size)}
                {item.result.size < item.file.size && (
                  <>
                    {" · "}
                    <span className="font-bold text-success">
                      {t("saved", {
                        percent: Math.round(
                          (1 - item.result.size / item.file.size) * 100,
                        ),
                      })}
                    </span>
                  </>
                )}
              </>
            )}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[item.status]}`}
        >
          {t(STATUS_KEYS[item.status])}
        </span>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          aria-label={`${t("remove")}: ${item.file.name}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>
      {children}
    </div>
  );
}
