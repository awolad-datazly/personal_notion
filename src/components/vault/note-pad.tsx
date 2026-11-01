"use client";

import { BookmarkPlus, Clock3 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { saveVaultNoteAction } from "@/app/actions/vault";
import { useVaultPlayer } from "@/components/vault/player-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import type { NoteTimestamp } from "@/db/schema";
import { getStudySessions, saveStudySession } from "@/lib/study-storage";
import { formatTimestamp, parseTimestampToken } from "@/lib/youtube";

function sortTimestamps(items: NoteTimestamp[]) {
  return [...items].sort((a, b) => a.seconds - b.seconds);
}

function markdownForPreview(content: string) {
  return content.replace(
    /\[(\d+:\d{2}(?::\d{2})?)\]/g,
    (_match, stamp: string) => `\`${stamp}\``,
  );
}

export function NotePad({
  resourceId,
  videoId,
  videoTitle,
  initialContent = "",
  initialTimestamps = [],
  updatedAt = null,
}: {
  resourceId?: string;
  videoId?: string;
  videoTitle?: string;
  initialContent?: string;
  initialTimestamps?: NoteTimestamp[];
  updatedAt?: string | null;
}) {
  const { apiRef } = useVaultPlayer();

  // Check if we have an existing local session for this video
  const localSession = useMemo(() => {
    if (!videoId) return null;
    return getStudySessions().find((s) => s.videoId === videoId) ?? null;
  }, [videoId]);

  const [content, setContent] = useState(
    () => initialContent || localSession?.notes || "",
  );
  const [timestamps, setTimestamps] = useState<NoteTimestamp[]>(() => {
    if (initialTimestamps && initialTimestamps.length > 0) {
      return sortTimestamps(initialTimestamps);
    }
    return [];
  });
  const [savedAt, setSavedAt] = useState(updatedAt || localSession?.updatedAt || null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [isPending, startTransition] = useTransition();
  const hydrated = useRef(false);

  const preview = useMemo(() => markdownForPreview(content), [content]);

  const captureTimestamp = useCallback(() => {
    const rawSeconds = apiRef.current?.getCurrentTime() ?? 0;
    const seconds = Math.floor(rawSeconds);
    const label = formatTimestamp(seconds);
    const token = `[${label}]`;

    toast.success(`Timestamp [${label}] added`);

    setTimestamps((current) => {
      if (current.some((item) => item.seconds === seconds)) {
        return current;
      }
      return sortTimestamps([...current, { seconds, label }]);
    });

    setContent((current) => {
      if (!current) {
        return `${token} `;
      }
      const needsBreak = !/\n$/.test(current);
      return `${current}${needsBreak ? "\n\n" : ""}${token} `;
    });
  }, [apiRef]);

  // Global Cmd+J / Ctrl+J keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        captureTimestamp();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [captureTimestamp]);

  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }

    const handle = window.setTimeout(() => {
      // 1. Sync to local storage for instant reactive updates in Continue Studying
      if (videoId) {
        const lastPos =
          timestamps.length > 0
            ? timestamps[timestamps.length - 1].label || "00:00"
            : "00:00";
        saveStudySession({
          videoId,
          title: videoTitle || "YouTube Study Session",
          notes: content,
          timestampsCount: timestamps.length,
          lastPosition: lastPos,
        });
      }

      // 2. Sync to DB if resourceId is given
      if (resourceId && !resourceId.startsWith("local-")) {
        startTransition(async () => {
          try {
            setStatus("saving");
            const result = await saveVaultNoteAction({
              resourceId,
              content,
              timestamps,
            });
            setSavedAt(result.updatedAt);
            setStatus("saved");
          } catch {
            setStatus("error");
          }
        });
      } else {
        setSavedAt(new Date().toISOString());
        setStatus("saved");
      }
    }, 700);

    return () => window.clearTimeout(handle);
  }, [content, resourceId, timestamps, videoId, videoTitle]);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-zinc-800/80 bg-zinc-900/40">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800/80 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-zinc-100">Study Notepad</p>
          <p className="font-mono text-xs text-zinc-400">
            {status === "saving" || isPending
              ? "Saving…"
              : status === "error"
                ? "Save failed"
                : savedAt
                  ? `Saved ${new Date(savedAt).toLocaleTimeString()}`
                  : "Autosave on"}
          </p>
        </div>
        <button
          type="button"
          onClick={captureTimestamp}
          className="flex h-8 items-center gap-1.5 rounded-md bg-zinc-100 px-3 text-xs font-semibold text-zinc-950 hover:bg-white active:scale-[0.98] transition-all shadow-xs"
        >
          <BookmarkPlus className="size-3.5" />
          <span>+ Insert Timestamp</span>
          <kbd className="hidden sm:inline-flex items-center rounded border border-zinc-300 bg-zinc-200/80 px-1 font-mono text-[10px] text-zinc-700 ml-1">
            ⌘J
          </kbd>
        </button>
      </div>

      {timestamps.length > 0 ? (
        <div className="border-b border-zinc-800/80 px-4 py-3">
          <div className="mb-2 flex items-center gap-1.5 font-mono text-xs text-zinc-400">
            <Clock3 className="size-3.5 text-zinc-400" />
            <span>Seek Marks ({timestamps.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {timestamps.map((mark) => (
              <button
                key={`${mark.seconds}-${mark.label ?? ""}`}
                type="button"
                onClick={() => apiRef.current?.seekTo(mark.seconds)}
                className="rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 font-mono text-xs text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
              >
                {mark.label ?? formatTimestamp(mark.seconds)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <Tabs defaultValue="write" className="flex min-h-0 flex-1 flex-col">
        <div className="px-4 pt-3">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="write" className="text-xs font-mono">Write</TabsTrigger>
            <TabsTrigger value="preview" className="text-xs font-mono">Preview</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent
          value="write"
          className="mt-0 flex min-h-0 flex-1 flex-col px-4 pb-4"
        >
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Capture study notes in Markdown. Use + Insert Timestamp (⌘J) to drop seek marks..."
            className="min-h-[18rem] flex-1 resize-none border-0 bg-transparent px-0 font-mono text-sm leading-relaxed text-zinc-200 placeholder:text-zinc-500 shadow-none focus-visible:ring-0"
          />
        </TabsContent>
        <TabsContent value="preview" className="mt-0 min-h-0 flex-1 px-4 pb-4">
          <ScrollArea className="h-full min-h-[18rem] rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-4">
            {preview.trim() ? (
              <article className="space-y-3 text-sm leading-relaxed text-zinc-200 [&_a]:text-zinc-100 [&_a]:underline [&_code]:rounded [&_code]:bg-zinc-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:text-zinc-100 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-zinc-100 [&_li]:ml-4 [&_li]:list-disc [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-zinc-900 [&_pre]:p-3 [&_pre]:font-mono">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code: ({ children }) => {
                      const text = String(children).replace(/\n$/, "");
                      const seconds = parseTimestampToken(text);

                      if (seconds === null) {
                        return <code>{children}</code>;
                      }

                      return (
                        <button
                          type="button"
                          className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-zinc-200 hover:text-white hover:bg-zinc-700 transition-colors"
                          onClick={() => apiRef.current?.seekTo(seconds)}
                        >
                          {text}
                        </button>
                      );
                    },
                  }}
                >
                  {preview}
                </ReactMarkdown>
              </article>
            ) : (
              <p className="font-mono text-xs text-zinc-500">
                Nothing to preview yet. Use Write tab to take notes.
              </p>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className="border-t border-zinc-800/80 px-4 py-2 flex items-center justify-between font-mono text-xs text-zinc-400">
        <span>Markdown enabled</span>
        <span>Cmd+J for timestamp</span>
      </div>
    </div>
  );
}
