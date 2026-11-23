import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const LINKS = [
  { href: "/about", key: "about" },
  { href: "/privacy", key: "privacy" },
  { href: "/terms", key: "terms" },
  { href: "/contact", key: "contact" },
] as const;

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8">
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm font-semibold text-muted transition-colors hover:text-text"
                >
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="flex items-center gap-2 text-sm text-muted">
          <span aria-hidden="true">🔒</span>
          {t("privacyLine")}
        </p>
        <p className="text-sm text-muted">{t("copyright", { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
