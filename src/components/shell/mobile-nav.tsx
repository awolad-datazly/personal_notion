"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { SidebarNav } from "@/components/shell/sidebar-nav";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { NavItem } from "@/config/navigation";

export function MobileNav({
  items,
  bookmarkCount = 0,
}: {
  items: NavItem[];
  bookmarkCount?: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white lg:hidden shadow-xs"
        >
          <Menu className="size-4" />
          <span className="sr-only">Open navigation</span>
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 bg-zinc-950 border-r border-zinc-800">
        <SheetHeader className="border-b border-zinc-800/80 px-4 py-3 text-left">
          <SheetTitle className="text-xs font-mono uppercase tracking-wider text-zinc-300">
            Navigation
          </SheetTitle>
        </SheetHeader>
        <SidebarNav
          items={items}
          bookmarkCount={bookmarkCount}
          onNavigate={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
