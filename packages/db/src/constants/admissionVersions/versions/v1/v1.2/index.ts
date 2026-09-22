import type { SubversionModule } from "../../../shared/types";
import { v1_1 } from "../v1.1";
import { subversion2Delta } from "./delta";
import { subversion2Fields } from "./fields";
import { subversion2Schema } from "./schema";

export const v1_2: SubversionModule<typeof subversion2Schema> = {
  subversion: 2,
  description: "Adds an optional guardian WhatsApp number, separate from the primary phone number",
  createdAt: "2026-09-20T00:00:00.000Z",
  schema: subversion2Schema,
  fields: subversion2Fields,
  delta: subversion2Delta,
  // Location capture behaviour is unchanged from v1.1 — carried forward
  // rather than duplicated, since nothing in this subversion touches it.
  locationCapture: v1_1.locationCapture,
};
