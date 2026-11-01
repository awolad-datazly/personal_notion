import type { FeatureFlagKey } from "@/lib/feature-flags";

export type NavSection = "WORKSPACE" | "LIBRARY" | "SYSTEM";

export type NavIconName =
  | "overview"
  | "news"
  | "vault"
  | "articles"
  | "bookmarks"
  | "scratchpad"
  | "coffee"
  | "settings"
  | "admin";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
  section: NavSection;
  shortcut?: string;
  count?: string;
  flag?: FeatureFlagKey;
  adminOnly?: boolean;
};

export const PRIMARY_NAV: readonly NavItem[] = [
  // WORKSPACE
  {
    href: "/",
    label: "Overview",
    icon: "overview",
    section: "WORKSPACE",
    shortcut: "1",
  },
  {
    href: "/news",
    label: "News Radar",
    icon: "news",
    section: "WORKSPACE",
    shortcut: "2",
    count: "Live",
    flag: "news_radar",
  },
  {
    href: "/vault",
    label: "Video Vault",
    icon: "vault",
    section: "WORKSPACE",
    shortcut: "3",
    flag: "video_vault",
  },
  {
    href: "/articles",
    label: "Reader",
    icon: "articles",
    section: "WORKSPACE",
    shortcut: "4",
    flag: "article_reader",
  },

  // LIBRARY
  {
    href: "/bookmarks",
    label: "Bookmarks",
    icon: "bookmarks",
    section: "LIBRARY",
    shortcut: "B",
  },
  {
    href: "/#scratchpad",
    label: "Scratchpad Notes",
    icon: "scratchpad",
    section: "LIBRARY",
    shortcut: "N",
  },
  {
    href: "/#coffee-break",
    label: "Coffee Break",
    icon: "coffee",
    section: "LIBRARY",
    shortcut: "M",
  },

  // SYSTEM
  {
    href: "/settings",
    label: "API Keys & Settings",
    icon: "settings",
    section: "SYSTEM",
    shortcut: "S",
  },
  {
    href: "/admin",
    label: "Admin Controls",
    icon: "admin",
    section: "SYSTEM",
    shortcut: "A",
    adminOnly: true,
  },
] as const;
