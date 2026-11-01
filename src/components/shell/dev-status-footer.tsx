"use client";

import { useState } from "react";
import { toast } from "@/components/ui/toast";

const DEV_STATUS_QUOTES = [
  "0 prod incidents today (yet)",
  "works on my machine • v1.0",
  "git push --force (pray mode)",
  "centering a div took 4 hours",
  "powered by caffeine & stackoverflow",
  "rm -rf node_modules resolved it",
  "npm audit: 47 vulnerabilities (0 given)",
  "TODO: fix before going to prod",
  "compiling shaders in brain...",
  "it worked in localhost:3000",
  "tabs vs spaces: holy war continues",
  "docker container is rebuilding...",
  "DNS propagation pending (2-48h)",
  "99 little bugs in the code...",
  "senior dev mode: coffee inside",
];

export function DevStatusFooter() {
  const [index, setIndex] = useState(0);

  function handleCycleQuote() {
    setIndex((prev) => {
      const nextIdx = (prev + 1) % DEV_STATUS_QUOTES.length;
      toast.info(`"${DEV_STATUS_QUOTES[nextIdx]}"`);
      return nextIdx;
    });
  }

  const currentQuote = DEV_STATUS_QUOTES[index];

  return (
    <div className="border-t border-zinc-800/80 px-4 py-3">
      <button
        type="button"
        onClick={handleCycleQuote}
        className="group flex w-full items-center justify-between text-left text-xs font-mono transition-colors hover:text-white cursor-pointer"
        title="Click to roll another dev status"
      >
        <span className="text-zinc-500 group-hover:text-zinc-400 select-none">Status</span>
        <span className="flex items-center gap-1.5 text-zinc-300 group-hover:text-white transition-colors truncate max-w-[170px]">
          <span className="size-2 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
          <span className="truncate">{currentQuote}</span>
        </span>
      </button>
    </div>
  );
}
