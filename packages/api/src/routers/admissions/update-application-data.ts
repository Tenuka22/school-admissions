import {
  getLatestSubversionNumber,
  getFieldsForSubversion,
} from "@school-admissions/db/constants/admissionVersions/index";
import {
  g1Application,
  g1ApplicationData,
  g1ApplicationVersionLog,
} from "@school-admissions/db/schema/admissions";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { object, record, string, unknown } from "valibot";

import { protectedProcedure } from "../../index";

const inputSchema = object({
  id: string(),
  data: record(string(), unknown()),
});

export const updateApplicationData = protectedProcedure
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

    if (app.userId !== context.session?.user.id) {
      throw new ORPCError("FORBIDDEN");
    }

    if (app.status !== "draft") {
      throw new ORPCError("BAD_REQUEST", {
        message: "Only draft applications can be updated",
      });
    }

    const latestSub = getLatestSubversionNumber(app.versionKey);

    const latestFields = getFieldsForSubversion(app.versionKey, latestSub);
    if (!latestFields) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Could not load fields for latest subversion",
      });
    }

    const missingRequired = latestFields.filter((f) => {
      if (!f.required) {
        return false;
      }
      const val = input.data[f.key];
      return val === undefined || val === null || val === "";
    });

    if (missingRequired.length > 0) {
      throw new ORPCError("BAD_REQUEST", {
        message: `Missing required fields: ${missingRequired.map((f) => f.label).join(", ")}`,
      });
    }

    const dataId = crypto.randomUUID();
    await context.db.insert(g1ApplicationData).values({
      id: dataId,
      applicationId: app.id,
      subversion: latestSub,
      data: input.data,
    });

    const bumped = app.currentSubversion < latestSub;
    await context.db
      .update(g1Application)
      .set({ currentSubversion: latestSub })
      .where(eq(g1Application.id, app.id));

    if (bumped) {
      const logId = crypto.randomUUID();
      await context.db.insert(g1ApplicationVersionLog).values({
        id: logId,
        applicationId: app.id,
        subversion: latestSub,
        trigger: "userUpdate",
        description: `Application updated from subversion ${app.currentSubversion} to ${latestSub}`,
      });
    }

    return {
      id: app.id,
      applicationNumber: app.applicationNumber,
      currentSubversion: latestSub,
      dataSubversion: latestSub,
      bumped,
    };
  });
