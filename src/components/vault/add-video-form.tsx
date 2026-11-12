"use client";

import { ArrowRight } from "lucide-react";
import { useActionState } from "react";

import { addVaultVideoAction, type VaultActionState } from "@/app/actions/vault";

const initialState: VaultActionState = {};

export function AddVideoForm() {
  const [state, formAction, pending] = useActionState(
    addVaultVideoAction,
    initialState,
  );

  return (
    <form action={formAction} className="w-full space-y-2">
      <div className="flex h-12 w-full items-center rounded-lg border border-zinc-800 bg-zinc-900/90 px-4 transition-colors focus-within:border-zinc-600 shadow-sm">
        <span className="font-mono text-sm font-semibold text-zinc-400 mr-3">&gt;</span>
        <input
          id="vault-url"
          name="url"
          type="text"
          required
          placeholder="Paste YouTube tutorial link (e.g. https://www.youtube.com/watch?v=...)"
          className="h-full flex-1 bg-transparent font-mono text-base text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex h-9 items-center gap-1.5 rounded-md bg-zinc-100 px-4 text-sm font-medium text-zinc-950 hover:bg-white disabled:opacity-50 transition-colors shadow-xs active:scale-[0.98]"
        >
          <span>{pending ? "Saving…" : "Launch Workspace"}</span>
          <ArrowRight className="size-4" />
        </button>
      </div>
      {state.error ? (
        <p className="font-mono text-xs text-red-400 pl-1">{state.error}</p>
      ) : null}
    </form>
  );
}
