"use client";

import { useRef, useState } from "react";

/**
 * Draggable before/after comparison. Works with touch (pointer events) and
 * keyboard (the handle is a slider role with arrow keys).
 */
export default function CompareSlider({
  beforeUrl,
  afterUrl,
  alt,
  beforeLabel,
  afterLabel,
}: {
  beforeUrl: string;
  afterUrl: string;
  alt: string;
  beforeLabel: string;
  afterLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [position, setPosition] = useState(50);

  function updateFromPointer(clientX: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const percent = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, percent)));
  }

  return (
    <div
      ref={containerRef}
      className="relative touch-none select-none overflow-hidden rounded-2xl border border-border bg-surface-2"
      onPointerDown={(event) => {
        dragging.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        updateFromPointer(event.clientX);
      }}
      onPointerMove={(event) => {
        if (dragging.current) updateFromPointer(event.clientX);
      }}
      onPointerUp={(event) => {
        dragging.current = false;
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- blob URL result previews cannot go through next/image */}
      <img src={afterUrl} alt={alt} className="block w-full" draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element -- blob URL thumbnails cannot go through next/image */}
      <img
        src={beforeUrl}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute inset-0 w-full"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      />
      <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white">
        {beforeLabel}
      </span>
      <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white">
        {afterLabel}
      </span>
      <div
        role="slider"
        tabIndex={0}
        aria-label={`${beforeLabel} / ${afterLabel}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") setPosition((p) => Math.max(0, p - 5));
          if (event.key === "ArrowRight") setPosition((p) => Math.min(100, p + 5));
        }}
        className="absolute bottom-0 top-0 w-0.5 cursor-ew-resize bg-white"
        style={{ left: `${position}%` }}
      >
        <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-800 shadow-lg">
          ⇆
        </span>
      </div>
    </div>
  );
}
