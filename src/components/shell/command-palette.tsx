"use client";

import {
  BookOpen,
  Bookmark,
  FileText,
  KeyRound,
  LayoutDashboard,
  Newspaper,
  PenLine,
  Search,
  Settings,
  Video,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "@/components/ui/toast";

export function openCommandPalette() {
  window.dispatchEvent(new CustomEvent("devpulse.open-command-palette"));
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => {
          if (!prev) {
            setSearch("");
            setSelectedIndex(0);
          }
          return !prev;
        });
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    }

    function handleCustomOpen() {
      setSearch("");
      setSelectedIndex(0);
      setOpen(true);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("devpulse.open-command-palette", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("devpulse.open-command-palette", handleCustomOpen);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const items = [
    {
      id: "nav-overview",
      label: "Overview Workspace",
      category: "Navigation",
      shortcut: "1",
      icon: LayoutDashboard,
      action: () => router.push("/"),
    },
    {
      id: "nav-news",
      label: "News Radar Feed",
      category: "Navigation",
      shortcut: "2",
      icon: Newspaper,
      action: () => router.push("/news"),
    },
    {
      id: "nav-vault",
      label: "Video Vault & Study Player",
      category: "Navigation",
      shortcut: "3",
      icon: Video,
      action: () => router.push("/vault"),
    },
    {
      id: "nav-reader",
      label: "Article Reader (Clean Mode)",
      category: "Navigation",
      shortcut: "4",
      icon: BookOpen,
      action: () => router.push("/articles"),
    },
    {
      id: "nav-bookmarks",
      label: "Saved Bookmarks & Vault",
      category: "Navigation",
      shortcut: "B",
      icon: Bookmark,
      action: () => router.push("/bookmarks"),
    },
    {
      id: "nav-scratchpad",
      label: "Quick Scratchpad Notepad",
      category: "Navigation",
      shortcut: "N",
      icon: PenLine,
      action: () => {
        router.push("/#scratchpad");
        const el = document.getElementById("scratchpad");
        el?.scrollIntoView({ behavior: "smooth" });
      },
    },
    {
      id: "nav-settings",
      label: "Settings & Local BYOK Keys",
      category: "Navigation",
      shortcut: "S",
      icon: Settings,
      action: () => router.push("/settings"),
    },
    {
      id: "action-gemini",
      label: "Configure Gemini API Key",
      category: "Actions",
      icon: KeyRound,
      action: () => {
        window.dispatchEvent(new CustomEvent("devpulse.open-byok"));
      },
    },
    {
      id: "action-copy-scratchpad",
      label: "Copy Scratchpad Notes to Clipboard",
      category: "Actions",
      icon: FileText,
      action: () => {
        const notes = localStorage.getItem("devpulse.scratchpad") || "";
        if (notes) {
          navigator.clipboard.writeText(notes);
          toast.success("Scratchpad notes copied to clipboard");
        } else {
          toast.info("Scratchpad is empty");
        }
      },
    },
  ];

  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  function handleSelect(index: number) {
    const item = filtered[index];
    if (item) {
      setOpen(false);
      item.action();
    }
  }

  function handleKeyDownInInput(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(selectedIndex);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-900 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex h-12 items-center gap-3 border-b border-zinc-800 px-4">
          <Search className="size-4 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDownInInput}
            placeholder="Type a command or search workspace..."
            className="h-full flex-1 bg-transparent font-mono text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded p-1 text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs font-mono text-zinc-500">
              No commands found for &quot;{search}&quot;
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(index)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-zinc-800 text-white shadow-xs"
                      : "text-zinc-300 hover:bg-zinc-800/50 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="size-4 text-zinc-400" />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-zinc-500">
                      {item.category}
                    </span>
                    {item.shortcut ? (
                      <kbd className="rounded border border-zinc-700/60 bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-300">
                        {item.shortcut}
                      </kbd>
                    ) : null}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-zinc-800/80 px-4 py-2.5 font-mono text-xs text-zinc-500 bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>DevPulse Omni ⌘K</span>
        </div>
      </div>
    </div>
  );
}
