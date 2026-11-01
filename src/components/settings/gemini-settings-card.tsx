"use client";

import { Check, Eye, EyeOff, KeyRound, ShieldCheck, Trash2 } from "lucide-react";
import { useSyncExternalStore, useState } from "react";

import {
  clearGeminiKey,
  maskGeminiKey,
  readGeminiKey,
  writeGeminiKey,
} from "@/lib/gemini-key";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function GeminiSettingsCard() {
  const savedKey = useSyncExternalStore(subscribe, readGeminiKey, () => "");
  const [value, setValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const displayValue = isEditing ? value : (savedKey || value);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    writeGeminiKey(value);
    setIsEditing(false);
    setStatus("Gemini API key saved to local browser storage.");
    window.setTimeout(() => setStatus(null), 3000);
  }

  function handleClear() {
    clearGeminiKey();
    setValue("");
    setIsEditing(false);
    setStatus("Key removed from localStorage.");
    window.setTimeout(() => setStatus(null), 3000);
  }

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-6 space-y-4">
      <div className="flex items-center gap-3.5">
        <div className="flex size-9 items-center justify-center rounded-md bg-zinc-800 text-zinc-200 border border-zinc-700/60 shadow-xs">
          <KeyRound className="size-4 text-zinc-300" />
        </div>
        <div>
          <h2 className="text-base md:text-[17px] font-semibold text-zinc-100">
            Gemini API Key (BYOK)
          </h2>
          <p className="text-sm text-zinc-300 font-mono mt-0.5">
            Client-side API key for instant technical article & notes indexing
          </p>
        </div>
      </div>

      <div className="rounded-md border border-zinc-800/80 bg-zinc-950/70 p-4 text-sm text-zinc-300">
        <div className="flex items-center gap-2 font-medium text-zinc-200 font-mono text-xs uppercase tracking-wider">
          <ShieldCheck className="size-4 text-emerald-400" />
          <span>Zero Server Storage</span>
        </div>
        <p className="mt-1.5 font-mono text-xs md:text-[13px] text-zinc-300 leading-relaxed">
          Stored directly in your browser&apos;s localStorage and sent only with AI requests. Never logged or saved in databases.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        <label htmlFor="gemini-key" className="text-xs font-mono text-zinc-300 font-medium">
          Google AI Studio API Key:
        </label>
        <div className="flex gap-2.5">
          <div className="relative flex-1">
            <input
              id="gemini-key"
              type={showKey ? "text" : "password"}
              value={displayValue}
              onChange={(e) => {
                setIsEditing(true);
                setValue(e.target.value);
              }}
              placeholder="AIzaSy..."
              className="h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3.5 font-mono text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-hidden pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <button
            type="submit"
            className="h-10 rounded-md bg-zinc-100 px-4 text-sm font-medium text-zinc-950 hover:bg-white transition-colors shrink-0 shadow-xs"
          >
            Save Key
          </button>
          {savedKey ? (
            <button
              type="button"
              onClick={handleClear}
              className="flex size-10 items-center justify-center rounded-md border border-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors shrink-0"
              title="Remove key"
            >
              <Trash2 className="size-4" />
            </button>
          ) : null}
        </div>
      </form>

      {status ? (
        <p className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
          <Check className="size-3.5" />
          <span>{status}</span>
        </p>
      ) : savedKey ? (
        <p className="font-mono text-xs text-zinc-400">
          Active key: {maskGeminiKey(savedKey)}
        </p>
      ) : (
        <p className="text-xs font-mono text-zinc-400">
          Obtain a free key at{" "}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-200 underline hover:text-white"
          >
            Google AI Studio ↗
          </a>
        </p>
      )}
    </div>
  );
}
