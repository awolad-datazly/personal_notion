"use client";

import { useSearchParams } from "next/navigation";

import { authErrorMessage } from "@/lib/auth-errors";

export function AuthStatusBanner() {
  const message = authErrorMessage(useSearchParams().get("error"));

  if (!message) {
    return null;
  }

  return (
    <div className="border-b border-red-500/30 bg-red-500/10 px-6 py-2.5 font-mono text-xs text-red-200">
      {message}
    </div>
  );
}
