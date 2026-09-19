import { drizzle } from "drizzle-orm/node-postgres";

import type { DatabaseConfig } from "./config";
import {
  g1Application,
  g1ApplicationData,
  g1ApplicationVersionLog,
} from "./schema/admissions";
import {
  account,
  accountRelations,
  session,
  sessionRelations,
  user,
  userRelations,
  verification,
} from "./schema/auth";

const schema = {
  account,
  accountRelations,
  g1Application,
  g1ApplicationData,
  g1ApplicationVersionLog,
  session,
  sessionRelations,
  user,
  userRelations,
  verification,
};

export const createDb = (env: DatabaseConfig) =>
  drizzle(env.DATABASE_URL, { schema });

export type Database = ReturnType<typeof createDb>;
