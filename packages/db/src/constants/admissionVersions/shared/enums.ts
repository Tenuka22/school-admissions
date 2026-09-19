import * as v from "valibot";

/**
 * Enum option values — exactly the values the source aloysius-g1 form
 * accepts (validation.ts / i18n labels). Bilingual display labels live in
 * the UI layer; only the persisted ids are defined here.
 */

// ─── Applicant step ─────────────────────────────────────────────────────────

export const GenderSchema = v.picklist(["Female", "Male"]);
export type Gender = v.InferOutput<typeof GenderSchema>;

export const ReligionSchema = v.picklist([
  "Catholic",
  "Christian",
  "Buddhist",
  "Islam",
  "Hindu",
]);
export type Religion = v.InferOutput<typeof ReligionSchema>;

export const EducationMediumSchema = v.picklist(["Sinhala", "Tamil"]);
export type EducationMedium = v.InferOutput<typeof EducationMediumSchema>;

// ─── Guardian step ──────────────────────────────────────────────────────────

export const GuardianRelationshipSchema = v.picklist([
  "Mother",
  "Father",
  "Guardian",
]);
export type GuardianRelationship = v.InferOutput<
  typeof GuardianRelationshipSchema
>;

// ─── Location step (map) ────────────────────────────────────────────────────

/** How a captured location point was obtained. */
export const LocationSourceSchema = v.picklist([
  "manual",
  "device",
  "map",
  "network",
  "admin",
]);
export type LocationSource = v.InferOutput<typeof LocationSourceSchema>;
