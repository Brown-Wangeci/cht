import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
}

/**
 * For Transaction Pooler (Port 6543), we must set 'prepare: false'
 * because poolers do not support prepared statements across different connections.
 *
 * The client is cached on globalThis so dev hot-reloads don't open a new pool each time.
 */
const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };

const client =
  globalForDb.pgClient ??
  postgres(connectionString, {
    prepare: false,
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
  });

if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });

export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
