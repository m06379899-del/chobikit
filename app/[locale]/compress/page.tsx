import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ToolPageShell from "@/components/tool-page-shell";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/compress">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tools.compress" });
  return { title: `${t("name")} — ChobiKit`, description: t("pageDescription") };
}

export default async function CompressPage({
  params,
}: PageProps<"/[locale]/compress">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ToolPageShell toolId="compress" />;
}
