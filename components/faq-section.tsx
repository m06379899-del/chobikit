import { getTranslations } from "next-intl/server";
import { accentColor, type ToolId } from "@/lib/tools-registry";

/** Short, genuinely helpful FAQ below each tool (also good for SEO later). */
export default async function FaqSection({ toolId }: { toolId: ToolId }) {
  const t = await getTranslations(`faq.${toolId}`);
  const items = t.raw("items") as { question: string; answer: string }[];

  return (
    <section aria-labelledby={`faq-${toolId}`} className="pb-4 pt-10">
      <h2
        id={`faq-${toolId}`}
        className="pb-4 text-xl font-extrabold text-text sm:text-2xl"
        style={{ color: accentColor(toolId) }}
      >
        {t("title")}
      </h2>
      <div className="flex flex-col gap-2">
        {items.map((item, index) => (
          <details
            key={index}
            className="rounded-2xl border border-border bg-surface px-4 py-3"
          >
            <summary className="cursor-pointer text-sm font-bold text-text">
              {item.question}
            </summary>
            <p className="pt-2 text-sm leading-relaxed text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
