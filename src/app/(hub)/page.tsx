import { DevMemeCard } from "@/components/dashboard/dev-meme-card";
import { RaycastOmniBar } from "@/components/dashboard/raycast-omni-bar";
import { ScratchpadPanel } from "@/components/dashboard/scratchpad-panel";
import { StudyVaultCompact } from "@/components/dashboard/study-vault-compact";
import { TechSignalTable } from "@/components/dashboard/tech-signal-table";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-7 px-8 py-7">
      {/* 1. Raycast-Style Omni-Command Input Bar */}
      <RaycastOmniBar />

      {/* 2. High-Density Asymmetric Workspace Canvas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 7 Columns: Live Tech Signal Feed */}
        <section className="lg:col-span-7">
          <TechSignalTable />
        </section>

        {/* Right 5 Columns: Continue Studying, Quick Scratchpad & Dev Memes */}
        <section className="flex flex-col gap-6 lg:col-span-5">
          <StudyVaultCompact />
          <ScratchpadPanel />
          <DevMemeCard />
        </section>
      </div>
    </main>
  );
}
