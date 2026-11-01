import {
  Bookmark,
  BookOpenText,
  Clapperboard,
  LayoutDashboard,
  Newspaper,
  PenLine,
  Settings,
  Shield,
  type LucideIcon,
} from "lucide-react";

import type { NavIconName } from "@/config/navigation";

export const NAV_ICONS: Record<NavIconName, LucideIcon> = {
  overview: LayoutDashboard,
  news: Newspaper,
  vault: Clapperboard,
  articles: BookOpenText,
  bookmarks: Bookmark,
  scratchpad: PenLine,
  settings: Settings,
  admin: Shield,
};
