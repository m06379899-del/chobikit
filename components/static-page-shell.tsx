import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

type StaticNamespace =
  | "pages.about"
  | "pages.privacy"
  | "pages.terms"
  | "pages.contact";

/** Shared layout for About / Privacy / Terms / Contact. */
export default async function StaticShell({
  namespace,
  children,
}: {
  namespace: StaticNamespace;
  children?: ReactNode;
}) {
  const t = await getTranslations(namespace);
  const paragraphs = t.raw("body") as string[];

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <h1 className="py-8 text-3xl font-extrabold text-text sm:text-4xl">
        {t("title")}
      </h1>
      <div className="flex flex-col gap-4 pb-8">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="leading-relaxed text-muted">
            {paragraph}
          </p>
        ))}
      </div>
      {children}
    </div>
  );
}
