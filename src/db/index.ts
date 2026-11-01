import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "./schema";

export type Database = NeonHttpDatabase<typeof schema>;

let database: Database | undefined;

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb(): Database {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add your Neon connection string to .env.local.",
    );
  }

  if (!database) {
    database = drizzle(neon(url), { schema });
  }

  return database;
}
