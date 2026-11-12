"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasDatabaseUrl } from "@/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import {
  refreshTechNewsFeed,
  saveNewsSummary,
  setMustLearn,
} from "@/lib/news/data";
import { requireAdmin, requireUser } from "@/lib/session";

async function requireNewsAccess() {
  const session = await requireUser();

  if (!(await isFeatureEnabled("news_radar", { role: session.user.role }))) {
    redirect("/");
  }

  if (!hasDatabaseUrl()) {
    throw new Error(
      "DATABASE_URL is not set. Add your Neon connection string to .env.local.",
    );
  }

  return session;
}

export type NewsActionState = {
  error?: string;
  success?: string;
};

export async function refreshNewsFeedAction(
  ..._args: [] | [NewsActionState] | [NewsActionState, FormData]
): Promise<NewsActionState> {
  void _args;
  try {
    await requireAdmin();

    if (!(await isFeatureEnabled("news_radar", { role: "ADMIN" }))) {
      return { error: "News Radar is not enabled." };
    }

    if (!hasDatabaseUrl()) {
      return {
        error:
          "DATABASE_URL is not set. Add your Neon connection string first.",
      };
    }

    const result = await refreshTechNewsFeed();
    revalidatePath("/news");
    revalidatePath("/");

    const warning =
      result.errors.length > 0
        ? ` Some sources failed: ${result.errors[0]}`
        : "";

    return {
      success: `Scraped ${result.scraped} stories · ${result.inserted} new · ${result.updated} updated.${warning}`,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not refresh the feed.",
    };
  }
}

export async function toggleMustLearnAction(id: string, next: boolean) {
  const session = await requireNewsAccess();

  if (session.user.role !== "ADMIN") {
    throw new Error("Only admins can mark Must Learn stories.");
  }

  await setMustLearn(id, next);
  revalidatePath("/news");
  revalidatePath("/");
}

export async function persistNewsSummaryAction(id: string, summary: string) {
  await requireNewsAccess();

  if (!(await isFeatureEnabled("ai_summarizer"))) {
    throw new Error("AI Summarizer is not enabled.");
  }

  const trimmed = summary.trim();
  if (!trimmed) {
    throw new Error("Summary is empty.");
  }

  await saveNewsSummary(id, trimmed);
  revalidatePath("/news");
  revalidatePath("/");
}
