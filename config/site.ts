/**
 * Site-wide settings that are not final yet (owner decisions pending).
 * The real domain goes in NEXT_PUBLIC_SITE_URL once bought.
 */
export const SITE = {
  name: "ChobiKit",
  /** DEFAULT — placeholder until the owner provides a real address. */
  contactEmail: "contact@chobikit.app",
  /** DEFAULT — empty until the domain is bought. */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",
} as const;
