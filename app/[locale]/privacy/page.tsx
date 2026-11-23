import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import StaticShell from "@/components/static-page-shell";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.privacy" });
  return { title: `${t("title")} — ChobiKit`, description: t("body.0") };
}

export default async function PrivacyPage({
  params,
}: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <StaticShell namespace="pages.privacy" />
  );
}
