import {
  getLatestSubversionNumber,
  calculateMigrationRequirements,
  getFieldsForSubversion,
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

import { publicProcedure } from "../../index";

const inputSchema = pick(g1ApplicationSelectSchema, ["id"]);

export const getApplication = publicProcedure
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

    // No login required -- the application `id` (an unguessable UUID) is
    // the access key, matching the public application flow.
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
    const { newFields, newlyRequired, removedFieldKeys, renamed } = updateNeeded
      ? calculateMigrationRequirements(
          app.versionKey,
          app.currentSubversion,
          latestSub
        )
      : { newFields: [], newlyRequired: [], removedFieldKeys: [], renamed: [] };

    // `removedFieldKeys` only has keys (the fields no longer exist in the
    // latest definitions to look their labels up from) -- resolve labels
    // from the subversion the application is currently on, where they still
    // exist.
    const removedFields =
      removedFieldKeys.length > 0
        ? (getFieldsForSubversion(app.versionKey, app.currentSubversion) ?? []).filter((f) =>
            removedFieldKeys.includes(f.key)
          )
        : [];

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
      removedFields,
      renamed: renamed.map((r) => ({ oldKey: r.oldKey, field: r.field })),
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
