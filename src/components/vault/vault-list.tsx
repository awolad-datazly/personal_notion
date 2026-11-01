import Link from "next/link";
import { ArrowUpRight, Play, Trash2 } from "lucide-react";

import {
  deleteVaultVideoAction,
  toggleVaultStatusAction,
} from "@/app/actions/vault";
import type { VaultItem } from "@/lib/vault/data";
import { youtubeThumbnailUrl } from "@/lib/youtube";

export function VaultList({ items }: { items: VaultItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-800 p-12 text-center space-y-2">
        <p className="font-mono text-sm font-semibold text-zinc-200">
          Nothing saved in the vault yet. Either you already know everything, or you&apos;re procrastinating.
        </p>
        <p className="font-mono text-xs text-zinc-400">
          Paste a YouTube tutorial or engineering talk in the input bar above to begin a session.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const thumb = item.videoId
          ? youtubeThumbnailUrl(item.videoId)
          : undefined;

        return (
          <div
            key={item.id}
            className="group flex flex-col justify-between overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-900/30 transition-colors hover:border-zinc-700 shadow-xs"
          >
            <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden">
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumb}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : null}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
              <Link
                href={`/vault/${item.id}`}
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-xs"
              >
                <div className="flex h-9 items-center gap-2 rounded-md border border-zinc-700 bg-zinc-950/90 px-4 font-mono text-sm font-medium text-zinc-100 shadow-md">
                  <Play className="size-3.5 fill-current" />
                  <span>Resume</span>
                </div>
              </Link>
            </div>

            <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
              <div>
                <Link
                  href={`/vault/${item.id}`}
                  className="line-clamp-2 text-base md:text-[17px] font-semibold leading-snug text-zinc-100 group-hover:text-white transition-colors"
                >
                  {item.title}
                </Link>
                <p className="mt-1 font-mono text-xs text-zinc-400">
                  {item.domain ?? "youtube.com"}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800/60 font-mono text-xs">
                <form action={toggleVaultStatusAction.bind(null, item.id, item.status === "COMPLETED" ? "TO_READ" : "COMPLETED")}>
                  <button
                    type="submit"
                    className={`rounded-md px-2.5 py-1 text-xs transition-colors border font-medium ${
                      item.status === "COMPLETED"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-zinc-700/60 bg-zinc-800/80 text-zinc-300 hover:text-white"
                    }`}
                  >
                    {item.status === "COMPLETED" ? "Completed" : "In Progress"}
                  </button>
                </form>

                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/vault/${item.id}`}
                    className="flex h-8 items-center gap-1 rounded-md bg-zinc-100 px-3 text-xs font-medium text-zinc-950 hover:bg-white transition-colors shadow-xs"
                  >
                    <span>Open</span>
                    <ArrowUpRight className="size-3" />
                  </Link>

                  <form action={deleteVaultVideoAction.bind(null, item.id)}>
                    <button
                      type="submit"
                      className="flex size-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-red-400 transition-colors"
                      title="Delete video"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
