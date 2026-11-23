import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import ToolPageShell from "@/components/tool-page-shell";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/resize">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tools.resize" });
  return { title: `${t("name")} — ChobiKit`, description: t("pageDescription") };
}

export default async function ResizePage({
  params,
}: PageProps<"/[locale]/resize">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ToolPageShell toolId="resize" />;
}
