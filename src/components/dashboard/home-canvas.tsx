import { connection } from "next/server";

import { auth } from "@/auth";
import { DevMemeCard } from "@/components/dashboard/dev-meme-card";
import { ScratchpadPanel } from "@/components/dashboard/scratchpad-panel";
import { StudyVaultCompact } from "@/components/dashboard/study-vault-compact";
import { TechSignalTable } from "@/components/dashboard/tech-signal-table";
import { hasDatabaseUrl } from "@/db";
import {
  getScratchpad,
  listBookmarkedUrls,
  listContinueSources,
} from "@/lib/library/data";
import { toContinueStudyingCards } from "@/lib/library/present";
import { canonicalResourceUrl } from "@/lib/library/urls";
import { listTechNews } from "@/lib/news/data";

export async function HomeCanvas() {
  await connection();

  const session = await auth();
  const userId = session?.user.id;
  const signedIn = Boolean(userId);
  const canRefresh = session?.user.role === "ADMIN";

  let cards = toContinueStudyingCards([]);
  let scratchpad = "";
  let bookmarked = new Set<string>();
  let news: Awaited<ReturnType<typeof listTechNews>> = [];

  if (hasDatabaseUrl()) {
    try {
      news = await listTechNews("all");
    } catch {
      news = [];
    }

    if (userId) {
      try {
        const [continueRows, scratch, urls] = await Promise.all([
          listContinueSources(userId),
          getScratchpad(userId),
          listBookmarkedUrls(userId),
        ]);
        cards = toContinueStudyingCards(continueRows);
        scratchpad = scratch;
        bookmarked = new Set(urls);
      } catch {
        cards = [];
        scratchpad = "";
      }
    }
  }

  const signals = news.slice(0, 12).map((item) => {
    const canonical = canonicalResourceUrl(item.url);
    const savedUrl = "error" in canonical ? item.url : canonical.url;
    return {
      id: item.id,
      title: item.title,
      url: item.url,
      summary: item.summary,
      category: item.category,
      createdAt: item.createdAt.toISOString(),
      bookmarked: bookmarked.has(savedUrl) || bookmarked.has(item.url),
    };
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <section className="lg:col-span-7">
        <TechSignalTable items={signals} canRefresh={canRefresh} />
      </section>
      <section className="flex flex-col gap-6 lg:col-span-5">
        <StudyVaultCompact cards={cards} signedIn={signedIn} />
        <ScratchpadPanel initialContent={scratchpad} signedIn={signedIn} />
        <DevMemeCard />
      </section>
    </div>
  );
}
