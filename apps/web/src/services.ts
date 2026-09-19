import { createAuth } from "@school-admissions/auth";
import { createDb } from "@school-admissions/db";

import { ENV } from "./env.server";

export const db = createDb(ENV);
export const auth = createAuth(ENV, db);
