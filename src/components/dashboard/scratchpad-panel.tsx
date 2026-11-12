"use client";

import { Check, Copy, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { saveScratchpadAction, toggleBookmarkAction } from "@/app/actions/library";
import { toast } from "@/components/ui/toast";
import { SCRATCHPAD_URL } from "@/lib/library/urls";

export function ScratchpadPanel({
  initialContent,
  signedIn,
}: {
  initialContent: string;
  signedIn: boolean;
}) {
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [copied, setCopied] = useState(false);
  const savedRef = useRef(initialContent);

  useEffect(() => {
    if (!signedIn || content === savedRef.current) {
      return;
    }

    const handle = window.setTimeout(() => {
      const snapshot = content;
      setStatus("saving");
      void saveScratchpadAction(snapshot)
        .then((result) => {
          if (!result.ok) {
            setStatus("error");
            return;
          }
          savedRef.current = snapshot;
          setStatus("saved");
        })
        .catch(() => setStatus("error"));
    }, 500);

    return () => window.clearTimeout(handle);
  }, [content, signedIn]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy the scratchpad");
    }
  }

  function handleClear() {
    setContent("");
  }

  async function handlePin() {
    const result = await toggleBookmarkAction({
      url: SCRATCHPAD_URL,
      title: "Scratchpad",
      summary: content,
    });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(
      result.bookmarked ? "Scratchpad pinned to bookmarks" : "Removed from bookmarks",
    );
  }

  return (
    <div id="scratchpad" className="flex flex-col space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs md:text-[13px] font-semibold uppercase tracking-wider text-zinc-300">
            Scratchpad
          </span>
          <span className="font-mono text-xs text-zinc-400">
            {signedIn
              ? status === "saving"
                ? "Saving…"
                : status === "saved"
                  ? "Saved to your library"
                  : status === "error"
                    ? "Save failed"
                    : "Saved to your library"
              : "Sign in to save"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs">
          {signedIn ? (
            <button
              type="button"
              onClick={() => void handlePin()}
              className="flex h-7 items-center rounded-md px-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              Pin
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void handleCopy()}
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
            disabled={!signedIn}
            className="flex size-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-red-400 transition-colors disabled:opacity-40"
            title="Clear Scratchpad"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3.5 focus-within:border-zinc-700 transition-colors">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          disabled={!signedIn}
          placeholder={
            signedIn
              ? "Jot markdown notes, paste URLs, or store temporary snippets..."
              : "Sign in to keep a scratchpad in your library."
          }
          rows={7}
          className="w-full resize-y bg-transparent font-mono text-sm leading-relaxed text-zinc-200 placeholder:text-zinc-500 focus:outline-hidden disabled:cursor-not-allowed"
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
