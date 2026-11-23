import { useTranslations } from "next-intl";

/** The core promise of ChobiKit, shown near every drop zone and in footers. */
export default function PrivacyBadge() {
  const t = useTranslations("common");

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-text">
      <span aria-hidden="true">🔒</span>
      {t("privacyBadge")}
    </div>
  );
}
