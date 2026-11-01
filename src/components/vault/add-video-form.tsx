"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/components/ui/toast";
import { saveStudySession } from "@/lib/study-storage";
import { extractYouTubeId } from "@/lib/youtube";

export function AddVideoForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    const videoId = extractYouTubeId(trimmed);
    if (!videoId) {
      setError("Please enter a valid YouTube URL (e.g. https://www.youtube.com/watch?v=...)");
      return;
    }

    setError(null);
    setLoading(true);
    toast.success("Launching Study Workspace...");

    // Save initial session
    saveStudySession({
      videoId,
      title: "YouTube Study Session",
    });

    router.push(`/vault?watch=${encodeURIComponent(videoId)}`);

    // Fetch official title in background
    fetch(`/api/youtube?id=${videoId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.title) {
          saveStudySession({
            videoId,
            title: data.title,
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setUrl("");
      });
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-2">
      <div className="flex h-12 w-full items-center rounded-lg border border-zinc-800 bg-zinc-900/90 px-4 transition-colors focus-within:border-zinc-600 shadow-sm">
        <span className="font-mono text-sm font-semibold text-zinc-400 mr-3">&gt;</span>
        <input
          id="vault-url"
          name="url"
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Paste YouTube tutorial link (e.g. https://www.youtube.com/watch?v=...)"
          className="h-full flex-1 bg-transparent font-mono text-base text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex h-9 items-center gap-1.5 rounded-md bg-zinc-100 px-4 text-sm font-medium text-zinc-950 hover:bg-white disabled:opacity-50 transition-colors shadow-xs active:scale-[0.98]"
        >
          <span>{loading ? "Opening…" : "Launch Workspace"}</span>
          <ArrowRight className="size-4" />
        </button>
      </div>
      {error ? (
        <p className="font-mono text-xs text-red-400 pl-1">{error}</p>
      ) : null}
    </form>
  );
}
