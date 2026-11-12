import "server-only";

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  sql?: ReturnType<typeof postgres>;
  database?: Database;
};

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function postgresOptions(url: string): postgres.Options<Record<string, never>> {
  const pooled =
    url.includes("pooler.supabase.com") ||
    url.includes("pgbouncer=true") ||
    /:6543(\/|\?|$)/.test(url);

  return {
    // Supabase's transaction pooler rejects prepared statements.
    prepare: !pooled,
    max: process.env.VERCEL ? 1 : 10,
    idle_timeout: 20,
    connect_timeout: 10,
  };
}

export function getDb(): Database {
  const url = process.env.DATABASE_URL?.trim();

  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add your Supabase Postgres connection string to .env.local.",
    );
  }

  if (!globalForDb.database) {
    const sql = globalForDb.sql ?? postgres(url, postgresOptions(url));
    globalForDb.sql = sql;
    globalForDb.database = drizzle(sql, { schema });
  }

  return globalForDb.database;
}
