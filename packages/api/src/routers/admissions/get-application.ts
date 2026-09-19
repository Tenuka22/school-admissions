import {
  getLatestSubversionNumber,
  getFieldsChangedBetweenSubversions,
} from "@school-admissions/db/constants/admissionVersions/index";
import {
  g1Application,
  g1ApplicationData,
  g1ApplicationVersionLog,
  g1ApplicationSelectSchema,
} from "@school-admissions/db/schema/admissions";
import { ORPCError } from "@orpc/server";
import { eq, desc } from "drizzle-orm";
import { pick } from "valibot";

import { protectedProcedure } from "../../index";

const inputSchema = pick(g1ApplicationSelectSchema, ["id"]);

export const getApplication = protectedProcedure
  .input(inputSchema)
  .handler(async ({ input, context }) => {
    const [app] = await context.db
      .select()
      .from(g1Application)
      .where(eq(g1Application.id, input.id))
      .limit(1);

    if (!app) {
      throw new ORPCError("NOT_FOUND", {
        message: "Application not found",
      });
    }

    // Get the latest data snapshot
    const [latestData] = await context.db
      .select()
      .from(g1ApplicationData)
      .where(eq(g1ApplicationData.applicationId, app.id))
      .orderBy(desc(g1ApplicationData.subversion))
      .limit(1);

    // Get latest subversion for this version
    const latestSub = getLatestSubversionNumber(app.versionKey);

    // Check if update is needed
    const updateNeeded = app.currentSubversion < latestSub;
    const { newFields, newlyRequired } = updateNeeded
      ? getFieldsChangedBetweenSubversions(
          app.versionKey,
          app.currentSubversion,
          latestSub
        )
      : { newFields: [], newlyRequired: [] };

    // Get version log
    const versionLog = await context.db
      .select()
      .from(g1ApplicationVersionLog)
      .where(eq(g1ApplicationVersionLog.applicationId, app.id))
      .orderBy(desc(g1ApplicationVersionLog.createdAt));

    return {
      id: app.id,
      applicationNumber: app.applicationNumber,
      versionKey: app.versionKey,
      currentSubversion: app.currentSubversion,
      latestSubversion: latestSub,
      status: app.status,
      reviewNotes: app.reviewNotes,
      data: latestData?.data ?? null,
      dataSubversion: latestData?.subversion ?? null,
      updateNeeded,
      newFields,
      newlyRequired,
      versionLog: versionLog.map((log) => ({
        subversion: log.subversion,
        trigger: log.trigger,
        description: log.description,
        createdAt: log.createdAt.toISOString(),
      })),
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    };
  });
