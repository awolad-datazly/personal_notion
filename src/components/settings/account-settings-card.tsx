import { connection } from "next/server";
import { User, Shield } from "lucide-react";

import { auth, signIn, signOut } from "@/auth";
import { isGoogleAuthConfigured } from "@/lib/roles";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="14" height="14">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export async function AccountSettingsCard() {
  await connection();
  const session = await auth();
  const user = session?.user;

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-6 space-y-4">
      <div className="flex items-center gap-3.5">
        <div className="flex size-9 items-center justify-center rounded-md bg-zinc-800 text-zinc-200 border border-zinc-700/60 shadow-xs">
          <User className="size-4 text-zinc-300" />
        </div>
        <div>
          <h2 className="text-base md:text-[17px] font-semibold text-zinc-100">
            Account & Session
          </h2>
          <p className="text-sm text-zinc-300 font-mono mt-0.5">
            Google authentication for cloud bookmarking and cross-device sync
          </p>
        </div>
      </div>

      <div className="border-t border-zinc-800/60 pt-4">
        {user ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt=""
                  width={40}
                  height={40}
                  referrerPolicy="no-referrer"
                  className="size-10 rounded-full border border-zinc-700/80"
                />
              ) : (
                <div className="flex size-10 items-center justify-center rounded-full bg-zinc-800 text-sm font-mono font-bold text-zinc-200 border border-zinc-700">
                  {user.name?.[0] ?? "U"}
                </div>
              )}
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-100">
                    {user.name ?? "Signed In User"}
                  </span>
                  <span className="rounded border border-zinc-700/70 bg-zinc-800/90 px-2 py-0.5 font-mono text-xs text-zinc-300">
                    {user.role === "ADMIN" ? "ADMIN" : "MEMBER"}
                  </span>
                </div>
                <p className="font-mono text-xs text-zinc-400">
                  {user.email}
                </p>
              </div>
            </div>

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/settings" });
              }}
            >
              <button
                type="submit"
                className="h-9 rounded-md border border-zinc-800 bg-zinc-950 px-4 font-mono text-sm text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-zinc-400" />
                <span className="text-sm font-medium text-zinc-100">
                  Guest Workspace Active
                </span>
              </div>
              <p className="mt-1 font-mono text-xs text-zinc-400">
                Sign in to save videos, articles, bookmarks, and your scratchpad.
              </p>
            </div>

            {isGoogleAuthConfigured() ? (
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/settings" });
                }}
              >
                <button
                  type="submit"
                  className="flex h-9 items-center gap-2 rounded-md bg-zinc-100 px-4 text-sm font-medium text-zinc-950 hover:bg-white transition-colors shrink-0 shadow-xs"
                >
                  <GoogleIcon className="size-4" />
                  <span>Connect Google</span>
                </button>
              </form>
            ) : (
              <button
                type="button"
                disabled
                className="h-9 rounded-md border border-zinc-800 bg-zinc-900/50 px-4 font-mono text-xs text-zinc-500 cursor-not-allowed"
              >
                Auth not configured
              </button>
            )}
          </div>
        )}
      </div>

      <div className="rounded-md border border-zinc-800/80 bg-zinc-950/40 p-3 text-xs font-mono text-zinc-400 flex items-center gap-2.5">
        <Shield className="size-4 text-zinc-400 shrink-0" />
        <span>We only request identity tokens to associate your saved study lists. No ads or profiling.</span>
      </div>
    </div>
  );
}

export function AccountSettingsSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-6 animate-pulse">
      <div className="flex items-center gap-3.5">
        <div className="size-9 rounded-md bg-zinc-800" />
        <div className="space-y-2">
          <div className="h-5 w-40 rounded bg-zinc-800" />
          <div className="h-4 w-56 rounded bg-zinc-800/60" />
        </div>
      </div>
    </div>
  );
}
