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

import { publicProcedure } from "../../index";

const inputSchema = object({
  id: string(),
  data: record(string(), unknown()),
});

export const updateApplicationData = publicProcedure
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

    // "draft" (first submission) and "submitted" (editing an already-submitted
    // application before review starts) can both still be written; once an
    // admin has moved it into review or decided it, the applicant's own
    // edits would silently undo that review state, so those stay locked.
    if (app.status !== "draft" && app.status !== "submitted") {
      throw new ORPCError("BAD_REQUEST", {
        message: "This application is under review and can no longer be edited",
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
    // First successful save transitions draft -> submitted so the applicant
    // can't keep re-"submitting" the same application indefinitely; editing
    // it again afterward is a re-save (status stays "submitted", not reset
    // back to "draft").
    await context.db
      .update(g1Application)
      .set({ currentSubversion: latestSub, status: "submitted" })
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
