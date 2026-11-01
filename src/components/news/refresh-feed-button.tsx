"use client";

import { RefreshCw } from "lucide-react";
import { useActionState } from "react";

import {
  refreshNewsFeedAction,
  type NewsActionState,
} from "@/app/actions/news";

const initialState: NewsActionState = {};

export function RefreshFeedButton() {
  const [state, formAction, pending] = useActionState(
    refreshNewsFeedAction,
    initialState,
  );

  return (
    <form action={formAction} className="inline-flex items-center gap-2.5">
      <button
        type="submit"
        disabled={pending}
        className="flex h-9 items-center gap-2 rounded-md border border-zinc-700/70 bg-zinc-800/90 px-3.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-700 hover:text-white disabled:opacity-50 shadow-xs"
      >
        <RefreshCw className={`size-4 text-zinc-400 ${pending ? "animate-spin" : ""}`} />
        <span>{pending ? "Scraping…" : "Refresh feed"}</span>
      </button>
      {state.success ? (
        <span className="font-mono text-xs text-emerald-400">{state.success}</span>
      ) : null}
      {state.error ? (
        <span className="font-mono text-xs text-red-400">{state.error}</span>
      ) : null}
    </form>
  );
}
