import type { Session } from "@school-admissions/auth";
import type { Database } from "@school-admissions/db";

export type Context = {
  session: Session | null;
  db: Database;
};
