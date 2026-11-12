"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { NoteTimestamp } from "@/db/schema";
import { hasDatabaseUrl } from "@/db";
import {
  createVaultVideo,
  deleteVaultVideo,
  saveVaultNote,
  updateVaultVideoStatus,
} from "@/lib/vault/data";
import { requireUser } from "@/lib/session";
import { isFeatureEnabled } from "@/lib/feature-flags";

async function requireVaultUser() {
  const session = await requireUser();

  if (!(await isFeatureEnabled("video_vault", { role: session.user.role }))) {
    redirect("/");
  }

  if (!hasDatabaseUrl()) {
    throw new Error(
      "DATABASE_URL is not set. Add your Neon connection string to .env.local.",
    );
  }

  return session;
}

export type VaultActionState = {
  error?: string;
  success?: string;
};

export async function addVaultVideoAction(
  _prev: VaultActionState,
  formData: FormData,
): Promise<VaultActionState> {
  try {
    const session = await requireVaultUser();
    const url = String(formData.get("url") ?? "");
    const item = await createVaultVideo(session.user.id, url);

    revalidatePath("/vault");
    revalidatePath("/");
    redirect(`/vault/${item.id}`);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    return {
      error:
        error instanceof Error ? error.message : "Could not add that video.",
    };
  }
}

export async function toggleVaultStatusAction(
  resourceId: string,
  status: "TO_READ" | "COMPLETED",
) {
  const session = await requireVaultUser();
  await updateVaultVideoStatus(session.user.id, resourceId, status);
  revalidatePath("/vault");
  revalidatePath(`/vault/${resourceId}`);
}

export async function deleteVaultVideoAction(resourceId: string) {
  const session = await requireVaultUser();
  await deleteVaultVideo(session.user.id, resourceId);
  revalidatePath("/vault");
  redirect("/vault");
}

export async function saveVaultNoteAction(input: {
  resourceId: string;
  content: string;
  timestamps: NoteTimestamp[];
}) {
  const session = await requireVaultUser();
  const note = await saveVaultNote(session.user.id, input.resourceId, {
    content: input.content,
    timestamps: input.timestamps,
  });

  return {
    id: note.id,
    updatedAt: note.updatedAt.toISOString(),
  };
}
