import * as v from "valibot";

import { PhoneNumberSchema } from "../../../shared/phone";
import { subversion1Schema } from "../v1.1/schema";

/**
 * v1.1's complete schema plus the v1.2 delta (`guardianWhatsapp`) — always
 * spread the previous subversion's entries, never redeclare them.
 */
export const subversion2Schema = v.object({
  ...subversion1Schema.entries,
  guardianWhatsapp: v.optional(PhoneNumberSchema),
});

export type Subversion2Data = v.InferOutput<typeof subversion2Schema>;
