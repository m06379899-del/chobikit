"use client";

import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Drag-and-drop zone with a mobile-friendly file picker. Drag-over gets a
 * gentle glow/scale (disabled under prefers-reduced-motion via globals.css).
 */
export default function DropZone({
  onFiles,
  count,
}: {
  onFiles: (files: File[]) => void;
  count: number;
}) {
  const t = useTranslations("workbench");
  const inputRef = useRef<HTMLInputElement>(null);
  const headingId = useId();
  const [dragActive, setDragActive] = useState(false);

  function handleList(list: FileList | null) {
    if (list && list.length > 0) onFiles(Array.from(list));
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-labelledby={headingId}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragActive(false);
        handleList(event.dataTransfer.files);
      }}
      className={`flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed p-8 text-center transition-all ${
        dragActive
          ? "scale-[1.02] border-primary bg-primary/10 shadow-lg shadow-primary/20"
          : "border-border bg-surface hover:border-primary/50 hover:bg-surface-2"
      }`}
    >
      <span aria-hidden="true" className="text-5xl">
        🖼️
      </span>
      <h2 id={headingId} className="text-lg font-extrabold text-text">
        {dragActive ? t("dropActive") : t("dropTitle")}
      </h2>
      <p className="text-sm text-muted">{t("dropHint", { count })}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="sr-only"
        onChange={(event) => {
          handleList(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
