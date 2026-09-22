import { drizzle } from "drizzle-orm/node-postgres";

import type { DatabaseConfig } from "./config";

// No `schema` config here: nothing in this codebase uses drizzle's
// relational query builder (`db.query.*`), only explicit
// `.select().from().where()` -- and drizzle-orm v1's relational schema
// config requires `defineRelations`, which better-auth's own
// `drizzleAdapter` (see @school-admissions/auth) does not produce.
export const createDb = (env: DatabaseConfig) => drizzle(env.DATABASE_URL);

export type Database = ReturnType<typeof createDb>;
