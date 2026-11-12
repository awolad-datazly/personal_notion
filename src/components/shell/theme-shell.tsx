import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { AuthStatusBanner } from "@/components/auth/auth-status-banner";
import { FeatureGate } from "@/components/feature-flags/feature-gate";
import { HeaderBar } from "@/components/shell/header-bar";
import { getVisibleNavItems } from "@/components/shell/nav-items";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { UserMenu } from "@/components/shell/user-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { SupportWidget } from "@/components/support/support-widget";
import { CommandPalette } from "@/components/shell/command-palette";
import { ToastContainer } from "@/components/ui/toast";
import { ArticleReaderDrawer } from "@/components/reader/article-reader-drawer";
import { DevStatusFooter } from "@/components/shell/dev-status-footer";
import { hasDatabaseUrl } from "@/db";
import { auth } from "@/auth";
import { countBookmarks } from "@/lib/library/data";

async function ShellChrome({ children }: { children: React.ReactNode }) {
  await connection();

  const session = await auth();
  const role = session?.user.role ?? null;
  const items = await getVisibleNavItems(role);
  let bookmarkCount = 0;

  if (session?.user.id && hasDatabaseUrl()) {
    try {
      bookmarkCount = await countBookmarks(session.user.id);
    } catch {
      bookmarkCount = 0;
    }
  }

  return (
    <div className="flex min-h-full flex-1 bg-zinc-950 text-zinc-100">
      {/* Precision Linear-style sidebar (w-64) */}
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r border-zinc-800/80 bg-zinc-950 lg:flex lg:flex-col">
        <div className="flex h-14 items-center justify-between border-b border-zinc-800/80 px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-6 items-center justify-center rounded-md bg-zinc-800 text-xs font-mono font-bold text-zinc-100 border border-zinc-700/60 shadow-xs">
              P
            </div>
            <span className="text-base font-semibold tracking-tight text-white">
              DevPulse
            </span>
          </Link>
          <span className="font-mono text-xs text-zinc-400">v1.0</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <SidebarNav items={items} bookmarkCount={bookmarkCount} />
        </div>

        <DevStatusFooter />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header Bar */}
        <HeaderBar
          items={items}
          bookmarkCount={bookmarkCount}
          userMenu={<UserMenu />}
        />

        <Suspense fallback={null}>
          <AuthStatusBanner />
        </Suspense>

        <div className="flex-1">{children}</div>
      </div>

      <FeatureGate flag="support_widget">
        <SupportWidget />
      </FeatureGate>

      <CommandPalette />
      <ToastContainer />
      <ArticleReaderDrawer />
    </div>
  );
}

export function ThemeShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 bg-zinc-950">
          <div className="hidden w-64 border-r border-zinc-800/80 lg:block" />
          <div className="flex-1">
            <div className="h-14 border-b border-zinc-800/80" />
            <div className="p-8">
              <Skeleton className="h-8 w-48 rounded-md bg-zinc-900" />
            </div>
          </div>
        </div>
      }
    >
      <ShellChrome>{children}</ShellChrome>
    </Suspense>
  );
}
