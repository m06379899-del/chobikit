"use client";

import { useTranslations } from "next-intl";
import type { ConvertSettings } from "@/lib/image/convert";

/** Per-image converter controls, rendered inside each image card. */
export default function ConvertControls({
  settings,
  onChange,
}: {
  settings: ConvertSettings;
  onChange: (settings: ConvertSettings) => void;
}) {
  const t = useTranslations("convert");

  return (
    <div className="grid gap-3 rounded-xl bg-surface-2 p-3 sm:grid-cols-2">
      <div>
        <label className="block pb-1 text-sm font-bold text-text">
          {t("format")}
        </label>
        <select
          value={settings.format}
          onChange={(event) =>
            onChange({ ...settings, format: event.target.value as ConvertSettings["format"] })
          }
          className="w-full rounded-lg border border-border bg-surface px-2 py-2 text-sm text-text"
        >
          <option value="jpeg">JPG</option>
          <option value="png">PNG</option>
          <option value="webp">WebP</option>
          <option value="avif">AVIF</option>
        </select>
      </div>
      <div>
        <label className="flex items-center justify-between pb-1 text-sm font-bold text-text">
          {t("quality")}
          <span className="text-muted">
            {settings.format === "png" ? "—" : `${settings.quality}`}
          </span>
        </label>
        <input
          type="range"
          min={1}
          max={100}
          value={settings.quality}
          disabled={settings.format === "png"}
          onChange={(event) => onChange({ ...settings, quality: Number(event.target.value) })}
          aria-label={t("quality")}
          className="w-full accent-[var(--ck-accent-convert)] disabled:opacity-40"
        />
      </div>
      {settings.format === "jpeg" && (
        <div className="flex items-center gap-3 sm:col-span-2">
          <label className="text-sm font-bold text-text">
            {t("backgroundColor")}
          </label>
          <input
            type="color"
            value={settings.bgColor}
            onChange={(event) => onChange({ ...settings, bgColor: event.target.value })}
            aria-label={t("backgroundColor")}
            className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-surface p-1"
          />
          <span className="text-xs text-muted">{t("backgroundColorHint")}</span>
        </div>
      )}
    </div>
  );
}
