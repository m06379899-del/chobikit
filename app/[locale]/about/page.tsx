import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import StaticShell from "@/components/static-page-shell";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.about" });
  return { title: `${t("title")} — ChobiKit`, description: t("body.0") };
}

export default async function AboutPage({
  params,
}: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <StaticShell namespace="pages.about" />;
}
