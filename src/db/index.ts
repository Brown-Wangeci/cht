import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

/**
 * For Transaction Pooler (Port 6543), we must set 'prepare: false' 
 * because poolers do not support prepared statements across different connections.
 */
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema, logger: true });