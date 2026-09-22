import { g1Application } from "@school-admissions/db/schema/admissions";
import { desc, eq } from "drizzle-orm";

import { protectedProcedure } from "../../index";

export const listApplications = protectedProcedure.handler(
  async ({ context }) => {
    const rows = await context.db
      .select()
      .from(g1Application)
      .where(eq(g1Application.userId, context.session.user.id))
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
