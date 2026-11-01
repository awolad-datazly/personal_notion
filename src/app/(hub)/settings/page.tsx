import { Suspense } from "react";
import { Coffee, Command, Cpu, HardDrive, KeyRound, User } from "lucide-react";

import { AccountSettingsCard, AccountSettingsSkeleton } from "@/components/settings/account-settings-card";
import { GeminiSettingsCard } from "@/components/settings/gemini-settings-card";

const SHORTCUTS = [
  { key: "1", label: "Overview Hub", scope: "Global" },
  { key: "2", label: "News Radar", scope: "Global" },
  { key: "3", label: "Video Vault", scope: "Global" },
  { key: "4", label: "Article Reader", scope: "Global" },
  { key: "B", label: "Saved Bookmarks", scope: "Global" },
  { key: "N", label: "Scratchpad Notes", scope: "Global" },
  { key: "S", label: "Settings", scope: "Global" },
  { key: "⌘K", label: "Omni Command Palette", scope: "Workspace" },
];

export default function SettingsPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-8 py-7">
      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3 mb-6">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="h-8 flex items-center gap-1.5 rounded-md bg-zinc-100 px-3 text-xs md:text-[13px] font-semibold text-zinc-950 shadow-xs">
            <Cpu className="size-4" />
            <span>Preferences</span>
          </span>
          <span className="h-8 flex items-center gap-1.5 rounded-md px-3 text-xs md:text-[13px] font-mono text-zinc-400">
            <KeyRound className="size-4" />
            <span>BYOK</span>
          </span>
          <span className="h-8 flex items-center gap-1.5 rounded-md px-3 text-xs md:text-[13px] font-mono text-zinc-400">
            <User className="size-4" />
            <span>Auth</span>
          </span>
          <span className="h-8 flex items-center gap-1.5 rounded-md px-3 text-xs md:text-[13px] font-mono text-zinc-400">
            <Command className="size-4" />
            <span>Shortcuts</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block font-mono text-xs text-zinc-400">
            v0.2.0-beta · BYOK Architecture
          </span>
        </div>
      </div>

      {/* 2-Column Asymmetric Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left Column (7 cols): Primary Configuration */}
        <div className="lg:col-span-7 space-y-6">
          <GeminiSettingsCard />

          <Suspense fallback={<AccountSettingsSkeleton />}>
            <AccountSettingsCard />
          </Suspense>
        </div>

        {/* Right Column (5 cols): System Status & Keyboard Reference */}
        <div className="lg:col-span-5 space-y-6">
          {/* Privacy & Engine Architecture */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-6">
            <div className="flex items-center gap-2 mb-3.5">
              <HardDrive className="size-4 text-zinc-300" />
              <h3 className="text-sm font-semibold text-zinc-100">
                Data Architecture & Privacy
              </h3>
            </div>
            <ul className="space-y-3 text-xs md:text-[13px] font-mono text-zinc-300">
              <li className="flex items-start gap-2.5">
                <span className="size-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong className="text-zinc-100">Local-First Storage:</strong> Scratchpad notes, reading progress, and API keys reside in browser storage.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="size-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong className="text-zinc-100">Direct Gemini Calls:</strong> AI indexing communicates directly with Google AI Studio using your key.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="size-2 rounded-full bg-zinc-400 mt-1.5 shrink-0" />
                <span>
                  <strong className="text-zinc-100">Zero Analytics/Trackers:</strong> No third-party behavioral beacons or user surveillance scripts.
                </span>
              </li>
            </ul>
          </div>

          {/* Keyboard Shortcuts Reference */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-6">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <Command className="size-4 text-zinc-300" />
                <h3 className="text-sm font-semibold text-zinc-100">
                  Keyboard Shortcuts
                </h3>
              </div>
              <span className="font-mono text-xs text-zinc-400">Fast Nav</span>
            </div>
            <div className="divide-y divide-zinc-800/60 border border-zinc-800/80 rounded-md bg-zinc-950/50">
              {SHORTCUTS.map((sc) => (
                <div key={sc.key} className="flex items-center justify-between px-3.5 py-2.5 text-xs md:text-[13px]">
                  <span className="font-mono text-zinc-200 font-medium">{sc.label}</span>
                  <kbd className="rounded border border-zinc-700/60 bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-200">
                    {sc.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Support DevPulse */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-6">
            <div className="flex items-center gap-2 mb-2">
              <Coffee className="size-4 text-pink-400" />
              <h3 className="text-sm font-semibold text-zinc-100">
                Support DevPulse
              </h3>
            </div>
            <p className="text-xs md:text-[13px] text-zinc-300 font-mono leading-relaxed">
              DevPulse is independent software crafted for distraction-free deep work. If it saves you time, support development with a 20৳ cup of tea.
            </p>
            <div className="mt-3.5 flex items-center justify-between pt-3 border-t border-zinc-800/60 font-mono text-xs text-zinc-400">
              <span>bKash Personal: 01789-XXXXXX</span>
              <span className="text-pink-400 font-medium">Click ☕ 20৳ floating pill</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
