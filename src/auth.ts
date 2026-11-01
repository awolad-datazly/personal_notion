import "server-only";

import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import type { Adapter, AdapterSession } from "next-auth/adapters";
import Google from "next-auth/providers/google";

import { getDb } from "@/db";
import { sessions, users, accounts } from "@/db/schema";
import { roleForEmail } from "@/lib/roles";

const adapterMethods = [
  "createUser",
  "getUser",
  "getUserByEmail",
  "getUserByAccount",
  "updateUser",
  "linkAccount",
  "unlinkAccount",
  "deleteUser",
  "createSession",
  "getSessionAndUser",
  "updateSession",
  "deleteSession",
  "createVerificationToken",
  "useVerificationToken",
  "getAccount",
  "createAuthenticator",
  "getAuthenticator",
  "listAuthenticatorsByUserId",
  "updateAuthenticatorCounter",
] as const;

let cachedAdapter: Adapter | undefined;

function realAdapter(): Adapter {
  if (!cachedAdapter) {
    cachedAdapter = enforceSingleSession(
      DrizzleAdapter(getDb(), {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
      }),
    );
  }

  return cachedAdapter;
}

function lazyAdapter(): Adapter {
  return new Proxy({} as Adapter, {
    has(_target, property) {
      return adapterMethods.includes(property as (typeof adapterMethods)[number]);
    },
    get(_target, property) {
      if (!adapterMethods.includes(property as (typeof adapterMethods)[number])) {
        return undefined;
      }

      return (...args: unknown[]) => {
        const adapter = realAdapter();
        const method = adapter[property as keyof Adapter];

        if (typeof method !== "function") {
          throw new Error(`Auth.js adapter is missing ${String(property)}.`);
        }

        return (method as (...args: unknown[]) => unknown).apply(adapter, args);
      };
    },
  });
}

function enforceSingleSession(adapter: Adapter): Adapter {
  return {
    ...adapter,
    async createSession(session: AdapterSession) {
      if (!adapter.createSession) {
        throw new Error("Auth.js session adapter is unavailable.");
      }

      await getDb()
        .delete(sessions)
        .where(eq(sessions.userId, session.userId));

      return adapter.createSession(session);
    },
  };
}

async function persistRole(userId: string, email: string | null | undefined) {
  const role = roleForEmail(email);

  await getDb().update(users).set({ role }).where(eq(users.id, userId));

  return role;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: lazyAdapter(),
  session: {
    strategy: "database",
  },
  providers: [Google],
  trustHost: true,
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") {
        return false;
      }

      return profile?.email_verified === true;
    },
    async session({ session, user }) {
      const role = roleForEmail(user.email);

      if (user.role !== role) {
        await persistRole(user.id, user.email);
      }

      session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        emailVerified: user.emailVerified,
        role,
      };

      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.id) {
        return;
      }

      await persistRole(user.id, user.email);
    },
  },
});
