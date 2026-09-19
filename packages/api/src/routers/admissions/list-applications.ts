import { g1Application } from "@school-admissions/db/schema/admissions";
import { desc } from "drizzle-orm";

import { protectedProcedure } from "../../index";

export const listApplications = protectedProcedure.handler(
  async ({ context }) => {
    const rows = await context.db
      .select()
      .from(g1Application)
      .orderBy(desc(g1Application.createdAt));

    return rows.map((row) => ({
      id: row.id,
      applicationNumber: row.applicationNumber,
      versionKey: row.versionKey,
      currentSubversion: row.currentSubversion,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }
);
