"use client";

import { Check, Copy, Trash2 } from "lucide-react";
import { useSyncExternalStore, useState } from "react";

const STORAGE_KEY = "devpulse.scratchpad";
const DEFAULT_TEXT = `# Quick Notes & Code Snippets
- [ ] Review Raft consensus election timeouts
- [ ] Benchmark zero-copy buffer allocations in Rust
- Ref: https://v8.dev/blog/fast-properties
`;

function getSnapshot(): string {
  if (typeof window === "undefined") {
    return DEFAULT_TEXT;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved !== null ? saved : DEFAULT_TEXT;
  } catch {
    return DEFAULT_TEXT;
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function ScratchpadPanel() {
  const storedContent = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_TEXT);
  const [localContent, setLocalContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const content = isEditing ? localContent : storedContent;

  function handleChange(val: string) {
    setIsEditing(true);
    setLocalContent(val);
    try {
      localStorage.setItem(STORAGE_KEY, val);
    } catch {
      // storage error
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard error
    }
  }

  function handleClear() {
    setIsEditing(true);
    setLocalContent("");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // error
    }
  }

  return (
    <div id="scratchpad" className="flex flex-col space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs md:text-[13px] font-semibold uppercase tracking-wider text-zinc-300">
            Scratchpad
          </span>
          <span className="font-mono text-xs text-zinc-400">
            Local browser storage
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs">
          <button
            type="button"
            onClick={handleCopy}
            className="flex h-7 items-center gap-1.5 rounded-md px-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-400" />
            ) : (
              <Copy className="size-3.5" />
            )}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="flex size-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-red-400 transition-colors"
            title="Clear Scratchpad"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3.5 focus-within:border-zinc-700 transition-colors">
        <textarea
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Jot markdown notes, paste URLs, or store temporary snippets..."
          rows={7}
          className="w-full resize-y bg-transparent font-mono text-sm leading-relaxed text-zinc-200 placeholder:text-zinc-500 focus:outline-hidden"
          spellCheck={false}
        />
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 font-mono text-xs text-zinc-400">
          <span>Markdown supported</span>
          <span>{content.length} characters</span>
        </div>
      </div>
    </div>
  );
}
