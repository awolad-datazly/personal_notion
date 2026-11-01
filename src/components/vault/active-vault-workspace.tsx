"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LearningWorkspace } from "@/components/vault/learning-workspace";
import { getStudySessions, saveStudySession } from "@/lib/study-storage";

export function ActiveVaultWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const watchId = searchParams.get("watch") || "";

  const [fetchedTitle, setFetchedTitle] = useState<string | null>(null);

  const matchedSession = useMemo(() => {
    if (!watchId) return null;
    return getStudySessions().find((s) => s.videoId === watchId) ?? null;
  }, [watchId]);

  useEffect(() => {
    if (!watchId) return;

    if (!matchedSession?.title || matchedSession.title === "YouTube Study Session") {
      fetch(`/api/youtube?id=${watchId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.title) {
            setFetchedTitle(data.title);
            saveStudySession({
              videoId: watchId,
              title: data.title,
            });
          }
        })
        .catch(() => {});
    }
  }, [watchId, matchedSession]);

  if (!watchId) {
    return null;
  }

  const title = fetchedTitle || matchedSession?.title || "YouTube Study Session";

  function handleClose() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("watch");
    const next = params.toString() ? `?${params.toString()}` : "/vault";
    router.push(next);
  }

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-5 shadow-xs mb-2">
      <LearningWorkspace
        videoId={watchId}
        title={title}
        initialContent={matchedSession?.notes || ""}
        onClose={handleClose}
      />
    </div>
  );
}
