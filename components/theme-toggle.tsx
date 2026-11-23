"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const STORAGE_KEY = "chobikit-theme";

export default function ThemeToggle() {
  const t = useTranslations("theme");

  // Dark is the default; the pre-paint script sets the `light` class before
  // hydration, so reading it at first render matches what the user sees.
  const [isLight, setIsLight] = useState<boolean>(() =>
    typeof document === "undefined"
      ? false
      : document.documentElement.classList.contains("light"),
  );

  function toggle() {
    const next = !isLight;
    document.documentElement.classList.toggle("light", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "light" : "dark");
    } catch {
      // Storage can be unavailable (private mode); theme just won't persist.
    }
    setIsLight(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isLight ? t("toDark") : t("toLight")}
      title={isLight ? t("toDark") : t("toLight")}
      className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface text-lg transition-colors hover:bg-surface-2"
    >
      <span aria-hidden="true" suppressHydrationWarning>{isLight ? "🌙" : "☀️"}</span>
    </button>
  );
}
