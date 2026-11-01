export function ModulePlaceholder({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <section className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-5">
      <div className="flex items-center gap-2">
        <span className="rounded border border-zinc-700/60 bg-zinc-800/80 px-2 py-0.5 font-mono text-xs text-zinc-300">
          {phase}
        </span>
        <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
      </div>
      <p className="mt-2 text-xs font-mono text-zinc-400">
        {description}
      </p>
    </section>
  );
}
