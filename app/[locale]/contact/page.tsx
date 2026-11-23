import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import StaticShell from "@/components/static-page-shell";
import { SITE } from "@/config/site";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.contact" });
  return { title: `${t("title")} — ChobiKit`, description: t("body.0") };
}

export default async function ContactPage({
  params,
}: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("pages.contact");

  return (
    <StaticShell namespace="pages.contact">
      <p className="text-muted">
        {t("emailLabel")}:{" "}
        <a
          className="font-bold text-primary-strong underline"
          href={`mailto:${SITE.contactEmail}`}
        >
          {SITE.contactEmail}
        </a>
      </p>
    </StaticShell>
  );
}
