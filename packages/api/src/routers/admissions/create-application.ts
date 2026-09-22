import {
  ADMISSION_VERSIONS,
  getLatestSubversionNumber,
  getFieldsForSubversion,
} from "@school-admissions/db/constants/admissionVersions/index";
import {
  g1Application,
  g1ApplicationData,
  g1ApplicationInsertSchema,
} from "@school-admissions/db/schema/admissions";
import { ORPCError } from "@orpc/server";
import { like } from "drizzle-orm";
import { pick } from "valibot";

import { publicProcedure } from "../../index";

const inputSchema = pick(g1ApplicationInsertSchema, ["versionKey"]);

export const createApplication = publicProcedure
  .input(inputSchema)
  .handler(async ({ input, context }) => {
    const version = ADMISSION_VERSIONS[input.versionKey];
    if (!version) {
      throw new ORPCError("BAD_REQUEST", {
        message: `Unknown admission version key: "${input.versionKey}"`,
      });
    }

    const latestSub = getLatestSubversionNumber(input.versionKey);
    if (latestSub === 0) {
      throw new ORPCError("BAD_REQUEST", {
        message: `Version "${input.versionKey}" has no subversions`,
      });
    }

    // No login required to start an application — when a session exists
    // (e.g. an admin testing the flow) we still record it, but the created
    // application's `id` is itself the access key for anonymous use.
    const userId = context.session?.user.id ?? null;

    // Generate application number: G1/{intakeYear}/{sequential}
    const year = version.intakeYear;
    const existing = await context.db
      .select({ applicationNumber: g1Application.applicationNumber })
      .from(g1Application)
      .where(like(g1Application.applicationNumber, `G1/${year}/%`));

    const nextSeq = existing.length + 1;
    const applicationNumber = `G1/${year}/${String(nextSeq).padStart(3, "0")}`;

    const id = crypto.randomUUID();

    const [record] = await context.db
      .insert(g1Application)
      .values({
        id,
        userId,
        applicationNumber,
        versionKey: input.versionKey,
        currentSubversion: latestSub,
        status: "draft",
      })
      .returning();

    if (!record) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    // Create initial empty data row for the latest subversion
    const dataId = crypto.randomUUID();
    const fields = getFieldsForSubversion(input.versionKey, latestSub);
    const emptyData: Record<string, unknown> = {};
    if (fields) {
      for (const field of fields) {
        emptyData[field.key] = field.defaultValue ?? null;
      }
    }

    await context.db.insert(g1ApplicationData).values({
      id: dataId,
      applicationId: id,
      subversion: latestSub,
      data: emptyData,
    });

    return {
      id: record.id,
      applicationNumber: record.applicationNumber,
      versionKey: record.versionKey,
      currentSubversion: record.currentSubversion,
      status: record.status,
      createdAt: record.createdAt.toISOString(),
    };
  });
