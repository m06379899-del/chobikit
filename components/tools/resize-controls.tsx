"use client";

import { useTranslations } from "next-intl";
import { RESIZE_PRESETS } from "@/config/presets";
import type { ResizeSettings } from "@/lib/image/resize";

const inputClass =
  "w-20 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-text";
const selectClass =
  "w-full rounded-lg border border-border bg-surface px-2 py-2 text-sm text-text";

/** Batch-level resize settings: dimensions or percent, presets, fit, format. */
export default function ResizeControls({
  settings,
  onChange,
}: {
  settings: ResizeSettings;
  onChange: (settings: ResizeSettings) => void;
}) {
  const t = useTranslations("resize");
  const tp = useTranslations("presets");

  function applyWidth(width: number) {
    const next = { ...settings, width, presetId: null };
    if (settings.lockAspect && settings.width > 0) {
      next.height = Math.max(1, Math.round((width * settings.height) / settings.width));
    }
    onChange(next);
  }

  function applyHeight(height: number) {
    const next = { ...settings, height, presetId: null };
    if (settings.lockAspect && settings.height > 0) {
      next.width = Math.max(1, Math.round((height * settings.width) / settings.height));
    }
    onChange(next);
  }

  function applyPreset(id: string) {
    const preset = RESIZE_PRESETS.find((entry) => entry.id === id);
    if (!preset) return;
    onChange({
      ...settings,
      mode: "dimensions",
      width: preset.width,
      height: preset.height,
      presetId: id,
      lockAspect: false,
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-2 p-4">
      {/* Mode switch */}
      <div className="flex gap-2" role="group" aria-label={t("dimensions")}>
        {(["dimensions", "percent"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={settings.mode === mode}
            onClick={() => onChange({ ...settings, mode })}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-bold transition-colors ${
              settings.mode === mode
                ? "border-[var(--ck-accent-resize)] bg-[var(--ck-accent-resize)]/15 text-[var(--ck-accent-resize)]"
                : "border-border text-muted hover:bg-surface"
            }`}
          >
            {mode === "dimensions" ? t("dimensions") : t("percent")}
          </button>
        ))}
      </div>

      {settings.mode === "dimensions" ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm font-bold text-muted">
              {t("width")}
              <input
                type="number"
                min={1}
                value={settings.width}
                onChange={(event) => applyWidth(Number(event.target.value) || 1)}
                className={`${inputClass} ml-2`}
              />
            </label>
            <button
              type="button"
              onClick={() => onChange({ ...settings, lockAspect: !settings.lockAspect, presetId: null })}
              aria-pressed={settings.lockAspect}
              aria-label={t("lockAspect")}
              title={t("lockAspect")}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-base ${
                settings.lockAspect
                  ? "border-[var(--ck-accent-resize)] bg-[var(--ck-accent-resize)]/15 text-[var(--ck-accent-resize)]"
                  : "border-border text-muted"
              }`}
            >
              <span aria-hidden="true">🔗</span>
            </button>
            <label className="text-sm font-bold text-muted">
              {t("height")}
              <input
                type="number"
                min={1}
                value={settings.height}
                onChange={(event) => applyHeight(Number(event.target.value) || 1)}
                disabled={settings.lockAspect}
                className={`${inputClass} ml-2 disabled:opacity-40`}
              />
            </label>
          </div>

          <div>
            <p className="pb-1 text-sm font-bold text-muted">{t("presets")}</p>
            <div className="flex flex-wrap gap-2">
              {RESIZE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  aria-pressed={settings.presetId === preset.id}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                    settings.presetId === preset.id
                      ? "border-[var(--ck-accent-resize)] bg-[var(--ck-accent-resize)]/15 text-[var(--ck-accent-resize)]"
                      : "border-border text-muted hover:bg-surface hover:text-text"
                  }`}
                >
                  {tp(preset.id)}
                </button>
              ))}
            </div>
          </div>

          {settings.presetId && (
            <div>
              <label className="block pb-1 text-sm font-bold text-muted">
                {t("fit")}
              </label>
              <select
                value={settings.fit}
                onChange={(event) =>
                  onChange({ ...settings, fit: event.target.value as ResizeSettings["fit"] })
                }
                className={selectClass}
              >
                <option value="cover">{t("fitCover")}</option>
                <option value="contain">{t("fitContain")}</option>
              </select>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-muted">
            {t("percent")}
            <input
              type="number"
              min={1}
              max={500}
              value={settings.percent}
              onChange={(event) => onChange({ ...settings, percent: Number(event.target.value) || 100 })}
              className={`${inputClass} ml-2`}
            />
          </label>
          <span className="text-sm text-muted">%</span>
        </div>
      )}

      {/* Output format and quality */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block pb-1 text-sm font-bold text-muted">
            {t("format")}
          </label>
          <select
            value={settings.format}
            onChange={(event) =>
              onChange({ ...settings, format: event.target.value as ResizeSettings["format"] })
            }
            className={selectClass}
          >
            <option value="same">{t("keepOriginal")}</option>
            <option value="jpeg">JPG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
            <option value="avif">AVIF</option>
          </select>
        </div>
        <div>
          <label className="flex items-center justify-between pb-1 text-sm font-bold text-muted">
            {t("quality")}
            <span className="text-muted">{settings.format === "png" ? "—" : settings.quality}</span>
          </label>
          <input
            type="range"
            min={1}
            max={100}
            value={settings.quality}
            disabled={settings.format === "png"}
            onChange={(event) => onChange({ ...settings, quality: Number(event.target.value) })}
            aria-label={t("quality")}
            className="w-full accent-[var(--ck-accent-resize)] disabled:opacity-40"
          />
        </div>
      </div>
    </div>
  );
}
