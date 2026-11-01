import type { DefaultSession } from "next-auth";

import type { UserRole } from "@/db/schema";

declare module "next-auth" {
  interface User {
    role?: UserRole;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role?: UserRole;
  }
}
