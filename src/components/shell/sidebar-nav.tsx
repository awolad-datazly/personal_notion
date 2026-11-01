"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useSyncExternalStore } from "react";
import { NAV_ICONS } from "@/components/shell/nav-icons";
import type { NavItem, NavSection } from "@/config/navigation";
import { getBookmarks } from "@/lib/bookmarks-storage";
import { subscribeToStorage } from "@/lib/storage-bus";
import { cn } from "@/lib/utils";

const SECTIONS: NavSection[] = ["WORKSPACE", "LIBRARY", "SYSTEM"];

export function SidebarNav({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const bookmarkCount = useSyncExternalStore(subscribeToStorage, () => getBookmarks().length, () => 4);

  return (
    <nav className="flex flex-col gap-4 px-3 py-3">
      {SECTIONS.map((section) => {
        const sectionItems = items.filter((item) => item.section === section);
        if (sectionItems.length === 0) return null;

        return (
          <div key={section} className="flex flex-col gap-1">
            <div className="px-3 py-1 text-xs md:text-[13px] font-mono font-semibold uppercase tracking-wider text-zinc-300 select-none">
              {section}
            </div>
            {sectionItems.map((item) => {
              const Icon = NAV_ICONS[item.icon];
              const isHash = item.href.includes("#");
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : !isHash && (pathname === item.href || pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    onNavigate?.();
                    if (isHash) {
                      const id = item.href.split("#")[1];
                      if (id) {
                        setTimeout(() => {
                          const el = document.getElementById(id);
                          el?.scrollIntoView({ behavior: "smooth" });
                        }, 50);
                      }
                    }
                  }}
                  className={cn(
                    "group flex h-9 items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-zinc-800/90 text-white shadow-xs border border-zinc-700/60"
                      : "text-zinc-300 hover:bg-zinc-800/50 hover:text-white",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      active
                        ? "text-white"
                        : "text-zinc-400 group-hover:text-zinc-200",
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.shortcut ? (
                    <kbd className="hidden font-mono text-xs text-zinc-400 group-hover:text-zinc-300 sm:inline-block">
                      {item.shortcut}
                    </kbd>
                  ) : item.href === "/bookmarks" ? (
                    <span className="font-mono text-xs text-zinc-300 rounded bg-zinc-800 px-2 py-0.5 border border-zinc-700/50">
                      {bookmarkCount}
                    </span>
                  ) : item.count ? (
                    <span className="font-mono text-xs text-zinc-300 rounded bg-zinc-800 px-2 py-0.5 border border-zinc-700/50">
                      {item.count}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
