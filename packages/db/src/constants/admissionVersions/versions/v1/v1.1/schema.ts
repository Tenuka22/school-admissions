import * as v from "valibot";

import { DistrictSchema, DivisionSchema } from "../../../shared/divisions";
import {
  EducationMediumSchema,
  GenderSchema,
  GuardianRelationshipSchema,
  LocationSourceSchema,
  ReligionSchema,
} from "../../../shared/enums";
import { isValidSriLankanNic } from "../../../shared/nic";
import { PhoneNumberSchema } from "../../../shared/phone";
import { DATE_OF_BIRTH_RULE } from "./fields";

/**
 * Complete G1 2027 application schema — every field of the source
 * aloysius-g1 form's step schemas (applicant, guardian, residence,
 * declaration) merged into one object, plus the location-map capture.
 * Categories live separately (the marking system owns them).
 */

export const subversion1Schema = v.object({
  // ── Location step (map capture) ─────────────────────────────────────────
  locationLabel: v.optional(v.string()),
  locationAddress: v.optional(v.string()),
  locationLatitude: v.optional(v.number()),
  locationLongitude: v.optional(v.number()),
  locationSource: v.optional(LocationSourceSchema),

  // ── Applicant step ──────────────────────────────────────────────────────
  fullName: v.pipe(v.string(), v.nonEmpty("Full name is required")),
  sinhalaName: v.pipe(
    v.string(),
    v.nonEmpty("Full name (Sinhala) is required")
  ),
  gender: GenderSchema,
  religion: ReligionSchema,
  educationMedium: EducationMediumSchema,
  dateOfBirth: v.pipe(
    v.string(),
    v.isoDate("Invalid date format"),
    v.check(
      (value) => value >= DATE_OF_BIRTH_RULE.minDate && value <= DATE_OF_BIRTH_RULE.maxDate,
      DATE_OF_BIRTH_RULE.message
    )
  ),
  birthCertificateNumber: v.pipe(
    v.string(),
    v.nonEmpty("Birth certificate number is required")
  ),

  // ── Guardian step ───────────────────────────────────────────────────────
  guardianRelationship: GuardianRelationshipSchema,
  guardianFullName: v.pipe(v.string(), v.nonEmpty("Full name is required")),
  guardianSinhalaName: v.pipe(
    v.string(),
    v.nonEmpty("Full name (Sinhala) is required")
  ),
  guardianNic: v.pipe(
    v.string(),
    v.nonEmpty("NIC number is required"),
    v.check(
      isValidSriLankanNic,
      "Enter a valid Sri Lankan NIC: 9 digits followed by V/X, or 12 digits, encoding a real birth date"
    )
  ),
  guardianPhone: PhoneNumberSchema,
  guardianEmail: v.optional(
    v.pipe(v.string(), v.email("Enter a valid email address"))
  ),

  // ── Residence step ──────────────────────────────────────────────────────
  permanentAddressEn: v.pipe(
    v.string(),
    v.nonEmpty("Permanent address (English) is required")
  ),
  permanentAddressSi: v.pipe(
    v.string(),
    v.nonEmpty("Permanent address (Sinhala) is required")
  ),
  // g1 forces current = permanent while sameAsPermanent holds (normalizeDraft),
  // so both are always populated — required regardless of the toggle.
  currentAddressEn: v.pipe(
    v.string(),
    v.nonEmpty("Current address (English) is required")
  ),
  currentAddressSi: v.pipe(
    v.string(),
    v.nonEmpty("Current address (Sinhala) is required")
  ),
  sameAsPermanent: v.optional(v.boolean()),
  district: DistrictSchema,
  division: DivisionSchema,
  gnDivision: v.pipe(
    v.string(),
    v.nonEmpty("Grama Niladhari division is required")
  ),
  electoralDistrict: v.pipe(
    v.string(),
    v.nonEmpty("Electoral district is required")
  ),

  // ── Declaration step ────────────────────────────────────────────────────
  declarationConfirmed: v.literal(
    true,
    "You must confirm the information is accurate"
  ),
  declarationConsent: v.literal(
    true,
    "You must consent to the information being used"
  ),
});

export type Subversion1Data = v.InferOutput<typeof subversion1Schema>;
