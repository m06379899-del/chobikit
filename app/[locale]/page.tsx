import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { TOOLS, accentColor, type ToolId } from "@/lib/tools-registry";
import PrivacyBadge from "@/components/privacy-badge";

const WHY_ITEMS = [
  { key: "private", icon: "🔒" },
  { key: "free", icon: "🎁" },
  { key: "fast", icon: "⚡" },
  { key: "bilingual", icon: "🌐" },
] as const;

export default async function HomePage({
  params,
}: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tTools = await getTranslations("tools");
  const tHome = await getTranslations("home");

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16">
      {/* Hero */}
      <section className="flex flex-col items-center gap-5 py-14 text-center sm:py-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-bold text-primary-strong">
          <span aria-hidden="true">🔒</span>
          {tHome("heroBadge")}
        </span>
        <h1 className="max-w-2xl text-3xl font-extrabold leading-tight text-text sm:text-5xl">
          {tHome("heroTitle")}
        </h1>
        <p className="max-w-xl text-base text-muted sm:text-lg">
          {tHome("heroSubtitle")}
        </p>
        <PrivacyBadge />
      </section>

      {/* Tool cards */}
      <section aria-labelledby="tools-heading" className="pb-14">
        <h2 id="tools-heading" className="sr-only">
          {tHome("whyTitle")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {TOOLS.map((tool) => (
            <Link
              key={tool.id}
              href={tool.route}
              className="group flex flex-col gap-3 rounded-3xl border border-border bg-surface p-6 shadow-sm transition-transform hover:-translate-y-1"
            >
              <span
                aria-hidden="true"
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
                style={{ backgroundColor: `color-mix(in srgb, ${accentColor(tool.id as ToolId)} 15%, transparent)` }}
              >
                {tool.icon}
              </span>
              <span
                className="text-xl font-extrabold"
                style={{ color: accentColor(tool.id as ToolId) }}
              >
                {tTools(`${tool.id}.name`)}
              </span>
              <span className="text-sm font-bold text-text">
                {tTools(`${tool.id}.tagline`)}
              </span>
              <span className="text-sm leading-relaxed text-muted">
                {tTools(`${tool.id}.description`)}
              </span>
              <span
                className="mt-2 inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors group-hover:bg-surface-2"
                style={{ color: accentColor(tool.id as ToolId), borderColor: `color-mix(in srgb, ${accentColor(tool.id as ToolId)} 45%, transparent)` }}
              >
                {tHome("openTool", { tool: tTools(`${tool.id}.name`) })}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Why ChobiKit */}
      <section aria-labelledby="why-heading">
        <h2
          id="why-heading"
          className="pb-6 text-center text-2xl font-extrabold text-text sm:text-3xl"
        >
          {tHome("whyTitle")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {WHY_ITEMS.map((item) => (
            <div
              key={item.key}
              className="flex gap-4 rounded-3xl border border-border bg-surface p-6"
            >
              <span aria-hidden="true" className="text-3xl">
                {item.icon}
              </span>
              <div>
                <h3 className="pb-1 font-extrabold text-text">
                  {tHome(`why.${item.key}.title`)}
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  {tHome(`why.${item.key}.text`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
