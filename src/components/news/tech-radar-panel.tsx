import { ArrowUpRight } from "lucide-react";

type RadarCategory = "ADOPT" | "TRIAL" | "ASSESS";

type RadarItem = {
  name: string;
  category: RadarCategory;
  domain: string;
  note: string;
  url: string;
};

const RADAR_ITEMS: RadarItem[] = [
  {
    name: "Rust Zero-Copy Buffers",
    category: "ADOPT",
    domain: "Systems",
    note: "Eliminating kernel context switches on modern NVMe drives.",
    url: "https://news.ycombinator.com",
  },
  {
    name: "Next.js 16 Cache Life",
    category: "ADOPT",
    domain: "Web Architecture",
    note: "Fine-grained cache tags and PPR dynamic streaming.",
    url: "https://nextjs.org",
  },
  {
    name: "Spatial Token Grounding",
    category: "TRIAL",
    domain: "AI / Agents",
    note: "Multimodal coordinate memory reducing hallucinations in web agents.",
    url: "https://github.com",
  },
  {
    name: "p99 Tail Profiling",
    category: "TRIAL",
    domain: "Performance",
    note: "Continuous eBPF profiling without runtime overhead.",
    url: "https://dev.to",
  },
  {
    name: "Atomic Clock Consensus",
    category: "ASSESS",
    domain: "Distributed DBs",
    note: "Hardware GPS synchronization for linearizable multi-region commits.",
    url: "https://news.ycombinator.com",
  },
];

export function TechRadarPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <span className="font-mono text-xs md:text-[13px] font-semibold uppercase tracking-wider text-zinc-300">
          Tech to Learn Radar
        </span>
        <span className="font-mono text-xs text-zinc-400">Q4 2026</span>
      </div>

      <div className="space-y-3">
        {(["ADOPT", "TRIAL", "ASSESS"] as const).map((cat) => {
          const items = RADAR_ITEMS.filter((i) => i.category === cat);
          const badgeColor =
            cat === "ADOPT"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : cat === "TRIAL"
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
              : "bg-blue-500/10 text-blue-400 border-blue-500/30";

          return (
            <div
              key={cat}
              className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`rounded border px-2 py-0.5 font-mono text-xs font-semibold tracking-wider ${badgeColor}`}
                >
                  {cat}
                </span>
                <span className="font-mono text-xs text-zinc-400">
                  {items.length} Technologies
                </span>
              </div>

              <div className="space-y-2.5 divide-y divide-zinc-800/50">
                {items.map((item) => (
                  <div key={item.name} className="pt-2.5 first:pt-0">
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm md:text-[15px] font-medium text-zinc-100 hover:text-white transition-colors line-clamp-2 leading-snug"
                      >
                        {item.name}
                      </a>
                      <ArrowUpRight className="size-3.5 text-zinc-400 shrink-0" />
                    </div>
                    <p className="text-xs md:text-[13px] text-zinc-300 font-mono leading-relaxed mt-1">
                      {item.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
