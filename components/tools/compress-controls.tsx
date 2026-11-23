"use client";

import { useTranslations } from "next-intl";
import type { CompressSettings } from "@/lib/image/compress";

/** Per-image compressor controls, rendered inside each image card. */
export default function CompressControls({
  settings,
  onChange,
}: {
  settings: CompressSettings;
  onChange: (settings: CompressSettings) => void;
}) {
  const t = useTranslations("compress");

  return (
    <div className="grid gap-3 rounded-xl bg-surface-2 p-3 sm:grid-cols-2">
      <div>
        <label className="flex items-center justify-between pb-1 text-sm font-bold text-text">
          {t("quality")}
          <span className="text-muted">
            {settings.targetMode ? "—" : `${settings.quality}`}
          </span>
        </label>
        <input
          type="range"
          min={1}
          max={100}
          value={settings.quality}
          disabled={settings.targetMode}
          onChange={(event) => onChange({ ...settings, quality: Number(event.target.value) })}
          aria-label={t("quality")}
          className="w-full accent-[var(--ck-accent-compress)] disabled:opacity-40"
        />
      </div>
      <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-text">
          <input
            type="checkbox"
            checked={settings.targetMode}
            onChange={(event) => onChange({ ...settings, targetMode: event.target.checked })}
            className="h-5 w-5 accent-[var(--ck-accent-compress)]"
          />
          {t("targetLabel")}
        </label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={1}
            value={settings.targetKB}
            disabled={!settings.targetMode}
            onChange={(event) => onChange({ ...settings, targetKB: Number(event.target.value) || 1 })}
            aria-label={t("targetLabel")}
            className="w-20 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-text disabled:opacity-40"
          />
          <span className="text-sm text-muted">{t("targetUnit")}</span>
        </div>
      </div>
      <div className="sm:col-span-2">
        <label className="block pb-1 text-sm font-bold text-text">
          {t("format")}
        </label>
        <select
          value={settings.format}
          onChange={(event) =>
            onChange({ ...settings, format: event.target.value as CompressSettings["format"] })
          }
          className="w-full rounded-lg border border-border bg-surface px-2 py-2 text-sm text-text"
        >
          <option value="same">{t("keepOriginal")}</option>
          <option value="jpeg">JPG</option>
          <option value="png">PNG</option>
          <option value="webp">WebP</option>
          <option value="avif">AVIF</option>
        </select>
      </div>
    </div>
  );
}
