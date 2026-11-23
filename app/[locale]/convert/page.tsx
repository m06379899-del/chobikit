import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import ToolPageShell from "@/components/tool-page-shell";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/convert">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tools.convert" });
  return { title: `${t("name")} — ChobiKit`, description: t("pageDescription") };
}

export default async function ConvertPage({
  params,
}: PageProps<"/[locale]/convert">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ToolPageShell toolId="convert" />;
}
