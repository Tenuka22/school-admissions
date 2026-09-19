import type { SubversionModule } from "../../../shared/types";
import { subversion1Fields } from "./fields";
import { subversion1Schema } from "./schema";

export const v1_1: SubversionModule<typeof subversion1Schema> = {
  subversion: 1,
  description:
    "Complete G1 2027 application form — all steps (location, applicant, guardian, residence, declaration) with map capture and cascading divisions",
  createdAt: "2026-09-18T00:00:00.000Z",
  schema: subversion1Schema,
  fields: subversion1Fields,
  // Location step behaviour is version-driven: the form renders GPS capture,
  // a manual-entry popover (decimal + DMS) and map click-to-pin from this
  // config instead of hard-coding any of it.
  locationCapture: {
    enableGps: true,
    enableManualEntry: true,
    coordinateFormats: ["decimal", "dms"],
    enableMapPin: true,
    latitudeField: "locationLatitude",
    longitudeField: "locationLongitude",
    sourceField: "locationSource",
    labelField: "locationLabel",
    // The captured point is reverse-geocoded into a street address (with a
    // raw-coordinate fallback) and written to these fields — no typing.
    addressField: "locationAddress",
  },
};
