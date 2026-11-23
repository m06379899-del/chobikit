import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import StaticShell from "@/components/static-page-shell";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/terms">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.terms" });
  return { title: `${t("title")} — ChobiKit`, description: t("body.0") };
}

export default async function TermsPage({
  params,
}: PageProps<"/[locale]/terms">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <StaticShell namespace="pages.terms" />;
}
