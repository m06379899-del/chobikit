"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("header");

  const other: Locale = locale === "en" ? "bn" : "en";
  const label = other === "bn" ? "বাংলা" : "EN";

  function rememberLocale() {
    try {
      localStorage.setItem("chobikit-locale", other);
    } catch {
      // Ignore private-mode storage errors; the choice just won't persist.
    }
  }

  return (
    <Link
      href={pathname}
      locale={other}
      onClick={rememberLocale}
      title={t("language")}
      className="flex h-11 items-center justify-center rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-text transition-colors hover:bg-surface-2"
    >
      {label}
    </Link>
  );
}
