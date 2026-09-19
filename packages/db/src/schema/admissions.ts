import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-valibot";
import * as v from "valibot";

import { user } from "./auth";
import { brand } from "./brand";
import type { Brand } from "./brand";

// ─── Branded IDs ────────────────────────────────────────────────────────────

export type G1ApplicationId = Brand<string, "G1ApplicationId">;
export const g1ApplicationIdSchema = v.pipe(
  v.string(),
  brand<string, "G1ApplicationId">()
);

export type G1ApplicationDataId = Brand<string, "G1ApplicationDataId">;
export const g1ApplicationDataIdSchema = v.pipe(
  v.string(),
  brand<string, "G1ApplicationDataId">()
);

export type G1ApplicationVersionLogId = Brand<
  string,
  "G1ApplicationVersionLogId"
>;
export const g1ApplicationVersionLogIdSchema = v.pipe(
  v.string(),
  brand<string, "G1ApplicationVersionLogId">()
);

// ─── Constants ──────────────────────────────────────────────────────────────

export const APPLICATION_STATUSES = [
  "draft",
  "submitted",
  "underReview",
  "accepted",
  "rejected",
  "waitlisted",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

// ─── G1 Application (permanent record) ─────────────────────────────────────

/**
 * The main application record. Tracks which version/subversion the
 * application was created against and its current status.
 */
export const g1Application = pgTable(
  "g1_application",
  {
    id: text("id").primaryKey(),
    /** Reference to the user who submitted/owns this application */
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Application number — globally unique, e.g. "G1/2027/001" */
    applicationNumber: text("application_number").notNull().unique(),
    /** Which admission version this application was created under */
    versionKey: text("version_key").notNull(),
    /** Which subversion the application data currently reflects */
    currentSubversion: integer("current_subversion").notNull().default(1),
    /** Application status */
    status: text("status")
      .$type<ApplicationStatus>()
      .notNull()
      .default("draft"),
    /** Notes from admin review */
    reviewNotes: text("review_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("g1_app_user_idx").on(table.userId),
    index("g1_app_status_idx").on(table.status),
    index("g1_app_version_idx").on(table.versionKey),
    unique("g1_app_number_unique").on(table.applicationNumber),
  ]
);

// ─── G1 Application Data (JSONB per subversion) ─────────────────────────────

/**
 * Stores the actual field values as a JSONB blob.
 *
 * Each row represents the application data at a specific subversion.
 * When a user creates or updates their application, a new row is inserted
 * (never updated in place). This preserves the full history of what data
 * was submitted at each subversion point.
 *
 * The JSONB structure matches the fields defined in the admission version
 * constants for that subversion. For example:
 * ```json
 * {
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "dateOfBirth": "2021-05-15",
 *   "gender": "Male",
 *   "hasMedicalConditions": false,
 *   "fatherName": "Peter Doe"
 * }
 * ```
 */
export const g1ApplicationData = pgTable(
  "g1_application_data",
  {
    id: text("id").primaryKey(),
    applicationId: text("application_id")
      .notNull()
      .references(() => g1Application.id, { onDelete: "cascade" }),
    /** Which subversion this data snapshot reflects */
    subversion: integer("subversion").notNull(),
    /** JSONB blob of field values — shape defined by admission version constants */
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("g1_data_app_idx").on(table.applicationId),
    index("g1_data_subversion_idx").on(table.subversion),
  ]
);

// ─── G1 Application Version Log (audit trail) ───────────────────────────────

/**
 * Audit trail tracking when subversions were applied to an application.
 * One row per subversion bump.
 */
export const g1ApplicationVersionLog = pgTable(
  "g1_application_version_log",
  {
    id: text("id").primaryKey(),
    applicationId: text("application_id")
      .notNull()
      .references(() => g1Application.id, { onDelete: "cascade" }),
    /** The subversion that was applied */
    subversion: integer("subversion").notNull(),
    /** What triggered this version bump: "userUpdate" | "adminAction" | "autoMapping" */
    trigger: text("trigger").notNull(),
    /** Optional description of what changed */
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("g1_vlog_app_idx").on(table.applicationId)]
);

// ─── Valibot Schemas ────────────────────────────────────────────────────────

const applicationStatusSchema = v.picklist(APPLICATION_STATUSES);

// G1 Application
const g1ApplicationColumnRefinements = {
  id: () => g1ApplicationIdSchema,
  userId: () => v.pipe(v.string(), v.minLength(1)),
  applicationNumber: () => v.pipe(v.string(), v.minLength(1)),
  versionKey: () => v.pipe(v.string(), v.minLength(1)),
  currentSubversion: () => v.pipe(v.number(), v.minValue(1)),
  status: () => applicationStatusSchema,
  reviewNotes: () => v.optional(v.nullable(v.string())),
};

export const g1ApplicationSelectSchema = createSelectSchema(
  g1Application,
  g1ApplicationColumnRefinements
);
export const g1ApplicationInsertSchema = createInsertSchema(
  g1Application,
  g1ApplicationColumnRefinements
);

// G1 Application Data
const g1ApplicationDataColumnRefinements = {
  id: () => g1ApplicationDataIdSchema,
  applicationId: () => g1ApplicationIdSchema,
  subversion: () => v.pipe(v.number(), v.minValue(1)),
  data: () => v.record(v.string(), v.unknown()),
};

export const g1ApplicationDataSelectSchema = createSelectSchema(
  g1ApplicationData,
  g1ApplicationDataColumnRefinements
);
export const g1ApplicationDataInsertSchema = createInsertSchema(
  g1ApplicationData,
  g1ApplicationDataColumnRefinements
);

// G1 Application Version Log
const g1ApplicationVersionLogColumnRefinements = {
  id: () => g1ApplicationVersionLogIdSchema,
  applicationId: () => g1ApplicationIdSchema,
  subversion: () => v.pipe(v.number(), v.minValue(1)),
  trigger: () => v.pipe(v.string(), v.minLength(1)),
  description: () => v.optional(v.nullable(v.string())),
};

export const g1ApplicationVersionLogSelectSchema = createSelectSchema(
  g1ApplicationVersionLog,
  g1ApplicationVersionLogColumnRefinements
);
export const g1ApplicationVersionLogInsertSchema = createInsertSchema(
  g1ApplicationVersionLog,
  g1ApplicationVersionLogColumnRefinements
);

// ─── Re-export convenience types ────────────────────────────────────────────

export { applicationStatusSchema };
