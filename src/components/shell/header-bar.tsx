"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Suspense } from "react";

import { ByokDialog } from "@/components/ai/byok-dialog";
import { openCommandPalette } from "@/components/shell/command-palette";
import { MobileNav } from "@/components/shell/mobile-nav";
import type { NavItem } from "@/config/navigation";

const ROUTE_LABELS: Record<string, string> = {
  "/": "Overview",
  "/news": "News Radar",
  "/vault": "Video Vault",
  "/articles": "Article Reader",
  "/bookmarks": "Bookmarks",
  "/settings": "Settings",
  "/admin": "Admin Controls",
};

export function HeaderBar({
  items,
  bookmarkCount = 0,
  userMenu,
}: {
  items: NavItem[];
  bookmarkCount?: number;
  userMenu: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentLabel =
    ROUTE_LABELS[pathname] ??
    (pathname.startsWith("/vault/") ? "Study Session" : "Workspace");

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-zinc-800/80 bg-zinc-950/85 px-6 sm:px-8 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <MobileNav items={items} bookmarkCount={bookmarkCount} />
        <div className="flex items-center gap-2 text-sm">
          <span className="font-mono text-zinc-400">Workspace</span>
          <span className="text-zinc-600">/</span>
          <span className="font-medium text-zinc-100">{currentLabel}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* ⌘K search trigger */}
        <button
          type="button"
          onClick={openCommandPalette}
          className="hidden h-9 items-center gap-2.5 rounded-md border border-zinc-800 bg-zinc-900/90 px-3.5 text-sm font-mono text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white sm:inline-flex active:scale-[0.98]"
        >
          <Search className="size-4 text-zinc-400" />
          <span>Quick command</span>
          <kbd className="rounded border border-zinc-700/60 bg-zinc-800/80 px-1.5 py-0.5 font-mono text-xs text-zinc-300">
            ⌘K
          </kbd>
        </button>

        {/* Gemini Key indicator */}
        <ByokDialog />

        {/* User menu / Sign in */}
        <Suspense fallback={<div className="h-9 w-24 rounded-md bg-zinc-800/60 animate-pulse" />}>
          {userMenu}
        </Suspense>
      </div>
    </header>
  );
}
