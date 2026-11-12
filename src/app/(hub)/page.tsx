import { Suspense } from "react";

import { HomeCanvas } from "@/components/dashboard/home-canvas";
import { RaycastOmniBar } from "@/components/dashboard/raycast-omni-bar";

function HomeSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="h-80 rounded-lg border border-zinc-800/80 bg-zinc-900/30 lg:col-span-7" />
      <div className="h-80 rounded-lg border border-zinc-800/80 bg-zinc-900/30 lg:col-span-5" />
    </div>
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-7 px-8 py-7">
      <RaycastOmniBar />
      <Suspense fallback={<HomeSkeleton />}>
        <HomeCanvas />
      </Suspense>
    </main>
  );
}
