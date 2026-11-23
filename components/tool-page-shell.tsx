import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { TOOLS, accentColor, getTool, type ToolId } from "@/lib/tools-registry";
import PrivacyBadge from "@/components/privacy-badge";
import FaqSection from "@/components/faq-section";

/**
 * Shared layout for all tool pages: title, tabs between tools, privacy
 * badge, and the content area where the drop zone will live (Milestone 2).
 */
export default async function ToolPageShell({
  toolId,
  children,
}: {
  toolId: ToolId;
  children?: ReactNode;
}) {
  const tool = getTool(toolId);
  const tTools = await getTranslations("tools");
  const tHeader = await getTranslations("header");
  const tCommon = await getTranslations("common");

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16">
      {/* Tool tabs */}
      <nav aria-label={tHeader("menu")} className="flex gap-2 py-5">
        {TOOLS.map((tab) => (
          <Link
            key={tab.id}
            href={tab.route}
            aria-current={tab.id === toolId ? "page" : undefined}
            className="flex-1 rounded-xl border px-2 py-2.5 text-center text-sm font-bold transition-colors sm:flex-none sm:px-5"
            style={
              tab.id === toolId
                ? {
                    color: accentColor(tab.id),
                    borderColor: accentColor(tab.id),
                    backgroundColor: `color-mix(in srgb, ${accentColor(tab.id)} 12%, transparent)`,
                  }
                : {
                    color: "var(--ck-muted)",
                    borderColor: "var(--ck-border)",
                  }
            }
          >
            <span aria-hidden="true" className="mr-1">
              {tab.icon}
            </span>
            {tTools(`${tab.id}.name`)}
          </Link>
        ))}
      </nav>

      {/* Title and description */}
      <header className="flex flex-col items-center gap-3 pb-8 pt-2 text-center">
        <span
          aria-hidden="true"
          className="flex h-16 w-16 items-center justify-center rounded-3xl text-4xl"
          style={{
            backgroundColor: `color-mix(in srgb, ${accentColor(toolId)} 15%, transparent)`,
          }}
        >
          {tool.icon}
        </span>
        <h1
          className="text-3xl font-extrabold sm:text-4xl"
          style={{ color: accentColor(toolId) }}
        >
          {tTools(`${toolId}.name`)}
        </h1>
        <p className="max-w-xl text-base text-muted">
          {tTools(`${toolId}.pageDescription`)}
        </p>
        <PrivacyBadge />
      </header>

      {children ?? (
        <div className="rounded-3xl border border-border bg-surface p-10 text-center text-muted">
          {tCommon("comingSoon")}
        </div>
      )}

      <FaqSection toolId={toolId} />
    </div>
  );
}
