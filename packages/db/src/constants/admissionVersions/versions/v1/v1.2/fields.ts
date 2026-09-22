import type { AdmissionFieldDefinition } from "../../../shared/types";
import { subversion1Fields } from "../v1.1/fields";
import { subversion2Delta } from "./delta";

/** v1.1's complete field list plus v1.2's delta (never edit v1.1/fields.ts). */
export const subversion2Fields: AdmissionFieldDefinition[] = [
  ...subversion1Fields,
  ...(subversion2Delta.added ?? []),
];
