/**
 * Single source of truth for the tools. The home page, header and tool
 * pages all read from here, so adding a tool later (e.g. video tools)
 * is one entry plus one route.
 */
export type ToolId = "compress" | "convert" | "resize";

export interface ToolDef {
  id: ToolId;
  route: string;
  /** Emoji icon shown everywhere the tool appears. */
  icon: string;
  /** Name of the --color-accent-* design token for this tool. */
  accent: ToolId;
}

export const TOOLS: ToolDef[] = [
  { id: "compress", route: "/compress", icon: "🗜️", accent: "compress" },
  { id: "convert", route: "/convert", icon: "🔄", accent: "convert" },
  { id: "resize", route: "/resize", icon: "📐", accent: "resize" },
];

export function getTool(id: ToolId): ToolDef {
  const tool = TOOLS.find((t) => t.id === id);
  if (!tool) throw new Error(`Unknown tool: ${id}`);
  return tool;
}

/** CSS color value for a tool's accent, e.g. for inline styles / color-mix. */
export function accentColor(id: ToolId): string {
  return `var(--ck-accent-${id})`;
}
